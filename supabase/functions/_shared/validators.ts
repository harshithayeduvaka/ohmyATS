// Deterministic validators used by the AI pipeline.

export type ValidatorResult = { ok: true } | { ok: false; issues: string[] };

// Words/phrases banned in generative outputs (cover letters, outreach, pitches).
export const BANNED_PHRASES = [
  "passionate", "dynamic", "hardworking", "results-driven", "team player",
  "synergy", "leverage", "spearhead", "go-getter", "thrilled", "honoured",
  "humbled", "i am writing to apply", "i am excited to apply",
  "as a passionate", "i hope this letter finds you well", "please find attached",
  "hit the ground running", "look forward to hearing from you at your earliest",
  "to whom it may concern", "in today's fast-paced world",
  "in today's dynamic", "wear many hats",
];

export function checkBannedPhrases(text: string): ValidatorResult {
  const lower = text.toLowerCase();
  const hits = BANNED_PHRASES.filter((p) => lower.includes(p));
  return hits.length === 0
    ? { ok: true }
    : { ok: false, issues: hits.map((h) => `Banned phrase present: "${h}"`) };
}

// Tokenizer for grounding checks. Keeps alphanumerics + hyphens, drops stopwords.
const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","by","at","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","can","this","that","these","those","i","you","he","she","it","we","they","my","your","his","her","its","our","their","from","up","down","out","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","not","only","own","same","so","than","too","very","s","t","just","don","now","also","into","about","through","during","before","after","above","below","between",
]);

function tokenize(s: string): Set<string> {
  const tokens = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
  return new Set(tokens);
}

/**
 * Grounding: every "content word" in `output` should appear in `source` (CV+JD combined).
 * Allows a small tolerance (default 15% novel tokens for connective language).
 */
export function checkGrounding(
  output: string,
  source: string,
  tolerance = 0.15
): ValidatorResult {
  const outTokens = tokenize(output);
  const srcTokens = tokenize(source);
  if (outTokens.size === 0) return { ok: true };

  const missing: string[] = [];
  for (const t of outTokens) {
    if (!srcTokens.has(t)) missing.push(t);
  }
  const ratio = missing.length / outTokens.size;
  if (ratio <= tolerance) return { ok: true };

  // Report the most notable missing tokens (longer = more likely a real claim/entity).
  const notable = missing
    .filter((t) => t.length >= 5)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);
  return {
    ok: false,
    issues: [
      `Ungrounded content ratio ${(ratio * 100).toFixed(1)}% (limit ${(tolerance * 100).toFixed(0)}%). Likely fabricated claims — remove or replace with CV/JD content: ${notable.join(", ")}`,
    ],
  };
}

export function checkWordCount(
  text: string,
  min: number,
  max: number
): ValidatorResult {
  const count = text.trim().split(/\s+/).length;
  if (count < min) return { ok: false, issues: [`Too short: ${count} words (min ${min})`] };
  if (count > max) return { ok: false, issues: [`Too long: ${count} words (max ${max})`] };
  return { ok: true };
}

export function checkKeywordCoverage(
  text: string,
  requiredKeywords: string[],
  minRatio = 0.6
): ValidatorResult {
  if (requiredKeywords.length === 0) return { ok: true };
  const lower = text.toLowerCase();
  const found = requiredKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const ratio = found.length / requiredKeywords.length;
  if (ratio >= minRatio) return { ok: true };
  const missing = requiredKeywords.filter((k) => !lower.includes(k.toLowerCase()));
  return {
    ok: false,
    issues: [`Keyword coverage ${(ratio * 100).toFixed(0)}% (need ${(minRatio * 100).toFixed(0)}%). Missing: ${missing.slice(0, 10).join(", ")}`],
  };
}

export function checkCompanyMentions(
  text: string,
  companyName: string | undefined,
  minMentions = 2
): ValidatorResult {
  if (!companyName) return { ok: true };
  const re = new RegExp(companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const count = (text.match(re) ?? []).length;
  if (count >= minMentions) return { ok: true };
  return { ok: false, issues: [`Company "${companyName}" mentioned ${count}× (need ≥${minMentions})`] };
}

export function combineValidators(results: ValidatorResult[]): ValidatorResult {
  const issues: string[] = [];
  for (const r of results) if (!r.ok) issues.push(...r.issues);
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
