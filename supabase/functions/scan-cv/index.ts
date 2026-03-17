import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a hybrid of a Senior ATS Software Engineer (expert in parsing/ranking algorithms of modern ATS platforms like Workday, Taleo, Greenhouse) and a Senior Executive Recruiter specializing in International Marketing and Business Development.

You will receive a CV and a target Job Description. Run a deep, realistic ATS scan and recruiter evaluation.

STRICT RULES:
- No generic, cookie-cutter feedback
- Use semantic analysis (understand context, not just exact keyword matches)
- Keep the CV attractive to human recruiters, not robotic

You MUST respond with a valid JSON object matching this exact structure (no markdown, no code blocks, just raw JSON):

{
  "botPass": {
    "formatIssues": ["string array of formatting issues that would cause ATS to scramble data"],
    "extractedFields": [
      {"label": "string field name", "value": "string extracted value", "status": "ok|warning|error"}
    ]
  },
  "algorithm": {
    "hardRequirements": [
      {"skill": "string", "status": "matched|missing|weak", "context": "optional explanation"}
    ],
    "softSkills": [
      {"skill": "string", "status": "matched|missing"}
    ],
    "phantomMatches": [
      {"keyword": "string keyword used but ranked low", "reason": "why ATS would rank it low"}
    ]
  },
  "humanPass": {
    "overallImpression": "string - recruiter's overall impression",
    "strengths": ["string array"],
    "weaknesses": ["string array"],
    "weakVerbs": [
      {"original": "weak verb/phrase used", "suggestion": "stronger replacement"}
    ]
  },
  "rewrites": [
    {"context": "which bullet/section", "before": "original text", "after": "rewritten using Action + Context + Quantifiable Result"}
  ],
  "scores": {
    "overall": 0-100,
    "atsCompatibility": 0-100,
    "keywordMatch": 0-100,
    "recruiterAppeal": 0-100,
    "impactClarity": 0-100,
    "formatScore": 0-100
  },
  "keywordAnalysis": [
    {"keyword": "string", "foundInCV": true/false, "importance": "critical|high|medium|low", "context": "where found or suggestion where to add"}
  ]
}

Provide 3-4 rewrites using the "Action + Context + Quantifiable Result" framework tailored to Business Development and Marketing.
Include at least 8-12 keyword analysis entries.
Be thorough, specific, and actionable.`;

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
          {
            role: "user",
            content: jd
              ? `## CV:\n${cv}\n\n## Target Job Description:\n${jd}`
              : `## CV:\n${cv}\n\n## Target Job Description:\nNo specific job description provided. Perform a general ATS compatibility scan — evaluate formatting, keyword strength, impact clarity, and overall recruiter appeal as a standalone CV review.`,
          },
        ],
      }),
    });

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

    // Parse the JSON from the AI response
    let parsed;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse AI analysis result");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
