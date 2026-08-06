import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { scoreAnswerEnsemble } from "../_shared/interview-scoring.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { cv, jd, role, question, answer, rubric, language } = await req.json();

    if (!question || !answer) {
      return new Response(
        JSON.stringify({ error: "Question and answer are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      (typeof cv === "string" && cv.length > 30000) ||
      (typeof jd === "string" && jd.length > 15000) ||
      (typeof question === "string" && question.length > 5000) ||
      (typeof answer === "string" && answer.length > 5000) ||
      (typeof role === "string" && role.length > 500)
    ) {
      return new Response(
        JSON.stringify({ error: "Payload too large." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3-model median ensemble (pro + flash + lite): median score is robust to a
    // single outlier model, qualitative fields come from majority vote.
    const { output, meta } = await scoreAnswerEnsemble({
      cv,
      jd,
      role,
      question,
      answer,
      rubric,
      language,
    });

    return new Response(
      JSON.stringify({
        ...output,
        _ensembleAgreement: meta.agreement,
        _ensemble: meta,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out." }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("evaluate-answer error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = /429/.test(msg) ? 429 : /402/.test(msg) ? 402 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
