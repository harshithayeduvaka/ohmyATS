import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runEnsemble, mean } from "../_shared/ensemble.ts";
import { tryParseJson } from "../_shared/ai-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EvalOut {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  tips: string[];
  rubricHits?: string[];
  rubricMisses?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const _supaAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const _token = authHeader.replace("Bearer ", "").trim();
    const { data: _claims, error: _claimsErr } = await _supaAuth.auth.getClaims(_token);
    if (_claimsErr || !_claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { cv, jd, role, question, answer, rubric, language } = await req.json();

    if (!question || !answer) {
      return new Response(
        JSON.stringify({ error: "Question and answer are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      (typeof cv === "string" && cv.length > 30000) ||
      (typeof jd === "string" && jd.length > 15000) ||
      (typeof question === "string" && question.length > 5000) ||
      (typeof answer === "string" && answer.length > 5000) ||
      (typeof role === "string" && role.length > 500)
    ) {
      return new Response(
        JSON.stringify({ error: "Payload too large." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language === "french" ? "French" : "English";
    const langInstruction = language === "french"
      ? `\n\nIMPORTANT: Write ALL output (verdict, strengths, weaknesses, idealAnswer, tips, rubricHits, rubricMisses) in French.`
      : "";

    const rubricArr: string[] = Array.isArray(rubric) ? rubric.filter((r) => typeof r === "string") : [];
    const rubricBlock = rubricArr.length > 0
      ? `\n\nSCORING RUBRIC (score against each criterion — an answer only scores 8+ if it hits most of these):\n${rubricArr.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nIn "rubricHits" list criteria the answer clearly meets. In "rubricMisses" list criteria it fails or partially meets. The score MUST reflect the ratio of hits to total criteria: <40% hits => 3-4, 40-60% => 5-6, 60-80% => 7, 80-100% with specifics => 8-9, only near-perfect with quantified outcomes => 10.`
      : `\n\nNo rubric provided — score harshly. Only structured, specific, quantified answers score 8+. Most answers are 4-6/10.`;

    const systemPrompt = `You are a brutally honest senior hiring manager evaluating an interview answer.

Respond with ONLY valid JSON:
{
  "score": 0-10,
  "verdict": "one-line verdict",
  "strengths": ["what was good"],
  "weaknesses": ["what was missing or weak"],
  "idealAnswer": "STAR-format ideal answer with specifics",
  "tips": ["actionable improvement tips"],
  "rubricHits": ["criteria met"],
  "rubricMisses": ["criteria missed"]
}${rubricBlock}${langInstruction}`;

    const userContent = `Role: ${role || "General"}\n${jd ? `JD: ${jd}\n` : ""}${cv ? `CV: ${cv}\n` : ""}\nQuestion: ${question}\nCandidate's Answer: ${answer}\n\nOutput Language: ${lang}`;

    // Ensemble: two models score in parallel, reconcile by averaging score and
    // taking the pro model's qualitative fields (more reliable narrative).
    const { output, agreement } = await runEnsemble<EvalOut>({
      systemPrompt,
      userPrompt: userContent,
      models: ["pro", "flash"],
      parse: (raw) => {
        const p = tryParseJson<EvalOut>(raw);
        if (!p || typeof p.score !== "number") return null;
        return p;
      },
      reconcile: (results) => {
        // Score: average, clamped to 0-10 and rounded to 1 decimal.
        const scores = results.map((r) => Math.max(0, Math.min(10, r.score)));
        const avgScore = Math.round(mean(scores) * 10) / 10;
        // Prefer the first result (pro model) for narrative fields.
        const primary = results[0];
        // Union strengths/weaknesses/tips/rubric across members.
        const unionUnique = (key: keyof EvalOut): string[] => {
          const set = new Map<string, string>();
          for (const r of results) {
            const arr = (r[key] as string[]) ?? [];
            for (const s of arr) {
              const k = s.toLowerCase().trim();
              if (k && !set.has(k)) set.set(k, s);
            }
          }
          return [...set.values()];
        };
        return {
          score: avgScore,
          verdict: primary.verdict,
          strengths: unionUnique("strengths").slice(0, 6),
          weaknesses: unionUnique("weaknesses").slice(0, 6),
          idealAnswer: primary.idealAnswer,
          tips: unionUnique("tips").slice(0, 6),
          rubricHits: unionUnique("rubricHits").slice(0, 10),
          rubricMisses: unionUnique("rubricMisses").slice(0, 10),
        };
      },
      jsonMode: true,
      temperature: 0.2,
    });

    return new Response(JSON.stringify({ ...output, _ensembleAgreement: agreement }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out." }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("evaluate-answer error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = /429/.test(msg) ? 429 : /402/.test(msg) ? 402 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
