import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";
import { checkGrounding } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OptimizeOut {
  optimizedJD: string;
  keyChanges: string[];
  atsScore: number;
  warnings: string[];
  hiddenRequirements: string[];
  applicationTips: string[];
  tailoringAdvice?: string[];
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
    const { jd, cv, language } = await req.json();
    if (!jd) return new Response(JSON.stringify({ error: "Job description is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if ((typeof jd === "string" && jd.length > 15000) || (typeof cv === "string" && cv.length > 30000)) {
      return new Response(JSON.stringify({ error: "Payload too large." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language === "french" ? "French" : "English";
    const langInstruction = language === "french"
      ? `\n\nIMPORTANT: Write ALL output text in French.`
      : "";

    const { output } = await runThreePass<OptimizeOut>({
      systemPrompt: `You are an ATS optimisation expert. Given a job description, analyse and rewrite it for ATS screening. ${cv ? "Also consider the provided CV to suggest how the candidate should tailor their application." : ""}

Return ONLY valid JSON:
{
  "optimizedJD": string,
  "keyChanges": [string],
  "atsScore": number 1-100,
  "warnings": [string],
  "hiddenRequirements": [string],
  "applicationTips": [string]${cv ? ',\n  "tailoringAdvice": [string]' : ""}
}${langInstruction}`,
      userPrompt: `Job Description:\n${jd}${cv ? `\n\nCandidate CV:\n${cv}` : ""}\n\nOutput Language: ${lang}`,
      critiquePrompt:
        "Flag any hidden requirement or tailoring tip that isn't clearly supported by the JD (or the CV, if present). Flag any keyChange that removes actual JD information rather than clarifying it.",
      parse: (raw) => tryParseJson<OptimizeOut>(raw),
      validate: (o) => {
        const issues: string[] = [];
        if (typeof o.atsScore !== "number" || o.atsScore < 1 || o.atsScore > 100) issues.push("atsScore must be 1-100");
        if (!o.optimizedJD || o.optimizedJD.length < 100) issues.push("optimizedJD too short");
        const g = checkGrounding(
          [...(o.hiddenRequirements ?? []), ...(o.tailoringAdvice ?? [])].join(" "),
          `${jd}\n${cv ?? ""}`,
          0.3
        );
        if (!g.ok) issues.push(...g.issues);
        return issues.length ? { ok: false, issues } : { ok: true };
      },
      jsonMode: true,
      temperature: 0.3,
    });

    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("optimize-jd error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
