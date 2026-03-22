import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cv, jd, recipientName, recipientRole, companyName, channel, tone, language } = await req.json();
    if (!companyName || !recipientName) return new Response(JSON.stringify({ error: "Company name and recipient name are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const channelType = channel || "email";
    const toneType = tone || "professional";
    const lang = language === "french" ? "French" : "English";
    const langInstruction = language === "french"
      ? `\n\nIMPORTANT: Write ALL output text (subject, message, connectionNote, followUp, tips) in French.`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `You are an expert cold outreach copywriter. Generate a compelling ${channelType === "linkedin" ? "LinkedIn message" : "cold email"} that is ${toneType} in tone.

Rules:
- Keep it concise (${channelType === "linkedin" ? "under 300 characters for connection request, under 500 for InMail" : "under 150 words for email body"})
- Personalize based on the recipient's role and company
- Include a clear value proposition
- End with a soft CTA (not aggressive)
- Sound human, not templated
${cv ? "- Reference specific achievements from the CV that are relevant" : ""}
${jd ? "- Align with the job description requirements" : ""}

Return ONLY valid JSON:
{
  "subject": "email subject line (only for email channel)",
  "message": "the full message body",
  "connectionNote": "short LinkedIn connection request note (only for linkedin channel)",
  "followUp": "a follow-up message to send if no response after 5 days",
  "tips": ["tips for improving response rate"],
  "personalizationHooks": ["specific personalization points used"]
}${langInstruction}`
          },
          {
            role: "user",
            content: `Recipient: ${recipientName}\nRole: ${recipientRole || "Hiring Manager"}\nCompany: ${companyName}\nChannel: ${channelType}\nTone: ${toneType}\nOutput Language: ${lang}${cv ? `\n\nMy CV:\n${cv}` : ""}${jd ? `\n\nJob Description:\n${jd}` : ""}`
          }
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
    console.error("cold-outreach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
