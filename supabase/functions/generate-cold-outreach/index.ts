import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runThreePass, tryParseJson } from "../_shared/ai-pipeline.ts";
import { checkBannedPhrases, checkGrounding, checkWordCount, combineValidators } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require a valid Supabase JWT (anon or user session) to block bot credit-draining.
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
    const { cv, jd, recipientName, recipientRole, companyName, channel, tone, language, companyUrl, autoResearch } = await req.json();
    if (!companyName || !recipientName) return new Response(JSON.stringify({ error: "Company name and recipient name are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (
      (typeof cv === "string" && cv.length > 30000) ||
      (typeof jd === "string" && jd.length > 15000) ||
      [recipientName, recipientRole, companyName, companyUrl].some((v) => typeof v === "string" && v.length > 500)
    ) {
      return new Response(JSON.stringify({ error: "Payload too large." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    // SSRF guard: only allow public http(s) URLs, block internal / metadata hosts.
    const isSafePublicUrl = (raw: string): boolean => {
      try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:") return false;
        const host = u.hostname.toLowerCase();
        if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
        // IPv4 literal
        const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4) {
          const [a, b] = [parseInt(ipv4[1]), parseInt(ipv4[2])];
          if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a >= 224) return false;
        }
        // IPv6 literal / loopback / link-local
        if (host.includes(":") || host === "[::1]" || host.startsWith("[fc") || host.startsWith("[fd") || host.startsWith("[fe80")) return false;
        return true;
      } catch {
        return false;
      }
    };

    if (autoResearch && FIRECRAWL_API_KEY) {
      try {
        if (companyUrl && isSafePublicUrl(companyUrl)) {
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

    const systemPrompt = `You are writing a ${channelType === "linkedin" ? "LinkedIn message" : "cold email"} as the candidate themselves — not as a marketer, not as an AI. Tone: warm, conversational, human. ${toneType}.

Hard rules — break any of these and the message fails:
- MAX ${channelType === "linkedin" ? "80 words" : "90 words"}. Shorter is better. Cut every word that isn't pulling weight.
- Sound like a real person texting a peer. Contractions. Plain words. No corporate filler.
- BANNED phrases: "I hope this finds you well", "I am writing to", "I came across", "I wanted to reach out", "passionate about", "leverage", "synergy", "excited about the opportunity", "stood out to me", "as a [adjective] professional", "I believe my skills".
- No throat-clearing. Open with something specific to THEM (their work, a recent move, the role) — not about yourself.
- ONE concrete proof point with a number, not a list of achievements.
- ONE specific, low-friction ask (15 min, a quick reply, a pointer) — never "explore opportunities".
- No bullet points. No headers. No sign-off fluff beyond a name.

Structure (woven into prose, not labelled):
1. A specific hook about them or the role (1 sentence).
2. Why you fit — tied to one thing they actually need (1 sentence).
3. One quantified proof (1 sentence).
4. A small, specific ask (1 sentence).

${cv ? "- Pull one real, specific achievement from the CV. Don't invent numbers.\n" : ""}${jd ? "- Mirror at most 2 exact phrases from the JD, woven naturally.\n" : ""}${channelType === "linkedin" ? "- Connection note must be under 280 characters and feel like a normal human request.\n" : "- Subject line under 45 chars, lowercase ok, curiosity-driven, never salesy.\n"}

Return ONLY valid JSON:
{
  "subject": "${channelType === "linkedin" ? "" : "short, specific subject"}",
  "message": "the message body — concise, warm, human",
  "connectionNote": "${channelType === "linkedin" ? "short connection request note" : ""}",
  "followUp": "a 2-3 sentence nudge if no reply after 5 days — friendly, not pushy",
  "tips": ["1-3 short tips to lift response rate"],
  "personalizationHooks": ["the specific hooks used"],
  "pillarsCovered": { "fit": "one-line fit summary", "value": "one-line value summary", "whyGreat": "one-line why-now summary" }
}${langInstruction}`;

    const userPrompt = `Recipient: ${recipientName}\nRole: ${recipientRole || "Hiring Manager"}\nCompany: ${companyName}\nChannel: ${channelType}\nTone: ${toneType}\nOutput Language: ${lang}${cv ? `\n\nMy CV:\n${cv}` : ""}${jd ? `\n\nJob Description:\n${jd}` : ""}${companyResearch ? `\n\nCompany Research (use to personalize the WHERE-I-FIT and WHY-GREAT-FIT pillars):\n${companyResearch}` : ""}`;

    const source = `${cv || ""}\n${jd || ""}\n${companyName}\n${companyResearch}`;
    const maxWords = channelType === "linkedin" ? 80 : 90;

    type OutreachOut = {
      subject?: string; message: string; connectionNote?: string;
      followUp?: string; tips?: string[]; personalizationHooks?: string[];
      pillarsCovered?: Record<string, string>;
    };

    try {
      const { output } = await runThreePass<OutreachOut>({
        systemPrompt,
        userPrompt,
        critiquePrompt:
          "Score this outreach message as a busy hiring manager who gets 50 of these a day. Flag: (a) any banned phrase, (b) throat-clearing openers about the sender, (c) any claim not grounded in the CV or provided research, (d) fabricated numbers, (e) generic openings that could go to any company, (f) message body over the word cap, (g) vague asks like 'connect' or 'explore opportunities'. PASS only if truly tight.",
        parse: (raw) => tryParseJson<OutreachOut>(raw),
        validate: (out) => {
          const body = out.message ?? "";
          return combineValidators([
            checkBannedPhrases(body),
            checkWordCount(body, 25, maxWords + 15),
            checkGrounding(body, source, 0.28),
          ]);
        },
        draftModel: "flash",
        refineModel: "pro",
        temperature: 0.5,
        jsonMode: true,
        maxRetries: 1,
      });
      clearTimeout(timeout);
      return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (pipelineErr: any) {
      clearTimeout(timeout);
      const msg = String(pipelineErr?.message ?? pipelineErr);
      if (msg.includes("429")) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (msg.includes("402")) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw pipelineErr;
    }

  } catch (e) {
    console.error("cold-outreach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
