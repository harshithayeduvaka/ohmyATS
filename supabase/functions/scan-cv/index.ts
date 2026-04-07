import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a production-grade ATS simulation engine that replicates EXACTLY how enterprise Applicant Tracking Systems (Workday, Greenhouse, Bullhorn, Taleo, iCIMS, Lever, SmartRecruiters) parse, rank, and filter resumes — combined with a brutally honest senior recruiter with 15+ years of experience across multiple industries.

IMPORTANT: You must be ROLE-AGNOSTIC. Adapt your analysis to whatever field the CV targets (engineering, marketing, data science, finance, design, healthcare, etc.). Do NOT assume any specific industry.

═══════════════════════════════════════════
PHASE 1: ATS PARSING SIMULATION
═══════════════════════════════════════════
Parse the CV exactly as an ATS would:
- Extract structured fields: Name, Contact, Location, Current/Target Title, Years of Experience, Education, Certifications
- Detect format issues that ACTUALLY break real ATS parsers:
  • Tables, columns, text boxes (many ATS flatten these incorrectly)
  • Headers/footers (often stripped entirely)
  • Graphics, images, icons, charts (invisible to ATS)
  • Non-standard fonts or special Unicode characters
  • Inconsistent date formats
  • Missing standard section headers (ATS uses headers to categorize content)
- Flag ONLY real issues. Clean, single-column CVs with standard headers should get high format scores (85-95).
- A well-structured CV with clear sections, consistent formatting, and no parsing traps should score 90+ on format.

═══════════════════════════════════════════
PHASE 2: KEYWORD & SEMANTIC MATCHING
═══════════════════════════════════════════
When a JD is provided:
1. Extract ALL requirements from the JD: hard skills, soft skills, tools, methodologies, certifications, experience levels, industry terms.
2. Match using THREE layers:
   - EXACT match: identical term appears in CV (highest weight)
   - SEMANTIC match: equivalent meaning (e.g., "managed budgets" ≈ "budget management", "P&L" ≈ "profit and loss", "ML pipelines" ≈ "machine learning workflows") — give 70-80% credit
   - TRANSFERABLE match: related competency that demonstrates capability (e.g., "TensorFlow" when JD says "PyTorch" — both are DL frameworks) — give 40-50% credit
3. Weight JD requirements by signal strength:
   - "Required"/"Must have" → critical importance
   - "Preferred"/"Nice to have" → high importance
   - Listed once in passing → medium importance
   - Implied but not stated → low importance

Without a JD: evaluate standalone keyword strength, industry-standard terminology, and general ATS-friendliness for the candidate's target role (inferred from their CV content).

═══════════════════════════════════════════
PHASE 3: SCORING CALIBRATION (CRITICAL)
═══════════════════════════════════════════
Score distribution must reflect REAL ATS behavior:
- 85-100: Exceptional match — near-perfect keyword alignment, quantified achievements throughout, clean format, strong role fit. RARE.
- 70-84: Strong candidate — most requirements met, good quantification, minor gaps. Top 15-20%.
- 50-69: Average — some keyword matches, some gaps, needs optimization.
- 30-49: Below average — significant gaps, weak quantification, format issues.
- Below 30: Poor — major misalignment or critical format problems.

