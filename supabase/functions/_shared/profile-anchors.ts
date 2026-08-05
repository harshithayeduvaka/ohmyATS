// Deterministic anchors for LinkedIn profiles and interview Q&A.
// These run without AI so scores/validations have a measurable, reproducible floor.

import type { ValidatorResult } from "./validators.ts";

// ---------------------------------------------------------------- LinkedIn --

export interface LinkedInAnchors {
  headline: string;
  headlineLength: number;
  about: string;
  aboutLength: number;
  aboutWordCount: number;
  bullets: string[];
  bulletCount: number;
  quantifiedBulletCount: number;
  quantifiedRatio: number;
  weakVerbBullets: string[];
  firstPersonAbout: boolean;
  skillsCount: number;
  hasContactSignal: boolean;
  experienceEntryCount: number;
  /** 0-100 deterministic section scores derived purely from structure. */
  scores: {
    headline: number;
    summary: number;
    experience: number;
    skills: number;
    completeness: number;
  };
}

const LI_HEADLINE_MAX = 220;
const LI_ABOUT_MAX = 2600;

const WEAK_VERBS = [
  "responsible for", "worked on", "helped", "assisted", "involved in",
  "participated in", "tasked with", "duties included", "in charge of",
  "handled", "supported the", "contributed to",
];

const METRIC_RE = /(\d[\d.,]*\s*(%|percent|k\b|m\b|bn\b|million|billion|eur|usd|gbp|€|\$|£)|\b\d{2,}\b|\b\d+\s*(x|hrs?|hours?|days?|weeks?|months?|years?|users?|clients?|customers?|people|projects?)\b)/i;

function normaliseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function sectionBody(lines: string[], headers: string[], stopHeaders: string[]): string {
  const isHeader = (l: string, set: string[]) => {
    const s = l.toLowerCase().replace(/[^a-z ]/g, "").trim();
    return set.some((h) => s === h || s.startsWith(h + " ") || s === h + ":");
  };
  const start = lines.findIndex((l) => isHeader(l, headers));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => isHeader(l, stopHeaders));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

const ALL_HEADERS = [
  "about", "summary", "experience", "work experience", "education", "skills",
  "top skills", "licenses", "certifications", "projects", "languages",
  "recommendations", "accomplishments", "volunteer", "publications", "contact",
];

