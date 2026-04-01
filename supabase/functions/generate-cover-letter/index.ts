import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a France-based hiring manager reviewing applications. Generate a powerful, highly targeted French/EU-style cover letter (lettre de motivation) based on the candidate's CV and the target job description.

STRICT STRUCTURE (exactly 3 paragraphs, 250-320 words):

Paragraph 1 — Start with THEIR problem, not the candidate's introduction.
- Do NOT write: "I am writing to apply..." or any variant.
- Open by referencing what the company is trying to achieve or solve (based on the JD).
- Use their terminology directly from the job description.
- Show clear understanding of the role's core objective.

Paragraph 2 — Position the candidate as the solution.
- Mirror the exact keywords and competencies from the JD.
- Align the candidate's strongest 2-3 relevant experiences from the CV to those needs.
- Include ONE measurable impact story with specific numbers (metrics, % improvement, revenue, efficiency, time saved, etc.).
- Do NOT summarise the entire CV.
- No generic adjectives like "hardworking" or "passionate."

Paragraph 3 — Motivation + strong close.
- State why this specific company/team/role makes sense strategically (based on JD/company context).
- Keep it professional and concise.
- End with a confident call to action.
- Do NOT mention visa sponsorship.
- Do NOT sound desperate. No emotional storytelling.

STYLE RULES:
- French professional tone. Direct. Clear. Strategic. No fluff.
- No repetition. No clichés.
- 250-320 words strictly.
- Every major skill mentioned in the JD must appear naturally in the letter.
- Must sound human, not AI-generated.
- Must accord with French & EU professional standards and norms.

Respond with ONLY valid JSON (no markdown):
{
  "coverLetter": "the full cover letter text",
  "keyHighlights": ["3-4 specific CV-to-JD matches you leveraged"],
  "tone": "formal|professional|conversational",
  "wordCount": number
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cv, jd, companyName, roleName, language, tone } = await req.json();
    if (!cv || !jd) {
      return new Response(
        JSON.stringify({ error: "Both CV and Job Description are required for cover letter generation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language === "french" ? "French" : "English";
    const langInstruction = language === "french"
      ? "\n\nIMPORTANT: Write the ENTIRE cover letter in French. All output text must be in French."
      : "";

    const toneInstructions: Record<string, string> = {
      professional: "\n\nTONE: Formal, structured, and polished. Use measured language. Classic corporate style.",
      bold: "\n\nTONE: Bold, direct, and confident. No hedging. Short punchy sentences. Lead with impact. Cut all filler words. Sound like a senior executive.",
      creative: "\n\nTONE: Creative and memorable. Use an unexpected opening hook. Show personality. Be witty but professional. Make the reader pause and think 'this one's different.' Avoid corporate clichés entirely.",
    };
    const toneInstruction = toneInstructions[tone || "professional"] || toneInstructions.professional;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const extra = [
      companyName ? `Company: ${companyName}` : "",
      roleName ? `Role: ${roleName}` : "",
      `Output Language: ${lang}`,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + langInstruction },
          { role: "user", content: `CV:\n${cv}\n\nJob Description:\n${jd}\n${extra}` },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
    } catch {
      throw new Error("Failed to parse cover letter result");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out." }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("cover-letter error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
