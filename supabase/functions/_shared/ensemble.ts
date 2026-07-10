// Ensemble: run multiple models in parallel on the same scoring task,
// then reconcile disagreements with a tie-break pass.
// Used for numeric judgement (ATS score, keyword match, role-fit).

import { callModel, tryParseJson, type ChatMessage, type PipelineModel } from "./ai-pipeline.ts";

export interface EnsembleMemberResult<T> {
  model: string;
  raw: string;
  parsed: T | null;
}

export interface EnsembleConfig<T> {
  systemPrompt: string;
  userPrompt: string;
  models: PipelineModel[];        // e.g. ["pro", "flash"] — 2+ models
  parse: (raw: string) => T | null;
  reconcile: (results: Array<T>) => T; // deterministic merge (e.g. median, average)
  jsonMode?: boolean;
  temperature?: number;
}

export interface EnsembleOutput<T> {
  output: T;
  members: EnsembleMemberResult<T>[];
  agreement: number; // 0..1 — proportion of members that parsed successfully
}

export async function runEnsemble<T>(cfg: EnsembleConfig<T>): Promise<EnsembleOutput<T>> {
  const messages: ChatMessage[] = [
    { role: "system", content: cfg.systemPrompt },
    { role: "user", content: cfg.userPrompt },
  ];

  const settled = await Promise.allSettled(
    cfg.models.map((m) =>
      callModel(m, messages, {
        temperature: cfg.temperature ?? 0.2,
        jsonMode: cfg.jsonMode ?? true,
      }).then((raw) => ({ m, raw }))
    )
  );

  const members: EnsembleMemberResult<T>[] = settled.map((s, i) => {
    if (s.status === "fulfilled") {
      return {
        model: cfg.models[i],
        raw: s.value.raw,
        parsed: cfg.parse(s.value.raw),
      };
    }
    return { model: cfg.models[i], raw: "", parsed: null };
  });

  const parsed = members.map((m) => m.parsed).filter((p): p is T => p !== null);
  if (parsed.length === 0) {
    throw new Error("Ensemble: all members failed to produce parseable output.");
  }

  const output = cfg.reconcile(parsed);
  return { output, members, agreement: parsed.length / cfg.models.length };
}

// Helpers for numeric reconciliation.
export const median = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const mean = (nums: number[]): number =>
  nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;

// Merge two arrays of strings, keeping the union (deduped case-insensitively).
export function unionStrings(...lists: string[][]): string[] {
  const seen = new Map<string, string>();
  for (const list of lists) {
    for (const s of list) {
      const k = s.toLowerCase().trim();
      if (k && !seen.has(k)) seen.set(k, s);
    }
  }
  return [...seen.values()];
}

// Return items that appear in at least `minVotes` of the input lists.
export function majorityStrings(lists: string[][], minVotes = 2): string[] {
  const counts = new Map<string, { count: number; original: string }>();
  for (const list of lists) {
    const seenInThisList = new Set<string>();
    for (const s of list) {
      const k = s.toLowerCase().trim();
      if (!k || seenInThisList.has(k)) continue;
      seenInThisList.add(k);
      const existing = counts.get(k);
      if (existing) existing.count++;
      else counts.set(k, { count: 1, original: s });
    }
  }
  return [...counts.values()]
    .filter((c) => c.count >= minVotes)
    .map((c) => c.original);
}
