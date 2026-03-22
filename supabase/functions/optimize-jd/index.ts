import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jd, cv, language } = await req.json();
    if (!jd) return new Response(JSON.stringify({ error: "Job description is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const lang = language === "french" ? "French" : "English";
    const langInstruction = language === "french"
      ? `\n\nIMPORTANT: Write ALL output text (optimizedJD, keyChanges, warnings, hiddenRequirements, applicationTips, tailoringAdvice) in French.`
      : "";

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
            content: `You are an ATS optimization expert. Given a job description, analyze and optimize it for ATS screening. ${cv ? "Also consider the provided CV to suggest how the candidate should tailor their application." : ""}

Return ONLY valid JSON:
{
  "optimizedJD": "the rewritten/optimized job description text",
  "keyChanges": ["list of key changes made"],
  "atsScore": number 1-100 rating how ATS-friendly the original JD is,
  "warnings": ["potential red flags or issues in the JD"],
  "hiddenRequirements": ["requirements that are implied but not explicitly stated"],
  "applicationTips": ["specific tips for applying to this role"]${cv ? ',\n  "tailoringAdvice": ["how to tailor CV specifically for this JD"]' : ""}
}${langInstruction}`
          },
          { role: "user", content: `Job Description:\n${jd}${cv ? `\n\nCandidate CV:\n${cv}` : ""}\n\nOutput Language: ${lang}` }
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
    console.error("optimize-jd error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
