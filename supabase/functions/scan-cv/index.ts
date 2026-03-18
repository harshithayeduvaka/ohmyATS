import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a production ATS engine (Workday/Bullhorn/Greenhouse caliber) combined with a brutally honest senior recruiter. Simulate EXACTLY how real ATS software parses and ranks resumes.

SCORING RULES — BE HARSH LIKE REAL ATS:
- Most CVs score 30-55. Only exceptional, perfectly optimized CVs score 70+.
- A score of 80+ means the CV would pass top-tier enterprise ATS filters — extremely rare.
- Deduct heavily for: missing quantified results, generic buzzwords without context, format issues, keyword gaps vs JD.
- Do NOT inflate scores to be encouraging. Real ATS systems reject 75% of applicants.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "botPass": {
    "formatIssues": ["issues that would cause ATS parsing failures"],
    "extractedFields": [{"label":"field","value":"extracted","status":"ok|warning|error"}]
  },
  "algorithm": {
    "hardRequirements": [{"skill":"skill","status":"matched|missing|weak","context":"why"}],
    "softSkills": [{"skill":"skill","status":"matched|missing"}],
    "phantomMatches": [{"keyword":"keyword","reason":"why ATS ranks it low"}]
  },
  "humanPass": {
    "overallImpression": "brutally honest recruiter take",
    "strengths": ["strengths"],
    "weaknesses": ["weaknesses - be specific and actionable"],
    "weakVerbs": [{"original":"weak phrase","suggestion":"stronger replacement"}]
  },
  "rewrites": [{"context":"section","before":"original","after":"rewritten with Action + Context + Quantifiable Result"}],
  "scores": {
    "overall": 0-100,
    "atsCompatibility": 0-100,
    "keywordMatch": 0-100,
    "recruiterAppeal": 0-100,
    "impactClarity": 0-100,
    "formatScore": 0-100
  },
  "keywordAnalysis": [{"keyword":"keyword","foundInCV": true,"importance":"critical|high|medium|low","context":"where found or where to add"}]
}

Give 3-4 rewrites, 8-12 keyword entries. Be specific, not generic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cv, jd } = await req.json();

    if (!cv) {
      return new Response(
        JSON.stringify({ error: "CV is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 90-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const userContent = jd
      ? `CV:\n${cv}\n\nTarget JD:\n${jd}`
      : `CV:\n${cv}\n\nNo JD provided. Run a general ATS compatibility scan — evaluate formatting, keyword strength, impact clarity, and recruiter appeal as a standalone review.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Failed to parse AI analysis result");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Scan timed out. Please try with a shorter CV or try again." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("scan-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