export function parseLinkedInProfile(text: string): LinkedInAnchors {
  const lines = normaliseLines(text);
  const lower = text.toLowerCase();

  // Headline heuristic: explicit "Headline:" label, else the first non-name line.
  let headline = "";
  const labelled = lines.find((l) => /^headline\s*:/i.test(l));
  if (labelled) {
    headline = labelled.replace(/^headline\s*:/i, "").trim();
  } else {
    const candidate = lines.slice(0, 4).find((l) => l.length > 15 && l.length < 260 && !/^contact$/i.test(l));
    headline = candidate ?? "";
  }

  const about = sectionBody(lines, ["about", "summary"], ALL_HEADERS).trim();
  const experience = sectionBody(lines, ["experience", "work experience"], ALL_HEADERS);
  const skillsBlock = sectionBody(lines, ["skills", "top skills"], ALL_HEADERS);

  const expLines = normaliseLines(experience);
  const bullets = expLines.filter((l) => /^[-•*·▪]|^\d+[.)]\s/.test(l) || (l.length > 40 && /[a-z]/.test(l)));
  const quantified = bullets.filter((b) => METRIC_RE.test(b));
  const weakVerbBullets = bullets.filter((b) => WEAK_VERBS.some((v) => b.toLowerCase().includes(v)));

  const skills = skillsBlock
    .split(/[\n,·|•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60);

  const experienceEntryCount = expLines.filter((l) => /\b(20\d{2}|19\d{2})\b/.test(l) && /(present|—|–|-|to)\b/i.test(l)).length;

  const aboutWordCount = about ? about.split(/\s+/).length : 0;
  const firstPersonAbout = /\b(i|my|i'm|i've)\b/i.test(about);
  const hasContactSignal = /(@|linkedin\.com\/in\/|\+\d{6,})/i.test(lower);

  // ---- deterministic scoring (harsh by design) ----
  let headlineScore = 0;
  if (headline) {
    headlineScore = 30;
    if (headline.length >= 60 && headline.length <= LI_HEADLINE_MAX) headlineScore += 20;
    if (/\||•|—/.test(headline)) headlineScore += 10; // structured, multi-claim headline
    if (METRIC_RE.test(headline)) headlineScore += 10;
    if (headline.split(/\s+/).length >= 6) headlineScore += 10;
    if (!/^(student|seeking|looking for|open to work)\b/i.test(headline)) headlineScore += 10;
  }

  let summaryScore = 0;
  if (about) {
    summaryScore = 25;
    if (aboutWordCount >= 80) summaryScore += 15;
    if (aboutWordCount >= 150 && about.length <= LI_ABOUT_MAX) summaryScore += 10;
    if (firstPersonAbout) summaryScore += 10;
    if (METRIC_RE.test(about)) summaryScore += 15;
    if (about.split(/\n/).length >= 3) summaryScore += 10; // scannable paragraphs
  }

  const quantifiedRatio = bullets.length ? quantified.length / bullets.length : 0;
  let experienceScore = 0;
  if (bullets.length) {
    experienceScore = 20;
    if (bullets.length >= 6) experienceScore += 15;
    experienceScore += Math.round(quantifiedRatio * 40);
    if (weakVerbBullets.length === 0) experienceScore += 15;
    else experienceScore -= Math.min(15, weakVerbBullets.length * 5);
    if (experienceEntryCount >= 2) experienceScore += 10;
  }

  let skillsScore = 0;
  if (skills.length) {
    skillsScore = 25;
    if (skills.length >= 10) skillsScore += 25;
    if (skills.length >= 20) skillsScore += 20;
    if (skills.length <= 50) skillsScore += 10;
  }

  const completenessParts = [!!headline, !!about, bullets.length > 0, skills.length > 0, hasContactSignal, experienceEntryCount > 0];
  const completeness = Math.round((completenessParts.filter(Boolean).length / completenessParts.length) * 100);

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  return {
    headline,
    headlineLength: headline.length,
    about,
    aboutLength: about.length,
    aboutWordCount,
    bullets,
    bulletCount: bullets.length,
    quantifiedBulletCount: quantified.length,
    quantifiedRatio,
    weakVerbBullets,
    firstPersonAbout,
    skillsCount: skills.length,
    hasContactSignal,
    experienceEntryCount,
    scores: {
      headline: clamp(headlineScore),
      summary: clamp(summaryScore),
      experience: clamp(experienceScore),
      skills: clamp(skillsScore),
      completeness,
    },
  };
}

/** Blend AI section scores with the deterministic anchors (default 55% AI / 45% anchor). */
export function blendLinkedInScores(
  aiScores: Record<string, number> | undefined,
  anchors: LinkedInAnchors,
  aiWeight = 0.55
): Record<string, number> {
  const a = aiScores ?? {};
  const blend = (key: keyof LinkedInAnchors["scores"]) => {
    const ai = typeof a[key] === "number" ? a[key] : anchors.scores[key];
    return Math.round(ai * aiWeight + anchors.scores[key] * (1 - aiWeight));
  };
  return {
    headline: blend("headline"),
    summary: blend("summary"),
    experience: blend("experience"),
    skills: blend("skills"),
    keywords: typeof a.keywords === "number" ? a.keywords : 40,
    completeness: blend("completeness"),
  };
}

/** Hard format rules LinkedIn itself enforces + rewrite quality floors. */
export function validateLinkedInSuggestions(
  suggestedHeadline: string | undefined,
  suggestedAbout: string | undefined,
  anchors: LinkedInAnchors
): ValidatorResult {
  const issues: string[] = [];
  const h = (suggestedHeadline ?? "").trim();
  const s = (suggestedAbout ?? "").trim();

  if (!h) issues.push("Suggested headline missing");
  else {
    if (h.length > LI_HEADLINE_MAX) issues.push(`Suggested headline is ${h.length} chars — LinkedIn hard limit is ${LI_HEADLINE_MAX}`);
    if (h.length < 40) issues.push(`Suggested headline is only ${h.length} chars — too thin to rank in search`);
    if (h.trim().toLowerCase() === anchors.headline.trim().toLowerCase()) issues.push("Suggested headline is identical to the current one — must be an improvement");
  }

  if (!s) issues.push("Suggested About section missing");
  else {
    if (s.length > LI_ABOUT_MAX) issues.push(`Suggested About is ${s.length} chars — LinkedIn hard limit is ${LI_ABOUT_MAX}`);
    const words = s.split(/\s+/).length;
    if (words < 90) issues.push(`Suggested About is only ${words} words — needs 90-350 to be credible`);
    if (words > 400) issues.push(`Suggested About is ${words} words — trim to under 400`);
  }

  return issues.length ? { ok: false, issues } : { ok: true };
}

