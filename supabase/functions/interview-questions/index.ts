import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cv, jd, role, mode } = await req.json();
    // mode: "generate" = generate questions+answers, "evaluate" = evaluate user's answer

    if (!jd) {
      return new Response(
        JSON.stringify({ error: "Job Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let systemPrompt: string;
    let userContent: string;

    if (mode === "evaluate") {
      const { question, answer } = await req.json().catch(() => ({ question: "", answer: "" }));
      systemPrompt = `You are a senior hiring manager conducting interviews. Evaluate this answer honestly.
Respond with ONLY valid JSON:
{
  "score": 0-10,
  "feedback": "specific feedback",
  "idealAnswer": "what a strong answer would look like",
  "tips": ["actionable tips"]
}`;
      userContent = `Role: ${role}\nJD: ${jd}\n${cv ? `CV: ${cv}` : ""}\n\nQuestion: ${question}\nCandidate Answer: ${answer}`;
    } else {
      systemPrompt = `You are a senior hiring manager. Generate realistic interview questions for this role.
Include a mix of: behavioral (STAR format), technical/role-specific, situational, and culture-fit questions.
${cv ? "Also provide suggested answers based on the candidate's CV." : ""}

Respond with ONLY valid JSON:
{
  "questions": [
    {
      "question": "the interview question",
      "category": "behavioral|technical|situational|culture-fit",
      "difficulty": "easy|medium|hard",
      "whyAsked": "what the interviewer is really assessing",
      ${cv ? '"suggestedAnswer": "tailored answer using CV experience",' : ""}
      "tips": ["tips for answering well"]
    }
  ]
}

Generate 8-10 questions ordered from warm-up to tough.`;
      userContent = `Role: ${role || "Not specified"}\n\nJob Description:\n${jd}\n${cv ? `\nCandidate CV:\n${cv}` : ""}`;
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.4,
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
      throw new Error("Failed to parse interview questions result");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out." }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("interview-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
