import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a production ATS engine that replicates EXACTLY how enterprise Applicant Tracking Systems (Workday, Greenhouse, Bullhorn, Taleo, iCIMS, Lever, SmartRecruiters) parse, rank, and filter resumes. Combined with a brutally honest senior recruiter with 15+ years of experience.

SCORING METHODOLOGY — CALIBRATED TO REAL ATS BEHAVIOR:
- Parse the CV exactly as an ATS would: extract structured fields, detect formatting issues that break parsers (tables, headers/footers, graphics, columns, non-standard fonts).
- Keyword matching: use BOTH exact match AND semantic/synonym matching (e.g., "managed budgets" ≈ "budget management", "P&L" ≈ "profit and loss"). Weight exact JD phrases higher.
- Score distribution must reflect reality: median CV scores 35-50. Only CVs with strong keyword density, quantified achievements, clean formatting, AND role alignment score 65+. Score 80+ is reserved for near-perfect matches.
- Deduct for: missing quantified results (-5 to -15), generic buzzwords without context (-3 to -8), format issues that break ATS parsing (-5 to -20), keyword gaps vs JD (-2 per critical missing keyword), inconsistent date formats (-3), missing sections (-5 per missing critical section).
- Do NOT inflate scores. Real ATS systems reject 75%+ of applicants at the screening stage.
- Cross-reference EVERY JD requirement against the CV. A requirement not evidenced = a gap.

ADVANCED ANALYSIS REQUIREMENTS:
1. **Similarity Detection**: Compare CV language against JD language. Identify semantic similarities (e.g., "managed client accounts" ≈ "account management") and exact matches. Report a similarity percentage.
2. **Difference Analysis**: Explicitly list what the JD demands that the CV completely lacks — not just missing keywords, but missing *competency areas*, *industry experience*, and *seniority signals*.
3. **Popularity & Trend Awareness**: Flag if the CV uses outdated terminology (e.g., "social media marketing" instead of "growth marketing"), missing trending skills for the role (e.g., AI tools, no-code platforms), or uses overused buzzwords that modern ATS deprioritize.
4. **Role Fit Score**: Beyond keyword matching, assess whether the candidate's career trajectory, seniority level, and industry alignment fit the role.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "botPass": {
    "formatIssues": ["issues that would cause ATS parsing failures"],
    "extractedFields": [{"label":"field","value":"extracted","status":"ok|warning|error"}]
  },
  "algorithm": {
    "hardRequirements": [{"skill":"skill","status":"matched|missing|weak","context":"why"}],
    "softSkills": [{"skill":"skill","status":"matched|missing"}],
    "phantomMatches": [{"keyword":"keyword","reason":"why ATS ranks it low"}],
    "similarityScore": 0-100,
    "keyDifferences": ["competency areas the CV completely lacks vs JD"],
    "outdatedTerms": [{"term":"outdated term used","modernAlternative":"what to use instead"}],
    "trendingSkillsGap": ["trending skills for this role missing from CV"]
  },
  "humanPass": {
    "overallImpression": "brutally honest recruiter take",
    "strengths": ["strengths"],
    "weaknesses": ["weaknesses - be specific and actionable"],
    "weakVerbs": [{"original":"weak phrase","suggestion":"stronger replacement"}],
    "roleFitAssessment": "honest assessment of whether candidate's trajectory fits this role"
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
  "keywordAnalysis": [{"keyword":"keyword","foundInCV": true,"importance":"critical|high|medium|low","context":"where found or where to add","whereToAdd":"specific CV section and how to naturally integrate this keyword (only if foundInCV is false)"}],
  "sectionTips": [
    {"section":"Summary/Profile","score":0-100,"tips":["specific actionable tip for this section"]},
    {"section":"Work Experience","score":0-100,"tips":["specific actionable tip"]},
    {"section":"Skills","score":0-100,"tips":["specific actionable tip"]},
    {"section":"Education","score":0-100,"tips":["specific actionable tip"]}
  ],
  "matchSummary": {
    "matchRate": 0-100,
    "hardSkillMatch": 0-100,
    "softSkillMatch": 0-100,
    "measurableImpact": 0-100,
    "summary": "2-3 sentence Jobscan-style verdict: what % of critical requirements are met, biggest gaps, and #1 action to increase match rate"
  }
}

SECTION TIPS RULES — Like Jobscan/Resume Worded:
- Score each CV section independently (Summary, Experience, Skills, Education).
- Tips must be SPECIFIC: "Add 'growth marketing' to your Skills section" not "Add more keywords."
- Reference the JD terminology directly.
- For whereToAdd on missing keywords: specify EXACTLY which section and how to phrase it naturally.

REWRITE RULES — Follow French/EU professional standards:
- Use "Action + Context + Quantifiable Result" framework.
- French professional tone: direct, clear, strategic, no fluff.
- No generic adjectives like "hardworking" or "passionate."
- Mirror JD terminology. Include measurable impact (metrics, %, revenue, efficiency).
- No clichés or repetition. Must sound human, not AI-generated.
- Tailored for International Marketing & Business Development roles.
- Must accord with French & EU hiring norms and conventions.

ACCURACY RULES:
- Cross-check EVERY hard requirement in the JD against the CV line by line. Do not skip any.
- For keyword analysis: scan the ENTIRE JD, extract ALL technical terms, tools, methodologies, certifications, and soft skills mentioned. Check each against the CV.
- Similarity score must reflect actual content overlap, not surface-level word matching. Use semantic understanding.
- Section tips must reference SPECIFIC lines/content from both the CV and JD.
- Rewrites must use ONLY information present in the CV — never fabricate metrics or experiences.

Give 4-6 rewrites, 10-15 keyword entries, 4 section tips. Be specific, not generic. For similarity analysis, consider semantic meaning not just exact words.`;

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const userContent = jd
      ? `CV:\n${cv}\n\nTarget JD:\n${jd}\n\nPerform full ATS simulation: parse, rank, detect similarity/differences between CV and JD, flag outdated terminology, identify trending skill gaps, and assess role fit.`
      : `CV:\n${cv}\n\nNo JD provided. Run a general ATS compatibility scan — evaluate formatting, keyword strength, impact clarity, recruiter appeal, and flag any outdated terminology or missing trending skills as a standalone review. Set similarityScore to 0 and leave keyDifferences empty.`;

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
