import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";
import { checkBannedPhrases, checkGrounding, checkWordCount, combineValidators } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PitchOut { pitch: string }

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
    const { cv, role, language, duration } = await req.json();
    if (!cv) return new Response(JSON.stringify({ error: "CV is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if ((typeof cv === "string" && cv.length > 30000) || (typeof role === "string" && role.length > 500)) {
      return new Response(JSON.stringify({ error: "Payload too large." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language === "french" ? "French" : "English";
    const targetSeconds = duration === "30s" ? 30 : duration === "90s" ? 90 : 60;
    const targetWords = targetSeconds === 30 ? 75 : targetSeconds === 90 ? 225 : 150;
    const minW = Math.round(targetWords * 0.8);
    const maxW = Math.round(targetWords * 1.15);
    const seconds = `${targetSeconds} seconds (about ${targetWords} words)`;

    const { output } = await runThreePass<PitchOut>({
      systemPrompt: `You are a career coach. Generate a compelling elevator pitch for a job seeker based on their CV.
The pitch must be for ${seconds}. Write in ${lang}.
It should: introduce who they are, their key value proposition, 1-2 standout achievements with metrics from the CV, and end with a confident hook.
Every claim must be grounded in the CV — do not invent metrics, employers, or achievements.
Be natural, conversational, confident — not robotic.
${role ? `Target role: ${role}` : ""}
Respond with ONLY valid JSON: { "pitch": string }`,
      userPrompt: `CV:\n${cv}`,
      critiquePrompt:
        "Flag every claim in the pitch that isn't in the CV. Flag banned corporate clichés (passionate, dynamic, results-driven, team player, hit the ground running, etc.). Flag if word count is outside target range.",
      parse: (raw) => tryParseJson<PitchOut>(raw),
      validate: (o) => {
        if (!o.pitch) return { ok: false, issues: ["missing pitch"] };
        return combineValidators([
          checkWordCount(o.pitch, minW, maxW),
          checkBannedPhrases(o.pitch),
          checkGrounding(o.pitch, `${cv}\n${role ?? ""}`, 0.25),
        ]);
      },
      jsonMode: true,
      temperature: 0.6,
    });

    return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("elevator-pitch error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