// --------------------------------------------------------- Interview Q&A --

export interface CvEvidence {
  bullets: string[];
  metrics: string[];
  employers: string[];
}

/** Extract quotable, indexable evidence from a CV so answers can be traced to it. */
export function extractCvEvidence(cv: string): CvEvidence {
  const lines = normaliseLines(cv);
  const bullets = lines.filter((l) => /^[-•*·▪]|^\d+[.)]\s/.test(l) || (l.length > 45 && /[a-z]/.test(l)));
  const metrics = Array.from(new Set((cv.match(new RegExp(METRIC_RE, "gi")) ?? []).map((m) => m.trim()))).slice(0, 40);
  const employers = Array.from(
    new Set(
      lines
        .filter((l) => /\b(20\d{2}|19\d{2})\b/.test(l))
        .map((l) => l.split(/[|–—,]/)[0].trim())
        .filter((l) => l.length > 2 && l.length < 60)
    )
  ).slice(0, 20);
  return { bullets, metrics, employers };
}

/**
 * Rubric quality gate: criteria must be concrete and checkable, not vague.
 */
export function validateRubrics(
  questions: { question?: string; rubric?: string[]; suggestedAnswer?: string }[],
  minCriteria = 3
): ValidatorResult {
  const issues: string[] = [];
  const vague = /^(good answer|be clear|answer well|be honest|show enthusiasm|be confident|be specific)\.?$/i;

  questions.forEach((q, i) => {
    const r = q.rubric ?? [];
    if (r.length < minCriteria) {
      issues.push(`Q${i + 1}: only ${r.length} rubric criteria (need ${minCriteria}+)`);
      return;
    }
    const weak = r.filter((c) => typeof c !== "string" || c.trim().split(/\s+/).length < 3 || vague.test(c.trim()));
    if (weak.length) issues.push(`Q${i + 1}: ${weak.length} vague rubric criteria — make each one checkable`);
    const dupes = new Set(r.map((c) => c.toLowerCase().trim())).size !== r.length;
    if (dupes) issues.push(`Q${i + 1}: duplicate rubric criteria`);
  });

  return issues.length ? { ok: false, issues } : { ok: true };
}

/**
 * Numbers used in suggested answers must exist in the CV/JD — catches fabricated metrics
 * that token-level grounding misses.
 */
export function checkNumbersGrounded(output: string, source: string): ValidatorResult {
  const outNums = Array.from(new Set((output.match(/\b\d[\d.,]*%?\b/g) ?? []).map((n) => n.replace(/[.,]$/, ""))));
  if (outNums.length === 0) return { ok: true };
  const srcNorm = source.replace(/[,\s]/g, "");
  const invented = outNums.filter((n) => {
    const bare = n.replace(/[%,]/g, "");
    if (bare.length < 2) return false; // ignore single digits (list counts, "3 points")
    if (/^(19|20)\d{2}$/.test(bare) && source.includes(bare)) return false;
    return !srcNorm.includes(bare);
  });
  if (invented.length === 0) return { ok: true };
  return {
    ok: false,
    issues: [`Fabricated numbers not present in the CV/JD: ${invented.slice(0, 10).join(", ")} — replace with real figures or remove.`],
  };
}

/** Employer/organisation names in the output must appear in the source. */
export function checkEntitiesGrounded(output: string, source: string): ValidatorResult {
  const srcLower = source.toLowerCase();
  const caps = Array.from(
    new Set(
      (output.match(/\b[A-Z][A-Za-z0-9&.'-]+(?:\s+[A-Z][A-Za-z0-9&.'-]+)*\b/g) ?? [])
        .map((m) => m.trim())
        .filter((m) => m.split(/\s+/).length >= 2 && m.length > 6)
    )
  );
  const COMMON = /^(the|this|that|i |my |star|situation|task|action|result|during|when|however|first|second|third|finally|for example)/i;
  const invented = caps.filter((c) => !COMMON.test(c) && !srcLower.includes(c.toLowerCase()));
  if (invented.length === 0) return { ok: true };
  return {
    ok: false,
    issues: [`Named entities not found in the CV/JD: ${invented.slice(0, 8).join(", ")} — remove invented companies/products/people.`],
  };
}
