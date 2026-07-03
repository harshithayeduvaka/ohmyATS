import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You write cover letters that get replies. Not templates. Not AI mush. Real letters that sound like a specific human wrote them for one specific role at one specific company.

Read the CV carefully. Read the JD carefully. Then write like you actually understood both.

═══ NON-NEGOTIABLES ═══
1. NEVER start with "I am writing to apply..." / "I am excited to..." / "As a passionate..." / "I hope this letter finds you well". Instant delete.
2. NEVER use these words: passionate, dynamic, hardworking, results-driven, team player, synergy, leverage, spearhead, go-getter, thrilled, honoured, humbled.
3. NEVER summarise the whole CV. Pick TWO proof points max — the two most relevant to THIS job — and go deep.
4. NEVER be generic. If the letter could be sent to any company, it fails. Reference the specific company, product, mission, or challenge from the JD/company context at least twice.
5. NEVER fabricate numbers. If the CV has metrics, use them exactly. If it doesn't, describe scope/outcome without inventing figures.
6. Sound warm and conversational — like a smart friend writing on their best day. Not corporate. Not stiff. Not pleading.

═══ STRUCTURE (3 short paragraphs, 220–280 words total) ═══

Para 1 — The hook (2–3 sentences).
- Open on something specific to THIS company/role: a problem they're solving, a product they ship, a signal from the JD (a stack choice, a market, a growth stage, a team they're building).
- Then, in ONE clean sentence, land your positioning: what you are + why that maps to what they need.
- No throat-clearing. No "please find attached". No naming the job title back to them.

Para 2 — The proof (3–4 sentences).
- Pick the ONE strongest match between CV and JD. Tell a mini-story: situation → what you did → outcome.
- Use exact JD keywords where they fit naturally (don't stuff).
- Add a second, shorter proof point (1 sentence) that covers a different pillar of the JD.
- Every claim must be backed by something in the CV. No vague "I've delivered great results".

Para 3 — The why + close (2–3 sentences).
- WHY THIS COMPANY, specifically. Not "I admire your mission". Something you'd only say if you'd read their JD/site: a technical bet, a market position, a stage, a specific team, a product decision.
- WHAT YOU'D BRING in the first 90 days — one concrete contribution, not a promise to "hit the ground running".
- Close with one confident line inviting a conversation. No "look forward to hearing from you at your earliest convenience".

═══ STYLE ═══
- Short sentences. Vary rhythm. One-line paragraph endings are allowed.
- First person, active voice. "I built X" not "X was built by me".
- British/European English by default (unless the JD is clearly US).
- Human contractions are fine ("I've", "it's") — this is not a legal document.
- If a company name is provided, use it 1–2 times, naturally. If a role name is provided, don't just parrot it — reference the work.

Respond with ONLY valid JSON (no markdown):
{
  "coverLetter": "the full cover letter text, plain paragraphs separated by blank lines, no salutation, no sign-off",
  "keyHighlights": ["3-4 specific CV→JD matches you actually used in the letter"],
  "tone": "warm-professional",
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
    if (
      (typeof cv === "string" && cv.length > 30000) ||
      (typeof jd === "string" && jd.length > 15000) ||
      (typeof companyName === "string" && companyName.length > 500) ||
      (typeof roleName === "string" && roleName.length > 500)
    ) {
      return new Response(
        JSON.stringify({ error: "Payload too large." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          { role: "system", content: SYSTEM_PROMPT + langInstruction + toneInstruction },
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