QUANTIFICATION RECOGNITION:
- CVs with metrics (%, $, #, time saved, growth rates) should score HIGHER on impactClarity
- "Drove 12% increase in follower growth" → strong
- "Achieved 97% accuracy (+7pp over baseline)" → excellent
- "Responsible for social media" → weak
- 70%+ quantified bullets = impactClarity 75+

SCORING EACH DIMENSION:
- atsCompatibility: How well will ATS parsers extract and categorize this CV?
- keywordMatch: What % of JD requirements appear in the CV? Include semantic matches at partial credit
- recruiterAppeal: Would a recruiter spend >6 seconds on this?
- impactClarity: Are achievements quantified with metrics? Action verbs? Specific outcomes?
- formatScore: Technical parsing compatibility

DO NOT artificially deflate scores for well-crafted CVs. DO NOT inflate scores for generic CVs.

═══════════════════════════════════════════
PHASE 4: ADVANCED ANALYSIS
═══════════════════════════════════════════
1. **Similarity Score** (0-100): Semantic overlap between CV and JD.
2. **Key Differences**: Competency AREAS the JD demands that the CV lacks.
3. **Outdated Terms**: Flag outdated terminology with modern alternatives.
4. **Trending Skills Gap**: Increasingly expected skills missing from CV.
5. **Role Fit Assessment**: Career trajectory and seniority alignment.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "botPass": {
    "formatIssues": ["only REAL issues — empty array if clean"],
    "extractedFields": [{"label":"field","value":"extracted value","status":"ok|warning|error"}]
  },
  "algorithm": {
    "hardRequirements": [{"skill":"skill","status":"matched|missing|weak","context":"evidence"}],
    "softSkills": [{"skill":"skill","status":"matched|missing"}],
    "phantomMatches": [{"keyword":"keyword","reason":"why ATS ranks lower"}],
    "similarityScore": 0-100,
    "keyDifferences": ["competency gaps"],
    "outdatedTerms": [{"term":"outdated","modernAlternative":"current"}],
    "trendingSkillsGap": ["missing trending skills"]
  },
  "humanPass": {
    "overallImpression": "2-3 sentence recruiter assessment",
    "strengths": ["specific strengths"],
    "weaknesses": ["specific weaknesses"],
    "weakVerbs": [{"original":"weak phrase","suggestion":"stronger replacement"}],
    "roleFitAssessment": "trajectory fit assessment"
  },
  "rewrites": [{"context":"section","before":"original","after":"improved"}],
  "scores": {
    "overall": 0-100,
    "atsCompatibility": 0-100,
    "keywordMatch": 0-100,
    "recruiterAppeal": 0-100,
    "impactClarity": 0-100,
    "formatScore": 0-100
  },
  "keywordAnalysis": [{"keyword":"keyword","foundInCV":true,"importance":"critical|high|medium|low","context":"where found","whereToAdd":"section and phrasing (only if false)"}],
  "sectionTips": [
    {"section":"Summary/Profile","score":0-100,"tips":["actionable tip"]},
    {"section":"Work Experience","score":0-100,"tips":["actionable tip"]},
    {"section":"Skills","score":0-100,"tips":["actionable tip"]},
    {"section":"Education","score":0-100,"tips":["actionable tip"]}
  ],
  "matchSummary": {
    "matchRate": 0-100,
    "hardSkillMatch": 0-100,
    "softSkillMatch": 0-100,
    "measurableImpact": 0-100,
    "summary": "2-3 sentence verdict"
  }
}

REWRITE RULES:
- "Action Verb + Context + Quantifiable Result" framework
- Mirror JD terminology. NEVER fabricate metrics.
- Provide 4-6 rewrites targeting weakest bullets first.

