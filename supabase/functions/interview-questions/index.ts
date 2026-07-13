import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";
import { checkGrounding, combineValidators, type ValidatorResult } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QuestionOut {
  question: string;
  category: string;
  difficulty: string;
  whyAsked: string;
  suggestedAnswer?: string;
  rubric?: string[];
  tips: string[];
}
interface QuestionsPayload {
  questions: QuestionOut[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const _supaAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const _token = authHeader.replace("Bearer ", "").trim();
    const { data: _claims, error: _claimsErr } = await _supaAuth.auth.getClaims(_token);
    if (_claimsErr || !_claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const { cv, jd, role, companyName, companySector, interviewType, language } = body;

    if (!jd) {
      return new Response(
        JSON.stringify({ error: "Job Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      (typeof cv === "string" && cv.length > 30000) ||
      (typeof jd === "string" && jd.length > 15000) ||
      [role, companyName, companySector, interviewType].some((v) => typeof v === "string" && v.length > 500)
    ) {
      return new Response(
        JSON.stringify({ error: "Payload too large." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language === "french" ? "French" : "English";
    const langInstruction = language === "french"
      ? `\n\nIMPORTANT: Write ALL output (questions, answers, rubric, tips, whyAsked, categories) in French.`
      : "";

    const interviewTypeInstruction = interviewType
      ? `The interview type is "${interviewType}". Adjust question style accordingly:
- "HR" = behavioral, motivation, culture fit, salary expectations, career goals
- "Technical" = hard skills, problem-solving, case studies, domain expertise
- "Coffee Chat" = casual, conversational, exploratory, company culture, mutual fit
- "Chat with the Founder" = vision alignment, entrepreneurial thinking, big-picture strategy, passion for the mission
- For any other type, adapt the tone and question style to match what "${interviewType}" implies.`
      : "";

    const systemPrompt = `You are a senior hiring manager. Generate realistic interview questions for this role.
Include a mix of questions appropriate for the interview context.
${companyName ? `The company is "${companyName}". Tailor questions to reflect what this specific company values and how they typically interview.` : ""}
${companySector ? `The industry/sector is "${companySector}". Include sector-specific questions that test domain knowledge and industry awareness.` : ""}
${interviewTypeInstruction}
${cv ? "Also provide suggested answers based STRICTLY on the candidate's CV. Do NOT fabricate or assume any experience, skills, projects, or achievements that are not explicitly mentioned in the CV. If the CV doesn't contain relevant experience for a question, say so honestly in the suggested answer and guide the candidate on how to frame transferable skills from what IS in their CV." : ""}

CRITICAL: Every suggested answer MUST be directly traceable to specific content in the candidate's CV. Never invent metrics, projects, company names, or experiences.

For EACH question, also produce a "rubric": 3-5 concrete criteria a strong answer must satisfy (e.g. "Uses STAR structure", "Cites a quantified outcome", "Names a specific stakeholder"). The rubric will be used to score candidate answers deterministically.

Respond with ONLY valid JSON:
{
  "questions": [
    {
      "question": "the interview question",
      "category": "behavioral|technical|situational|culture-fit",
      "difficulty": "easy|medium|hard",
      "whyAsked": "what the interviewer is really assessing",
      ${cv ? '"suggestedAnswer": "tailored answer using CV experience",' : ""}
      "rubric": ["criterion 1", "criterion 2", "criterion 3"],
      "tips": ["tips for answering well"]
    }
  ]
}

Generate 8-10 questions ordered from warm-up to tough.${langInstruction}`;

    const userContent = `Role: ${role || "Not specified"}\n${companyName ? `Company: ${companyName}\n` : ""}${companySector ? `Sector: ${companySector}\n` : ""}${interviewType ? `Interview Type: ${interviewType}\n` : ""}\nJob Description:\n${jd}\n${cv ? `\nCandidate CV:\n${cv}` : ""}\n\nOutput Language: ${lang}`;

    const critiquePrompt = `Check: (1) 8-10 questions present, (2) every question has a rubric with 3+ criteria, (3) ${cv ? "every suggestedAnswer is grounded in the CV — no invented companies, metrics, or projects, " : ""}(4) questions match the interview type "${interviewType || "general"}", (5) no generic filler questions, (6) whyAsked reveals a real assessment goal.`;

    const source = `${cv || ""}\n${jd}\n${companyName || ""}\n${companySector || ""}`;

    const { output } = await runThreePass<QuestionsPayload>({
      systemPrompt,
      userPrompt: userContent,
      critiquePrompt,
      parse: (raw) => {
        const p = tryParseJson<QuestionsPayload>(raw);
        if (!p || !Array.isArray(p.questions) || p.questions.length === 0) return null;
        return p;
      },
      validate: (out): ValidatorResult => {
        const results: ValidatorResult[] = [];
        if (out.questions.length < 6) {
          results.push({ ok: false, issues: [`Only ${out.questions.length} questions (need 6+)`] });
        }
        const missingRubric = out.questions.filter((q) => !Array.isArray(q.rubric) || (q.rubric?.length ?? 0) < 3);
        if (missingRubric.length > 0) {
          results.push({ ok: false, issues: [`${missingRubric.length} questions missing 3+ rubric criteria`] });
        }
        if (cv) {
          const answersText = out.questions
            .map((q) => q.suggestedAnswer ?? "")
            .join("\n");
          if (answersText.trim().length > 0) {
            results.push(checkGrounding(answersText, source, 0.3));
          }
        }
        return combineValidators(results);
      },
      draftModel: "flash",
      refineModel: "pro",
      temperature: 0.4,
      jsonMode: true,
      maxRetries: 1,
    });

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out." }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("interview-questions error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = /429/.test(msg) ? 429 : /402/.test(msg) ? 402 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
