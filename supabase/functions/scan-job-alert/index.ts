import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { alertId } = await req.json();
    if (!alertId) return new Response(JSON.stringify({ error: "alertId required" }), { status: 400, headers: corsHeaders });

    const { data: alert } = await supabase.from("job_alerts").select("*").eq("id", alertId).eq("user_id", user.id).single();
    if (!alert) return new Response(JSON.stringify({ error: "Alert not found" }), { status: 404, headers: corsHeaders });

    // Scrape with Firecrawl
    const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
    let markdown = "";
    if (fcKey) {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${fcKey}` },
        body: JSON.stringify({ url: alert.careers_url, formats: ["markdown"], onlyMainContent: true }),
      });
      const fcData = await fcRes.json();
      markdown = fcData?.data?.markdown || "";
    }

    if (!markdown) {
      return new Response(JSON.stringify({ error: "Could not fetch careers page" }), { status: 500, headers: corsHeaders });
    }

    // Extract jobs via Lovable AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract job postings from the markdown. Return ONLY a JSON array of objects with fields: title, url, location. Use absolute URLs. If a URL is relative, prefix with the careers base. Max 30." },
          { role: "user", content: `Careers URL: ${alert.careers_url}\nKeywords filter (optional): ${alert.keywords || "none"}\n\nMarkdown:\n${markdown.slice(0, 15000)}` },
        ],
      }),
    });
    const aiData = await aiRes.json();
    let content = aiData?.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\n?|```/g, "").trim();
    let jobs: Array<{ title: string; url: string; location?: string }> = [];
    try { jobs = JSON.parse(content); } catch { jobs = []; }

    // Filter by keywords if provided
    if (alert.keywords) {
      const kws = alert.keywords.toLowerCase().split(/[,;]/).map((k: string) => k.trim()).filter(Boolean);
      if (kws.length) jobs = jobs.filter(j => kws.some(k => j.title?.toLowerCase().includes(k)));
    }

    // Insert (UNIQUE constraint dedupes)
    let newCount = 0;
    for (const j of jobs) {
      if (!j.url || !j.title) continue;
      const { error } = await supabase.from("job_notifications").insert({
        user_id: user.id,
        alert_id: alert.id,
        company_name: alert.company_name,
        job_title: j.title,
        job_url: j.url,
        location: j.location || "",
      });
      if (!error) newCount++;
    }

    await supabase.from("job_alerts").update({ last_checked_at: new Date().toISOString() }).eq("id", alert.id);

    return new Response(JSON.stringify({ found: jobs.length, new: newCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
