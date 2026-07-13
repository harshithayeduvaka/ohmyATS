import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KwItem { keyword: string; importance: "critical" | "high" | "medium"; category?: string }
interface KwOut {
  hardSkills: KwItem[];
  softSkills: KwItem[];
  tools: KwItem[];
  certifications: KwItem[];
  industryTerms: KwItem[];
  actionVerbs: string[];
  summary: string;
  resumeTips: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claims, error } = await supa.auth.getClaims(authHeader.replace("Bearer ", "").trim());
    if (error || !claims?.claims) throw new Error("bad claims");
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { jd } = await req.json();
    if (!jd) return new Response(JSON.stringify({ error: "Job description is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (typeof jd === "string" && jd.length > 15000) {
      return new Response(JSON.stringify({ error: "Payload too large. JD must be ≤ 15000 chars." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const jdLower = String(jd).toLowerCase();

    const { output } = await runThreePass<KwOut>({
      systemPrompt: `You are a keyword extraction specialist for ATS systems. Extract and categorise EVERY important keyword actually present in the JD. Never invent keywords. Return valid JSON only with the schema:
{
  "hardSkills": [{"keyword": string, "importance": "critical"|"high"|"medium", "category": string}],
  "softSkills": [{"keyword": string, "importance": "critical"|"high"|"medium"}],
  "tools": [{"keyword": string, "importance": "critical"|"high"|"medium"}],
  "certifications": [{"keyword": string, "importance": "critical"|"high"|"medium"}],
  "industryTerms": [{"keyword": string, "importance": "critical"|"high"|"medium"}],
  "actionVerbs": [string],
  "summary": string,
  "resumeTips": [string]
}`,
      userPrompt: `Job Description:\n${jd}`,
      critiquePrompt:
        "Verify every extracted keyword literally appears in the JD (case-insensitive). Flag any hallucinated keyword. Flag critical requirements that are missing from the extraction (e.g. explicit tools, years, certifications).",
      parse: (raw) => tryParseJson<KwOut>(raw),
      validate: (o) => {
        const issues: string[] = [];
        const all: KwItem[] = [
          ...(o.hardSkills ?? []), ...(o.softSkills ?? []), ...(o.tools ?? []),
          ...(o.certifications ?? []), ...(o.industryTerms ?? []),
        ];
        const hallucinated = all
          .map((k) => k.keyword)
          .filter((k) => k && !jdLower.includes(k.toLowerCase().split("(")[0].trim()));
        if (hallucinated.length > 0) issues.push(`Not found in JD: ${hallucinated.slice(0, 10).join(", ")}`);
        if (all.length < 5) issues.push("Too few keywords extracted (<5). Extract more.");
        return issues.length ? { ok: false, issues } : { ok: true };
      },
      jsonMode: true,
      temperature: 0.2,
    });

    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-keywords error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
