import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cv, role, language, duration } = await req.json();
    if (!cv) return new Response(JSON.stringify({ error: "CV is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const lang = language === "french" ? "French" : "English";
    const seconds = duration === "30s" ? "30 seconds (about 75 words)" : duration === "90s" ? "90 seconds (about 225 words)" : "60 seconds (about 150 words)";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a career coach. Generate a compelling elevator pitch for a job seeker based on their CV.
The pitch must be for ${seconds}. Write in ${lang}.
It should: introduce who they are, their key value proposition, 1-2 standout achievements with metrics, and end with a confident hook.
Be natural, conversational, and confident — not robotic.
${role ? `Target role: ${role}` : ""}
Respond with ONLY valid JSON: { "pitch": "the full pitch text" }`,
          },
          { role: "user", content: `CV:\n${cv}` },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    let parsed;
    try {
      const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(m ? m[1].trim() : content.trim());
    } catch { throw new Error("Failed to parse pitch"); }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("elevator-pitch error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
