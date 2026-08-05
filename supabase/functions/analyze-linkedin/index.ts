import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";
import { checkGrounding, combineValidators } from "../_shared/validators.ts";
import {
  parseLinkedInProfile,
  blendLinkedInScores,
  validateLinkedInSuggestions,
  checkNumbersGrounded,
} from "../_shared/profile-anchors.ts";


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

    const anchors = parseLinkedInProfile(profileText);
    const anchorFacts = `DETERMINISTIC PROFILE AUDIT (measured, not guessed — treat as ground truth):
- Headline: "${anchors.headline || "(none detected)"}" (${anchors.headlineLength} chars; LinkedIn limit 220)
- About: ${anchors.aboutWordCount} words / ${anchors.aboutLength} chars (limit 2600), first-person: ${anchors.firstPersonAbout}
- Experience bullets: ${anchors.bulletCount}, quantified: ${anchors.quantifiedBulletCount} (${Math.round(anchors.quantifiedRatio * 100)}%)
- Weak-verb bullets: ${anchors.weakVerbBullets.length}${anchors.weakVerbBullets.length ? ` — e.g. "${anchors.weakVerbBullets[0].slice(0, 120)}"` : ""}
- Skills listed: ${anchors.skillsCount}; dated roles: ${anchors.experienceEntryCount}; contact signal: ${anchors.hasContactSignal}
- Structural baseline scores: headline ${anchors.scores.headline}, summary ${anchors.scores.summary}, experience ${anchors.scores.experience}, skills ${anchors.scores.skills}, completeness ${anchors.scores.completeness}
Your section scores must stay within ±20 points of these baselines unless you justify it in the feedback.
Hard rules: suggested headline ≤220 chars and ≥40 chars; suggested About 90-350 words and ≤2600 chars; both must differ materially from the current text.`;

    const { output } = await runThreePass<LinkedInOut>({
      systemPrompt: `You are a LinkedIn profile optimisation coach. Analyse the provided LinkedIn profile and give brutally honest, actionable feedback.${targetRole ? ` Target: ${targetRole}.` : ""}${industry ? ` Industry: ${industry}.` : ""}

Score harshly. Most profiles score 30-55. Only truly exceptional profiles score 70+.
CRITICAL: For EVERY weakness, provide a specific, copy-paste-ready fix (exact replacement text). Never invent achievements, employers, or metrics not in the profile.

${anchorFacts}

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
        "Flag any suggested headline/summary that fabricates employers, titles, metrics, or claims not in the profile. Flag any number in the suggestions that does not appear in the profile. Flag a suggested headline over 220 chars or under 40 chars, and a suggested About outside 90-350 words. Flag scores that drift more than 20 points from the deterministic baselines. Flag any experienceIssues.fix that isn't concrete copy-paste text.",
      parse: (raw) => tryParseJson<LinkedInOut>(raw),
      validate: (o) => {
        const issues: string[] = [];
        if (typeof o.overallScore !== "number") issues.push("overallScore missing");
        if (o.overallScore > 85) issues.push("overallScore suspiciously high — rescore harshly");
        const suggested = `${o.headline?.suggested ?? ""}\n${o.summary?.suggested ?? ""}`;
        const src = `${profileText}\n${targetRole ?? ""}\n${industry ?? ""}`;
        const combined = combineValidators([
          checkGrounding(suggested, src, 0.35),
          checkNumbersGrounded(suggested, src),
          validateLinkedInSuggestions(o.headline?.suggested, o.summary?.suggested, anchors),
        ]);
        if (!combined.ok) issues.push(...combined.issues);
        return issues.length ? { ok: false, issues } : { ok: true };
      },
      jsonMode: true,
      temperature: 0.3,
    });

    // Anchor the reported scores to the deterministic audit.
    const blended = blendLinkedInScores(output.scores, anchors);
    const weights: Record<string, number> = { headline: 0.2, summary: 0.2, experience: 0.25, skills: 0.1, keywords: 0.15, completeness: 0.1 };
    const overall = Math.round(
      Object.entries(weights).reduce((sum, [k, w]) => sum + (blended[k] ?? 0) * w, 0)
    );
    const finalOutput = {
      ...output,
      scores: blended,
      overallScore: Math.max(1, Math.min(100, Math.round(overall * 0.7 + (output.overallScore ?? overall) * 0.3))),
      anchors: {
        headlineLength: anchors.headlineLength,
        aboutWordCount: anchors.aboutWordCount,
        bulletCount: anchors.bulletCount,
        quantifiedBulletCount: anchors.quantifiedBulletCount,
        weakVerbBullets: anchors.weakVerbBullets.length,
        skillsCount: anchors.skillsCount,
      },
    };

    return new Response(JSON.stringify(finalOutput), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("analyze-linkedin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
