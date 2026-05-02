import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cv, jd, recipientName, recipientRole, companyName, channel, tone, language, companyUrl, autoResearch } = await req.json();
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

    // ===== Optional: scrape/search the company for personalization =====
    let companyResearch = "";
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (autoResearch && FIRECRAWL_API_KEY) {
      try {
        if (companyUrl) {
          const scrapeRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
            method: "POST",
            headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url: companyUrl, formats: ["markdown", "summary"], onlyMainContent: true }),
          });
          if (scrapeRes.ok) {
            const sd = await scrapeRes.json();
            const md = sd?.data?.markdown || sd?.markdown || "";
            const sum = sd?.data?.summary || sd?.summary || "";
            companyResearch = (sum + "\n\n" + md).slice(0, 4000);
          }
        }
        if (!companyResearch) {
          const searchRes = await fetch("https://api.firecrawl.dev/v2/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ query: `${companyName} company recent news mission ${recipientRole || ""}`, limit: 4 }),
          });
          if (searchRes.ok) {
            const sd = await searchRes.json();
            const results = sd?.data || sd?.web?.results || [];
            companyResearch = results.slice(0, 4).map((r: any) => `- ${r.title}: ${r.description || r.snippet || ""}`).join("\n").slice(0, 3000);
          }
        }
      } catch (err) {
        console.warn("Firecrawl research failed, continuing without it:", err);
      }
    }

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

CORE PITCH FRAMING (build the message around these 3 pillars in order):
1. WHERE I FIT — show you understand their needs and pinpoint exactly where your profile maps to their requirements.
2. VALUE I ADD — one crisp line with a quantified outcome you've delivered (numbers, %, scale, revenue, time saved).
3. WHY I'M A GREAT FIT — one strategic line on why you × this company × this moment makes sense.

Rules:
- Keep it impressive but SIMPLE. Short sentences. Plain language. Designed to get a reply.
- ${channelType === "linkedin" ? "Connection note under 300 characters; main message under 120 words" : "Email body under 130 words"}
- Personalize based on the recipient's role and company${companyResearch ? " AND the company research provided below" : ""}
- Soft, specific CTA (15-min chat, intro, feedback) — never aggressive
- Sound human, not templated. No "I hope this finds you well." No "I am writing to..."
${cv ? "- Reference 1 specific achievement from the CV that maps to their needs" : ""}
${jd ? "- Mirror 2-3 exact keywords from the JD" : ""}

Return ONLY valid JSON:
{
  "subject": "email subject line (only for email channel) — under 50 chars, curiosity-driven",
  "message": "the full message body following the 3-pillar framing",
  "connectionNote": "short LinkedIn connection request note (only for linkedin channel)",
  "followUp": "a follow-up message to send if no response after 5 days — even shorter, restate value",
  "tips": ["tips for improving response rate"],
  "personalizationHooks": ["specific personalization points used"],
  "pillarsCovered": { "fit": "one-line where-I-fit summary", "value": "one-line value-I-add summary", "whyGreat": "one-line why-great-fit summary" }
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
