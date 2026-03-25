import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profileText, targetRole, industry } = await req.json();
    if (!profileText) return new Response(JSON.stringify({ error: "LinkedIn profile text is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn profile optimization coach. Analyze the provided LinkedIn profile text and give brutally honest, actionable feedback.${targetRole ? ` The user is targeting: ${targetRole}.` : ""}${industry ? ` Industry: ${industry}.` : ""}

Score harshly. Most profiles score 30-55. Only truly exceptional profiles score 70+.

CRITICAL: For EVERY weakness and issue you identify, you MUST provide a specific, copy-paste-ready fix. Do not just say "your headline is weak" — provide the exact replacement text.

Return ONLY valid JSON:
{
  "overallScore": number 1-100,
  "scores": {
    "headline": number 1-100,
    "summary": number 1-100,
    "experience": number 1-100,
    "skills": number 1-100,
    "keywords": number 1-100,
    "completeness": number 1-100
  },
  "headline": {
    "current": "their current headline or 'Not found'",
    "suggested": "optimized headline - ready to copy-paste",
    "feedback": "why the change"
  },
  "summary": {
    "current": "brief summary of their current about section",
    "suggested": "complete optimized about section - ready to copy-paste",
    "feedback": "what's wrong and why"
  },
  "experienceIssues": [{"section": "which role", "issue": "what's wrong", "fix": "exact rewritten text they should use instead"}],
  "missingKeywords": ["keywords they should add for their target role"],
  "strengths": ["what's good about the profile"],
  "weaknesses": ["what needs fixing - be specific"],
  "quickWins": ["easy changes with immediate impact - include exact text to add/change"],
  "contentStrategy": {
    "postIdeas": ["3-5 post topic ideas for their niche"],
    "engagementTips": ["tips to increase visibility"],
    "networkingAdvice": ["who to connect with and how"]
  },
  "ssiEstimate": {
    "score": number 1-100,
    "breakdown": {
      "professionalBrand": number 1-25,
      "rightPeople": number 1-25,
      "engageInsights": number 1-25,
      "buildRelationships": number 1-25
    },
    "tips": ["how to improve SSI"]
  }
}`
          },
          { role: "user", content: `LinkedIn Profile:\n${profileText}` }
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[1] || jsonMatch?.[0] || content);

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-linkedin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
