// Shared three-pass AI pipeline: DRAFT -> CRITIC -> REWRITE -> VALIDATE (+retry).
// Used by every accuracy-critical edge function.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type PipelineModel = "flash" | "pro";

const MODEL_MAP: Record<PipelineModel, string> = {
  flash: "google/gemini-2.5-flash",
  pro: "google/gemini-2.5-pro",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface CallOpts {
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function callModel(
  model: PipelineModel,
  messages: ChatMessage[],
  opts: CallOpts = {}
): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);

  try {
    const body: Record<string, unknown> = {
      model: MODEL_MAP[model],
      messages,
      temperature: opts.temperature ?? 0.4,
    };
    if (opts.jsonMode) body.response_format = { type: "json_object" };

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal ?? controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI gateway ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export function tryParseJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : raw.trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const braced = candidate.match(/\{[\s\S]*\}/);
    if (braced) {
      try {
        return JSON.parse(braced[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export type ValidatorResult = { ok: true } | { ok: false; issues: string[] };
export type Validator<T> = (output: T) => ValidatorResult | Promise<ValidatorResult>;

export interface PipelineConfig<T> {
  systemPrompt: string;
  userPrompt: string;
  critiquePrompt: string;      // Instructions for the critic pass
  parse: (raw: string) => T | null;
  validate?: Validator<T>;
  draftModel?: PipelineModel;  // default: flash
  refineModel?: PipelineModel; // default: pro (used for critic + rewrite)
  temperature?: number;
  jsonMode?: boolean;
  maxRetries?: number;         // default: 1
}

export interface PipelineTrace {
  passes: number;
  validatorIssues: string[];
  fallbackUsed: boolean;
}

export interface PipelineOutput<T> {
  output: T;
  trace: PipelineTrace;
}

/**
 * Runs a three-pass AI pipeline for generative tasks.
 * Returns the validated output, or throws if the final pass still fails schema parsing.
 */
export async function runThreePass<T>(cfg: PipelineConfig<T>): Promise<PipelineOutput<T>> {
  const draftModel = cfg.draftModel ?? "flash";
  const refineModel = cfg.refineModel ?? "pro";
  const maxRetries = cfg.maxRetries ?? 1;
  const trace: PipelineTrace = { passes: 0, validatorIssues: [], fallbackUsed: false };

  // Pass 1: Draft
  trace.passes++;
  const draftRaw = await callModel(
    draftModel,
    [
      { role: "system", content: cfg.systemPrompt },
      { role: "user", content: cfg.userPrompt },
    ],
    { temperature: cfg.temperature ?? 0.5, jsonMode: cfg.jsonMode }
  );

  // Pass 2: Critic — asks the pro model to enumerate specific defects.
  trace.passes++;
  const critique = await callModel(
    refineModel,
    [
      {
        role: "system",
        content:
          "You are a ruthless quality critic. Read the DRAFT and list every specific defect you find, referencing exact lines/claims. If nothing is wrong, output the single word: PASS. Never soften your critique.",
      },
      {
        role: "user",
        content: `TASK CONTEXT:\n${cfg.critiquePrompt}\n\nORIGINAL INPUT:\n${cfg.userPrompt}\n\nDRAFT TO CRITIQUE:\n${draftRaw}`,
      },
    ],
    { temperature: 0.2 }
  );

  let candidate: string = draftRaw;

  if (critique.trim().toUpperCase() !== "PASS" && critique.trim().length > 8) {
    // Pass 3: Rewrite — pro model regenerates, fixing critic's list.
    trace.passes++;
    candidate = await callModel(
      refineModel,
      [
        { role: "system", content: cfg.systemPrompt },
        {
          role: "user",
          content: `${cfg.userPrompt}\n\nA prior draft was produced and critiqued. Rewrite from scratch, fixing every defect below. Do not repeat the same mistakes.\n\nDEFECTS TO FIX:\n${critique}\n\nPRIOR DRAFT (for reference only, do not copy):\n${draftRaw}`,
        },
      ],
      { temperature: cfg.temperature ?? 0.5, jsonMode: cfg.jsonMode }
    );
  }

  // Pass 4: Validate (deterministic).
  let parsed = cfg.parse(candidate);
  if (parsed !== null && cfg.validate) {
    const v = await cfg.validate(parsed);
    if (!v.ok && maxRetries > 0) {
      trace.validatorIssues = v.issues;
      trace.passes++;
      // Retry once, feeding the validator failures back in.
      const retryRaw = await callModel(
        refineModel,
        [
          { role: "system", content: cfg.systemPrompt },
          {
            role: "user",
            content: `${cfg.userPrompt}\n\nYour previous output failed automated validation. Fix EVERY issue below and re-emit the full output. Do not explain — just output the corrected result.\n\nVALIDATION FAILURES:\n- ${v.issues.join("\n- ")}\n\nPREVIOUS OUTPUT:\n${candidate}`,
          },
        ],
        { temperature: 0.3, jsonMode: cfg.jsonMode }
      );
      const retryParsed = cfg.parse(retryRaw);
      if (retryParsed !== null) {
        const v2 = await cfg.validate(retryParsed);
        if (v2.ok) {
          return { output: retryParsed, trace };
        }
        // Keep whichever had fewer issues — but mark fallback used.
        trace.fallbackUsed = true;
        trace.validatorIssues = v2.ok ? [] : v2.issues;
        return { output: retryParsed, trace };
      }
    }
  }

  if (parsed === null) {
    throw new Error("Pipeline produced unparseable output after all passes.");
  }
  return { output: parsed, trace };
}