KEYWORD ANALYSIS: 10-15 keywords. For missing: specify section and natural phrasing.
SECTION TIPS: Score each section. Reference SPECIFIC content from CV and JD.`;

// ─── Helper: call a single model ───────────────────────────────────
async function callModel(
  model: string,
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Record<string, any>> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw { status: response.status, message: errorText };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`No content from ${model}`);

  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonStr);
}

// ─── Helper: merge two scan results ────────────────────────────────
function mergeResults(a: any, b: any): any {
  // Average the scores (weighted: take the more conservative score slightly)
  const avgScore = (sa: number, sb: number) => {
    const min = Math.min(sa, sb);
    const avg = Math.round((sa + sb) / 2);
    // Lean 30% toward the lower score for conservatism
    return Math.round(avg * 0.7 + min * 0.3);
  };

  const scores = {
    overall: avgScore(a.scores?.overall ?? 0, b.scores?.overall ?? 0),
    atsCompatibility: avgScore(a.scores?.atsCompatibility ?? 0, b.scores?.atsCompatibility ?? 0),
    keywordMatch: avgScore(a.scores?.keywordMatch ?? 0, b.scores?.keywordMatch ?? 0),
    recruiterAppeal: avgScore(a.scores?.recruiterAppeal ?? 0, b.scores?.recruiterAppeal ?? 0),
    impactClarity: avgScore(a.scores?.impactClarity ?? 0, b.scores?.impactClarity ?? 0),
    formatScore: avgScore(a.scores?.formatScore ?? 0, b.scores?.formatScore ?? 0),
  };

  // Merge arrays: deduplicate by key content
  const mergeArrays = <T>(arr1: T[], arr2: T[], key?: keyof T): T[] => {
    const combined = [...(arr1 || []), ...(arr2 || [])];
    if (!key) return combined;
    const seen = new Set<string>();
    return combined.filter((item) => {
      const k = String((item as any)[key]).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  // For format issues, union unique issues
  const formatIssues = [...new Set([
    ...(a.botPass?.formatIssues || []),
    ...(b.botPass?.formatIssues || []),
  ])];

  // For extracted fields, prefer longer list
  const extractedFields = (a.botPass?.extractedFields?.length ?? 0) >= (b.botPass?.extractedFields?.length ?? 0)
    ? a.botPass?.extractedFields || []
    : b.botPass?.extractedFields || [];

  // Hard requirements: merge and prefer the more detailed assessment
  const hardReqs = mergeArrays(
    a.algorithm?.hardRequirements || [],
    b.algorithm?.hardRequirements || [],
    "skill" as any
  );

  const softSkills = mergeArrays(
    a.algorithm?.softSkills || [],
    b.algorithm?.softSkills || [],
    "skill" as any
  );

  const phantomMatches = mergeArrays(
    a.algorithm?.phantomMatches || [],
    b.algorithm?.phantomMatches || [],
    "keyword" as any
  );

  // Similarity: average
  const similarityScore = Math.round(
    ((a.algorithm?.similarityScore ?? 0) + (b.algorithm?.similarityScore ?? 0)) / 2
  );

  // Key differences: union
  const keyDifferences = [...new Set([
    ...(a.algorithm?.keyDifferences || []),
    ...(b.algorithm?.keyDifferences || []),
  ])];

  const outdatedTerms = mergeArrays(
    a.algorithm?.outdatedTerms || [],
    b.algorithm?.outdatedTerms || [],
    "term" as any
  );

  const trendingSkillsGap = [...new Set([
    ...(a.algorithm?.trendingSkillsGap || []),
    ...(b.algorithm?.trendingSkillsGap || []),
  ])];

  // Human pass: pick the longer/more detailed impression, union strengths/weaknesses
  const humanPass = {
    overallImpression: (a.humanPass?.overallImpression?.length ?? 0) >= (b.humanPass?.overallImpression?.length ?? 0)
      ? a.humanPass?.overallImpression || ""
      : b.humanPass?.overallImpression || "",
    strengths: [...new Set([...(a.humanPass?.strengths || []), ...(b.humanPass?.strengths || [])])],
    weaknesses: [...new Set([...(a.humanPass?.weaknesses || []), ...(b.humanPass?.weaknesses || [])])],
    weakVerbs: mergeArrays(
      a.humanPass?.weakVerbs || [],
      b.humanPass?.weakVerbs || [],
      "original" as any
    ),
    roleFitAssessment: (a.humanPass?.roleFitAssessment?.length ?? 0) >= (b.humanPass?.roleFitAssessment?.length ?? 0)
      ? a.humanPass?.roleFitAssessment || ""
      : b.humanPass?.roleFitAssessment || "",
  };

  // Rewrites: union by before text
  const rewrites = mergeArrays(
    a.rewrites || [],
    b.rewrites || [],
    "before" as any
  );

  // Keywords: merge, for conflicts prefer "found" over "not found"
  const keywordMap = new Map<string, any>();
  for (const kw of [...(a.keywordAnalysis || []), ...(b.keywordAnalysis || [])]) {
    const key = kw.keyword?.toLowerCase();
    if (!key) continue;
    const existing = keywordMap.get(key);
    if (!existing) {
      keywordMap.set(key, kw);
    } else if (kw.foundInCV && !existing.foundInCV) {
      keywordMap.set(key, kw); // prefer found
    }
  }
  const keywordAnalysis = Array.from(keywordMap.values());

  // Section tips: merge, average scores per section
  const sectionMap = new Map<string, any>();
  for (const tip of [...(a.sectionTips || []), ...(b.sectionTips || [])]) {
    const section = tip.section?.toLowerCase();
    if (!section) continue;
    const existing = sectionMap.get(section);
    if (!existing) {
      sectionMap.set(section, { ...tip });
    } else {
      existing.score = Math.round((existing.score + tip.score) / 2);
      existing.tips = [...new Set([...existing.tips, ...tip.tips])];
      sectionMap.set(section, existing);
    }
  }
  const sectionTips = Array.from(sectionMap.values());

  // Match summary: average scores, pick longer summary
  const matchSummary = {
    matchRate: Math.round(((a.matchSummary?.matchRate ?? 0) + (b.matchSummary?.matchRate ?? 0)) / 2),
    hardSkillMatch: Math.round(((a.matchSummary?.hardSkillMatch ?? 0) + (b.matchSummary?.hardSkillMatch ?? 0)) / 2),
    softSkillMatch: Math.round(((a.matchSummary?.softSkillMatch ?? 0) + (b.matchSummary?.softSkillMatch ?? 0)) / 2),
    measurableImpact: Math.round(((a.matchSummary?.measurableImpact ?? 0) + (b.matchSummary?.measurableImpact ?? 0)) / 2),
    summary: (a.matchSummary?.summary?.length ?? 0) >= (b.matchSummary?.summary?.length ?? 0)
      ? a.matchSummary?.summary || ""
      : b.matchSummary?.summary || "",
  };

  return {
    botPass: { formatIssues, extractedFields },
    algorithm: {
      hardRequirements: hardReqs,
      softSkills,
      phantomMatches,
      similarityScore,
      keyDifferences,
      outdatedTerms,
      trendingSkillsGap,
    },
    humanPass,
    rewrites,
    scores,
    keywordAnalysis,
    sectionTips,
    matchSummary: matchSummary.summary ? matchSummary : undefined,
  };
}

// ─── Main handler ──────────────────────────────────────────────────
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
    const timeout = setTimeout(() => controller.abort(), 150000); // 2.5 min for dual model

    const userContent = jd
      ? `CV:\n${cv}\n\nTarget JD:\n${jd}\n\nPerform full ATS simulation: parse every section, match against ALL JD requirements (exact + semantic + transferable), detect similarity/differences, flag outdated terminology, identify trending skill gaps, assess role fit, and provide calibrated scores. Remember: quantified achievements should be rewarded, clean formatting should not be penalised.`
      : `CV:\n${cv}\n\nNo JD provided. Run a standalone ATS compatibility scan — infer the target role from CV content, evaluate formatting, keyword strength for that role, impact clarity, recruiter appeal, and flag outdated terminology or missing trending skills. Set similarityScore to 0 and leave keyDifferences empty.`;

    // Run BOTH models in parallel
    console.log("Starting ensemble scan: gemini-2.5-pro + openai/gpt-5");

    const [geminiResult, gptResult] = await Promise.allSettled([
      callModel("google/gemini-2.5-pro", SYSTEM_PROMPT, userContent, LOVABLE_API_KEY, controller.signal),
      callModel("openai/gpt-5", SYSTEM_PROMPT, userContent, LOVABLE_API_KEY, controller.signal),
    ]);

    clearTimeout(timeout);

    // Handle results
    const geminiOk = geminiResult.status === "fulfilled" ? geminiResult.value : null;
    const gptOk = gptResult.status === "fulfilled" ? gptResult.value : null;

    if (geminiResult.status === "rejected") {
      console.error("Gemini failed:", geminiResult.reason);
      // Check for rate limit / payment errors
      if (geminiResult.reason?.status === 429 || geminiResult.reason?.status === 402) {
        if (!gptOk) {
          const status = geminiResult.reason.status;
          const msg = status === 429
            ? "Rate limit exceeded. Please try again in a moment."
            : "AI usage limit reached. Please add credits.";
          return new Response(JSON.stringify({ error: msg }), {
            status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (gptResult.status === "rejected") {
      console.error("GPT-5 failed:", gptResult.reason);
      if (gptResult.reason?.status === 429 || gptResult.reason?.status === 402) {
        if (!geminiOk) {
          const status = gptResult.reason.status;
          const msg = status === 429
            ? "Rate limit exceeded. Please try again in a moment."
            : "AI usage limit reached. Please add credits.";
          return new Response(JSON.stringify({ error: msg }), {
            status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    let finalResult: any;

    if (geminiOk && gptOk) {
      // Both succeeded — merge for best accuracy
      console.log("Both models succeeded, merging results");
      finalResult = mergeResults(geminiOk, gptOk);
    } else if (geminiOk) {
      console.log("Only Gemini succeeded, using single result");
      finalResult = geminiOk;
    } else if (gptOk) {
      console.log("Only GPT-5 succeeded, using single result");
      finalResult = gptOk;
    } else {
      throw new Error("Both AI models failed. Please try again.");
    }

    // Validate essential fields
    if (!finalResult.scores || typeof finalResult.scores.overall !== "number") {
      console.error("Invalid response structure:", JSON.stringify(finalResult).substring(0, 500));
      throw new Error("AI returned an invalid analysis structure");
    }

    return new Response(JSON.stringify(finalResult), {
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
