import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JobPosting {
  title: string;
  company: string;
  location?: string;
  url: string;
  postedAt?: string;
  jobType?: string;
  source: "scrape" | "search";
  snippet?: string;
}

const RECENCY_TO_TBS: Record<string, string> = {
  "24h": "qdr:d",
  "7d": "qdr:w",
  "30d": "qdr:m",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      companyName,
      careersUrl,
      website,
      filters = {},
    } = await req.json();

    if (!companyName) {
      return new Response(JSON.stringify({ error: "companyName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { location, jobType, recency, keywords, profession } = filters as {
      location?: string;
      jobType?: string;
      recency?: "24h" | "7d" | "30d";
      keywords?: string;
      profession?: string;
    };

    const filterTerms = [keywords, profession, location, jobType].filter(Boolean).join(" ");
    const jobs: JobPosting[] = [];

    // ===== 1. Try to SCRAPE the company's careers page =====
    const targetUrl = careersUrl || website;
    if (targetUrl) {
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl, formats: ["markdown", "links"], onlyMainContent: true }),
        });
        if (scrapeRes.ok) {
          const sd = await scrapeRes.json();
          const md: string = sd?.data?.markdown || sd?.markdown || "";
          const links: string[] = sd?.data?.links || sd?.links || [];

          // Heuristic: extract job-like links
          const jobLinks = links.filter((l) =>
            /(job|career|position|opening|vacanc|offre|emploi|stage|posting|apply)/i.test(l)
          );

          // Use AI to extract structured postings from the markdown
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (LOVABLE_API_KEY && md) {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content:
                      "Extract job postings from the provided careers page markdown. Return ONLY JSON: { jobs: [{ title, location, jobType, url, postedAt }] }. If a field is unknown, omit it. Only include actual job postings, not navigation links.",
                  },
                  { role: "user", content: `Company: ${companyName}\nKnown job links:\n${jobLinks.slice(0, 30).join("\n")}\n\nPage content:\n${md.slice(0, 12000)}` },
                ],
                temperature: 0.1,
              }),
            });
            if (aiRes.ok) {
              const ai = await aiRes.json();
              const content = ai.choices?.[0]?.message?.content || "";
              const m = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
              try {
                const parsed = JSON.parse(m?.[1] || m?.[0] || content);
                for (const j of parsed.jobs || []) {
                  jobs.push({
                    title: j.title,
                    company: companyName,
                    location: j.location,
                    jobType: j.jobType,
                    url: j.url || targetUrl,
                    postedAt: j.postedAt,
                    source: "scrape",
                  });
                }
              } catch (e) {
                console.warn("Failed to parse scrape AI extraction:", e);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Scrape failed:", err);
      }
    }

    // ===== 2. AI SEARCH fallback (always also runs to broaden coverage) =====
    try {
      const tbs = recency ? RECENCY_TO_TBS[recency] : undefined;
      const query = `${companyName} jobs ${filterTerms}`.trim();
      const searchRes = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 10, ...(tbs ? { tbs } : {}) }),
      });
      if (searchRes.ok) {
        const sd = await searchRes.json();
        const results = sd?.data || sd?.web?.results || [];
        for (const r of results) {
          const title: string = r.title || "";
          // Skip obvious non-job results
          if (!/(job|career|position|hiring|emploi|stage|opening|vacanc)/i.test(title + " " + (r.description || ""))) continue;
          jobs.push({
            title,
            company: companyName,
            url: r.url,
            snippet: r.description || r.snippet,
            source: "search",
          });
        }
      }
    } catch (err) {
      console.warn("Search failed:", err);
    }

    // ===== 3. Client-side filter pass =====
    const filtered = jobs.filter((j) => {
      const hay = `${j.title} ${j.location || ""} ${j.jobType || ""} ${j.snippet || ""}`.toLowerCase();
      if (location && !hay.includes(location.toLowerCase()) && !/(remote|télétravail)/i.test(hay)) {
        // soft: keep if location is generic
      }
      if (jobType && !hay.includes(jobType.toLowerCase())) return true; // soft filter — many pages omit type
      if (keywords) {
        const ks = keywords.toLowerCase().split(/[, ]+/).filter(Boolean);
        if (ks.length && !ks.some((k) => hay.includes(k))) return false;
      }
      return true;
    });

    // Dedupe by URL
    const seen = new Set<string>();
    const deduped = filtered.filter((j) => {
      if (!j.url || seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });

    return new Response(JSON.stringify({ jobs: deduped, totalFound: deduped.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-jobs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
