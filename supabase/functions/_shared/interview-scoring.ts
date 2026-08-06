// Shared 3-model median ensemble for interview answer scoring.
// Used by the `evaluate-answer` function and by the `/eval` harness so both
// measure the exact same scorer.

import { tryParseJson } from "./ai-pipeline.ts";
import { runEnsemble, median, type EnsembleMemberResult } from "./ensemble.ts";

export interface EvalOut {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  tips: string[];
  rubricHits?: string[];
  rubricMisses?: string[];
}

export interface EnsembleMeta {
  models: string[];
  scores: number[];
  median: number;
  spread: number;      // max - min across members
  agreement: number;   // 0..1 — proportion of members that parsed
  consistent: boolean; // spread <= SPREAD_TOLERANCE
}

export const SPREAD_TOLERANCE = 2;

export interface ScoreAnswerInput {
  cv?: string;
  jd?: string;
  role?: string;
  question: string;
  answer: string;
  rubric?: string[];
  language?: string;
}

function buildPrompts(input: ScoreAnswerInput) {
  const { cv, jd, role, question, answer, rubric, language } = input;
  const lang = language === "french" ? "French" : "English";
  const langInstruction = language === "french"
    ? `\n\nIMPORTANT: Write ALL output (verdict, strengths, weaknesses, idealAnswer, tips, rubricHits, rubricMisses) in French.`
    : "";

  const rubricArr: string[] = Array.isArray(rubric) ? rubric.filter((r) => typeof r === "string") : [];
  const rubricBlock = rubricArr.length > 0
    ? `\n\nSCORING RUBRIC (score against each criterion — an answer only scores 8+ if it hits most of these):\n${rubricArr.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nIn "rubricHits" list criteria the answer clearly meets. In "rubricMisses" list criteria it fails or partially meets. The score MUST reflect the ratio of hits to total criteria: <40% hits => 3-4, 40-60% => 5-6, 60-80% => 7, 80-100% with specifics => 8-9, only near-perfect with quantified outcomes => 10.`
    : `\n\nNo rubric provided — score harshly. Only structured, specific, quantified answers score 8+. Most answers are 4-6/10.`;

  const systemPrompt = `You are a brutally honest senior hiring manager evaluating an interview answer.

Respond with ONLY valid JSON:
{
  "score": 0-10,
  "verdict": "one-line verdict",
  "strengths": ["what was good"],
  "weaknesses": ["what was missing or weak"],
  "idealAnswer": "STAR-format ideal answer with specifics",
  "tips": ["actionable improvement tips"],
  "rubricHits": ["criteria met"],
  "rubricMisses": ["criteria missed"]
}${rubricBlock}${langInstruction}`;

  const userPrompt = `Role: ${role || "General"}\n${jd ? `JD: ${jd}\n` : ""}${cv ? `CV: ${cv}\n` : ""}\nQuestion: ${question}\nCandidate's Answer: ${answer}\n\nOutput Language: ${lang}`;

  return { systemPrompt, userPrompt };
}

// Majority vote across members: keep items seen in >= minVotes members,
// falling back to the primary member's list when nothing reaches quorum.
function majorityList(results: EvalOut[], key: keyof EvalOut, minVotes: number, limit: number): string[] {
  const counts = new Map<string, { count: number; original: string }>();
  for (const r of results) {
    const arr = (r[key] as string[]) ?? [];
    const seen = new Set<string>();
    for (const s of arr) {
      const k = s.toLowerCase().trim();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const e = counts.get(k);
      if (e) e.count++;
      else counts.set(k, { count: 1, original: s });
    }
  }
  const voted = [...counts.values()].filter((c) => c.count >= minVotes).map((c) => c.original);
  const fallback = [...counts.values()].sort((a, b) => b.count - a.count).map((c) => c.original);
  return (voted.length > 0 ? voted : fallback).slice(0, limit);
}

export async function scoreAnswerEnsemble(
  input: ScoreAnswerInput
): Promise<{ output: EvalOut; meta: EnsembleMeta }> {
  const { systemPrompt, userPrompt } = buildPrompts(input);
  const models = ["pro", "flash", "lite"] as const;

  let memberScores: number[] = [];
  let members: EnsembleMemberResult<EvalOut>[] = [];

  const { output, agreement } = await runEnsemble<EvalOut>({
    systemPrompt,
    userPrompt,
    models: [...models],
    parse: (raw) => {
      const p = tryParseJson<EvalOut>(raw);
      if (!p || typeof p.score !== "number") return null;
      return p;
    },
    reconcile: (results) => {
      const scores = results.map((r) => Math.max(0, Math.min(10, r.score)));
      memberScores = scores;
      // Median is robust to a single outlier model — the point of 3 members.
      const med = Math.round(median(scores) * 10) / 10;
      // Narrative fields come from the member closest to the median, so the
      // verdict text always matches the reported score.
      const primary = results.reduce((best, r) =>
        Math.abs(Math.max(0, Math.min(10, r.score)) - med) <
        Math.abs(Math.max(0, Math.min(10, best.score)) - med)
          ? r
          : best
      );
      const minVotes = results.length >= 3 ? 2 : 1;
      return {
        score: med,
        verdict: primary.verdict,
        strengths: majorityList(results, "strengths", minVotes, 6),
        weaknesses: majorityList(results, "weaknesses", minVotes, 6),
        idealAnswer: primary.idealAnswer,
        tips: majorityList(results, "tips", minVotes, 6),
        rubricHits: majorityList(results, "rubricHits", minVotes, 10),
        rubricMisses: majorityList(results, "rubricMisses", minVotes, 10),
      };
    },
    jsonMode: true,
    temperature: 0.2,
  }).then((res) => {
    members = res.members;
    return res;
  });

  const scores = memberScores.length > 0 ? memberScores : [output.score];
  const spread = Math.round((Math.max(...scores) - Math.min(...scores)) * 10) / 10;

  return {
    output,
    meta: {
      models: members.map((m) => m.model),
      scores,
      median: output.score,
      spread,
      agreement,
      consistent: spread <= SPREAD_TOLERANCE,
    },
  };
}
