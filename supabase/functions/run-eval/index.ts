// Eval harness edge function — runs pipeline pieces against fixtures
// and returns per-feature accuracy metrics. Owner-gated in the UI.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseCV, deterministicAtsScore } from "../_shared/ats-parser.ts";
import { checkBannedPhrases, checkGrounding, checkKeywordCoverage } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Fixture {
  id: string;
  label: string;
  cv: string;
  jd: string;
  truth: {
    atsBand: [number, number];
    mustHaveKeywords: string[];
    forbiddenClaims?: string[];
    companyName?: string;
    roleName?: string;
    roleFitVerdict?: "strong" | "moderate" | "weak";
  };
}

interface FixtureResult {
  id: string;
  label: string;
  ats: {
    predicted: number;
    band: [number, number];
    inBand: boolean;
    error: number; // distance from band, 0 if in band
  };
  keywordExtraction: {
    predicted: string[];
    expected: string[];
    precision: number;
    recall: number;
    f1: number;
  };
  grounding: {
    outputSample: string;
    passed: boolean;
    issues: string[];
  };
  bannedPhrases: {
    passed: boolean;
    hits: string[];
  };
}

interface EvalReport {
  ranAt: string;
  fixtureCount: number;
  accuracy: {
    atsMae: number;              // mean absolute error from band
    atsInBandRate: number;       // 0..1
    keywordF1: number;           // macro-avg F1
    keywordPrecision: number;
    keywordRecall: number;
    groundingPassRate: number;
    bannedPhraseRate: number;    // proportion of fixtures with ≥1 banned phrase
    overall: number;             // 0..100 composite
  };
  fixtures: FixtureResult[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // JWT gate (same pattern as other functions)
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: claims, error } = await supa.auth.getClaims(token);
    if (error || !claims?.claims) throw new Error("bad claims");
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { fixtures } = (await req.json()) as { fixtures: Fixture[] };
    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      return new Response(JSON.stringify({ error: "fixtures[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: FixtureResult[] = [];

    for (const f of fixtures) {
      // ATS: deterministic score (fast, cheap, no AI call — baseline).
      const parsed = parseCV(f.cv);
      const { score: atsScore } = deterministicAtsScore(parsed);
      const [lo, hi] = f.truth.atsBand;
      const inBand = atsScore >= lo && atsScore <= hi;
      const error = inBand ? 0 : atsScore < lo ? lo - atsScore : atsScore - hi;

      // Keyword extraction: naive substring pass over JD tokens (baseline).
      // The real pipeline will call the AI extractor — this establishes the floor.
      const jdLower = f.jd.toLowerCase();
      const predicted = extractKeywordsBaseline(f.jd);
      const expected = f.truth.mustHaveKeywords;
      const predSet = new Set(predicted.map((k) => k.toLowerCase()));
      const expLower = expected.map((k) => k.toLowerCase());
      const tp = expLower.filter((k) => predSet.has(k) || jdLower.includes(k)).length;
      const fp = Math.max(0, predicted.length - tp);
      const fn = expLower.length - tp;
      const precision = predicted.length === 0 ? 0 : tp / (tp + fp);
      const recall = expLower.length === 0 ? 1 : tp / (tp + fn);
      const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

      // Grounding + banned phrases run against a sample output (the CV itself here —
      // once cover letter pipeline is wired we'll swap this to the generated letter).
      const outputSample = f.cv.slice(0, 800);
      const g = checkGrounding(outputSample, f.cv + "\n" + f.jd);
      const b = checkBannedPhrases(outputSample);
      const kw = checkKeywordCoverage(outputSample, expected, 0.3);

      results.push({
        id: f.id,
        label: f.label,
        ats: { predicted: atsScore, band: f.truth.atsBand, inBand, error },
        keywordExtraction: { predicted, expected, precision, recall, f1 },
        grounding: {
          outputSample: outputSample.slice(0, 200),
          passed: g.ok && kw.ok,
          issues: [
            ...(g.ok ? [] : g.issues),
            ...(kw.ok ? [] : kw.issues),
          ],
        },
        bannedPhrases: {
          passed: b.ok,
          hits: b.ok ? [] : b.issues,
        },
      });
    }

    // Aggregate
    const n = results.length;
    const atsMae = results.reduce((s, r) => s + r.ats.error, 0) / n;
    const atsInBandRate = results.filter((r) => r.ats.inBand).length / n;
    const keywordF1 = results.reduce((s, r) => s + r.keywordExtraction.f1, 0) / n;
    const keywordPrecision = results.reduce((s, r) => s + r.keywordExtraction.precision, 0) / n;
    const keywordRecall = results.reduce((s, r) => s + r.keywordExtraction.recall, 0) / n;
    const groundingPassRate = results.filter((r) => r.grounding.passed).length / n;
    const bannedPhraseRate = results.filter((r) => !r.bannedPhrases.passed).length / n;

    // Composite: weighted average, mapped to 0-100.
    const overall = Math.round(
      100 * (
        0.30 * atsInBandRate +
        0.30 * keywordF1 +
        0.25 * groundingPassRate +
        0.15 * (1 - bannedPhraseRate)
      )
    );

    const report: EvalReport = {
      ranAt: new Date().toISOString(),
      fixtureCount: n,
      accuracy: {
        atsMae: Math.round(atsMae * 10) / 10,
        atsInBandRate,
        keywordF1: Math.round(keywordF1 * 1000) / 1000,
        keywordPrecision: Math.round(keywordPrecision * 1000) / 1000,
        keywordRecall: Math.round(keywordRecall * 1000) / 1000,
        groundingPassRate: Math.round(groundingPassRate * 1000) / 1000,
        bannedPhraseRate: Math.round(bannedPhraseRate * 1000) / 1000,
        overall,
      },
      fixtures: results,
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-eval error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Baseline keyword extractor — deterministic, no AI call.
// Purpose: measures how much the AI extractor beats a naive baseline.
function extractKeywordsBaseline(jd: string): string[] {
  const tech = [
    "SQL","Python","Java","Go","Rust","Ruby","TypeScript","JavaScript","React","Node","Kubernetes",
    "Docker","AWS","GCP","Azure","BigQuery","Snowflake","Postgres","PostgreSQL","MySQL","MongoDB","Redis","Kafka",
    "Tableau","Looker","Power BI","dbt","Airflow","Spark","Terraform","Git",
    "Meta","Google Ads","TikTok","SEO","SEM","CRM","email","segmentation","A/B testing","attribution",
    "distributed systems","backend","frontend","full-stack","microservices",
    "brand marketing","performance marketing","team management","P&L",
    "French","English","Spanish","German",
  ];
  const found = tech.filter((t) => new RegExp(`\\b${t.replace(/[+.]/g, "\\$&")}\\b`, "i").test(jd));
  return found;
}
