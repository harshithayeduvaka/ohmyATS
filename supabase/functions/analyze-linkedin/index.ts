import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";
import { checkGrounding } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LinkedInOut {
  overallScore: number;
  scores: Record<string, number>;
  headline: { current: string; suggested: string; feedback: string };
  summary: { current: string; suggested: string; feedback: string };
  experienceIssues: { section: string; issue: string; fix: string }[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  contentStrategy: { postIdeas: string[]; engagementTips: string[]; networkingAdvice: string[] };
  ssiEstimate: { score: number; breakdown: Record<string, number>; tips: string[] };
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
    const { profileText, targetRole, industry } = await req.json();
    if (!profileText) return new Response(JSON.stringify({ error: "LinkedIn profile text is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (
      (typeof profileText === "string" && profileText.length > 30000) ||
      (typeof targetRole === "string" && targetRole.length > 500) ||
      (typeof industry === "string" && industry.length > 500)
    ) {
      return new Response(JSON.stringify({ error: "Payload too large." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { output } = await runThreePass<LinkedInOut>({
      systemPrompt: `You are a LinkedIn profile optimisation coach. Analyse the provided LinkedIn profile and give brutally honest, actionable feedback.${targetRole ? ` Target: ${targetRole}.` : ""}${industry ? ` Industry: ${industry}.` : ""}

Score harshly. Most profiles score 30-55. Only truly exceptional profiles score 70+.
CRITICAL: For EVERY weakness, provide a specific, copy-paste-ready fix (exact replacement text). Never invent achievements, employers, or metrics not in the profile.

Return ONLY valid JSON:
{
  "overallScore": number 1-100,
  "scores": {"headline": number, "summary": number, "experience": number, "skills": number, "keywords": number, "completeness": number},
  "headline": {"current": string, "suggested": string, "feedback": string},
  "summary": {"current": string, "suggested": string, "feedback": string},
  "experienceIssues": [{"section": string, "issue": string, "fix": string}],
  "missingKeywords": [string],
  "strengths": [string],
  "weaknesses": [string],
  "quickWins": [string],
  "contentStrategy": {"postIdeas": [string], "engagementTips": [string], "networkingAdvice": [string]},
  "ssiEstimate": {"score": number 1-100, "breakdown": {"professionalBrand": number, "rightPeople": number, "engageInsights": number, "buildRelationships": number}, "tips": [string]}
}`,
      userPrompt: `LinkedIn Profile:\n${profileText}`,
      critiquePrompt:
        "Flag any suggested headline/summary that fabricates employers, titles, metrics, or claims not in the profile. Flag scores that seem inflated (average profile should be 30-55). Flag any experienceIssues.fix that isn't concrete copy-paste text.",
      parse: (raw) => tryParseJson<LinkedInOut>(raw),
      validate: (o) => {
        const issues: string[] = [];
        if (typeof o.overallScore !== "number") issues.push("overallScore missing");
        if (o.overallScore > 85) issues.push("overallScore suspiciously high — rescore harshly");
        const suggested = `${o.headline?.suggested ?? ""}\n${o.summary?.suggested ?? ""}`;
        const g = checkGrounding(suggested, `${profileText}\n${targetRole ?? ""}\n${industry ?? ""}`, 0.35);
        if (!g.ok) issues.push(...g.issues);
        return issues.length ? { ok: false, issues } : { ok: true };
      },
      jsonMode: true,
      temperature: 0.3,
    });

    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-linkedin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
