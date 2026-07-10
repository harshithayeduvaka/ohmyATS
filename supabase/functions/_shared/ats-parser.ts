// Deterministic CV structure parser. Feeds the ATS scorer with facts
// that don't depend on an AI call — so scoring is grounded in reality.

export interface ParsedCV {
  wordCount: number;
  sections: {
    hasContact: boolean;
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    detected: string[]; // section headers found
  };
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    hasAddress: boolean;
  };
  dates: {
    count: number;
    hasCurrentRole: boolean; // "Present" / "Current" / current-year end date
    yearsSpan: number;       // earliest to latest year
    gaps: number;            // gaps > 6 months between roles (approximate)
  };
  formatting: {
    bulletPoints: number;
    quantifiedBullets: number; // bullets with a %, €, $, or number
    quantifiedRatio: number;   // 0..1
    avgBulletLength: number;
    longSentences: number;     // sentences > 30 words (ATS-hostile)
    allCapsLines: number;
    hasTables: boolean;        // detected via | or tab-separated columns
  };
  keywords: {
    actionVerbs: number;
    actionVerbRatio: number; // action verbs per bullet
  };
  atsHostileFlags: string[]; // human-readable list of things ATS parsers dislike
}

const SECTION_HEADERS = [
  { key: "hasContact", patterns: [/^contact/i, /^personal.*details/i, /^coordonn/i] },
  { key: "hasSummary", patterns: [/^summary/i, /^profile/i, /^about/i, /^objective/i, /^r[eé]sum[eé]/i, /^profil/i] },
  { key: "hasExperience", patterns: [/^experience/i, /^work.*history/i, /^employment/i, /^professional/i, /^exp[eé]rience/i] },
  { key: "hasEducation", patterns: [/^education/i, /^academic/i, /^qualifications/i, /^formation/i, /^dipl[oô]me/i] },
  { key: "hasSkills", patterns: [/^skills/i, /^competencies/i, /^technical/i, /^comp[eé]tence/i] },
];

const ACTION_VERBS = new Set([
  "led","built","designed","launched","delivered","managed","increased","reduced",
  "optimised","optimized","architected","developed","implemented","shipped","scaled",
  "founded","created","drove","owned","negotiated","closed","won","grew","cut",
  "automated","migrated","refactored","mentored","hired","facilitated","orchestrated",
  "spearheaded","pioneered","transformed","accelerated","streamlined","boosted",
  "generated","secured","achieved","exceeded","surpassed","initiated","established",
]);

export function parseCV(text: string): ParsedCV {
  const lines = text.split(/\r?\n/);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Sections
  const detected: string[] = [];
  const sectionFlags: Record<string, boolean> = {
    hasContact: false, hasSummary: false, hasExperience: false, hasEducation: false, hasSkills: false,
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 60) continue;
    for (const s of SECTION_HEADERS) {
      if (s.patterns.some((p) => p.test(trimmed))) {
        sectionFlags[s.key] = true;
        detected.push(trimmed);
      }
    }
  }

  // Contact
  const email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] ?? null;
  const phone = text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0] ?? null;
  const linkedin = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)[A-Za-z0-9\-_%]+/i)?.[0] ?? null;
  const hasAddress = /\b\d{4,5}\b.*(?:street|road|avenue|rue|boulevard|paris|london|new york|remote)/i.test(text)
    || /\b(paris|london|berlin|madrid|amsterdam|new york|san francisco|remote)\b/i.test(text);
  if (email || phone || linkedin) sectionFlags.hasContact = true;

  // Dates
  const dateMatches = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  const years = dateMatches.map(Number);
  const currentYear = new Date().getFullYear();
  const hasCurrentRole = /\b(present|current|today|actuel|aujourd'hui|en cours)\b/i.test(text)
    || years.includes(currentYear);
  const yearsSpan = years.length > 0 ? Math.max(...years) - Math.min(...years) : 0;

  // Formatting
  const bulletLines = lines.filter((l) => /^\s*[•●○▪▫\-*]\s+\S/.test(l) || /^\s*\d+[.)]\s+\S/.test(l));
  const bulletPoints = bulletLines.length;
  const quantifiedBullets = bulletLines.filter((l) => /(\d+\s*%|\d+[.,]?\d*\s*(?:k|m|b|€|\$|£|eur|usd|gbp)|\b\d{2,}\b)/i.test(l)).length;
  const quantifiedRatio = bulletPoints > 0 ? quantifiedBullets / bulletPoints : 0;
  const avgBulletLength = bulletPoints > 0
    ? bulletLines.reduce((sum, l) => sum + l.split(/\s+/).length, 0) / bulletPoints
    : 0;

  const sentences = text.split(/[.!?]+\s/);
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 30).length;
  const allCapsLines = lines.filter((l) => {
    const t = l.trim();
    return t.length >= 8 && t.length <= 80 && t === t.toUpperCase() && /[A-Z]/.test(t) && !/^[^A-Za-z]+$/.test(t);
  }).length;
  const hasTables = lines.some((l) => (l.match(/\|/g) ?? []).length >= 2) || lines.some((l) => /\t.*\t/.test(l));

  // Action verbs
  const words = text.toLowerCase().split(/[^\p{L}]+/u);
  const actionVerbCount = words.filter((w) => ACTION_VERBS.has(w)).length;
  const actionVerbRatio = bulletPoints > 0 ? actionVerbCount / bulletPoints : 0;

  // ATS-hostile flags
  const atsHostileFlags: string[] = [];
  if (!email) atsHostileFlags.push("No email detected");
  if (!phone) atsHostileFlags.push("No phone detected");
  if (!sectionFlags.hasExperience) atsHostileFlags.push("No 'Experience' section header found");
  if (!sectionFlags.hasEducation) atsHostileFlags.push("No 'Education' section header found");
  if (hasTables) atsHostileFlags.push("Tables/columns detected — many ATS parsers mis-order these");
  if (quantifiedRatio < 0.3 && bulletPoints > 5) atsHostileFlags.push(`Only ${(quantifiedRatio * 100).toFixed(0)}% of bullets contain metrics`);
  if (avgBulletLength > 30) atsHostileFlags.push(`Bullets average ${avgBulletLength.toFixed(0)} words — trim to ≤20`);
  if (allCapsLines > 3) atsHostileFlags.push(`${allCapsLines} ALL-CAPS lines — reduce for parseability`);
  if (wordCount < 300) atsHostileFlags.push(`Very short CV (${wordCount} words) — likely under-detailed`);
  if (wordCount > 1200) atsHostileFlags.push(`Very long CV (${wordCount} words) — trim to ≤900 for 1-page ATS`);
  if (longSentences > 3) atsHostileFlags.push(`${longSentences} sentences > 30 words — break them up`);

  return {
    wordCount,
    sections: { ...sectionFlags, detected } as ParsedCV["sections"],
    contact: { email, phone, linkedin, hasAddress },
    dates: { count: dateMatches.length, hasCurrentRole, yearsSpan, gaps: 0 },
    formatting: {
      bulletPoints, quantifiedBullets, quantifiedRatio,
      avgBulletLength, longSentences, allCapsLines, hasTables,
    },
    keywords: { actionVerbs: actionVerbCount, actionVerbRatio },
    atsHostileFlags,
  };
}

/**
 * Deterministic ATS base score derived purely from parsed CV structure.
 * Range 0–100. This anchors the AI ensemble so the final score can't drift wildly.
 */
export function deterministicAtsScore(parsed: ParsedCV): { score: number; breakdown: Record<string, number> } {
  const b: Record<string, number> = {};
  // 25 pts: contact + section completeness
  let contactPts = 0;
  if (parsed.contact.email) contactPts += 4;
  if (parsed.contact.phone) contactPts += 3;
  if (parsed.contact.linkedin) contactPts += 3;
  if (parsed.sections.hasSummary) contactPts += 3;
  if (parsed.sections.hasExperience) contactPts += 6;
  if (parsed.sections.hasEducation) contactPts += 3;
  if (parsed.sections.hasSkills) contactPts += 3;
  b.structure = contactPts;

  // 25 pts: formatting parseability
  let fmt = 25;
  if (parsed.formatting.hasTables) fmt -= 8;
  if (parsed.formatting.allCapsLines > 3) fmt -= 3;
  if (parsed.formatting.avgBulletLength > 30) fmt -= 4;
  if (parsed.formatting.longSentences > 3) fmt -= 3;
  if (parsed.wordCount < 250 || parsed.wordCount > 1300) fmt -= 5;
  b.formatting = Math.max(0, fmt);

  // 25 pts: impact (quantified bullets + action verbs)
  const impactRaw = parsed.formatting.quantifiedRatio * 15 + Math.min(parsed.keywords.actionVerbRatio, 1) * 10;
  b.impact = Math.round(Math.min(25, impactRaw));

  // 25 pts: content density
  let density = 0;
  if (parsed.formatting.bulletPoints >= 8) density += 10;
  else density += Math.round((parsed.formatting.bulletPoints / 8) * 10);
  if (parsed.dates.count >= 4) density += 8;
  else density += Math.round((parsed.dates.count / 4) * 8);
  if (parsed.dates.hasCurrentRole) density += 4;
  if (parsed.dates.yearsSpan >= 2) density += 3;
  b.density = Math.min(25, density);

  const score = Math.round(b.structure + b.formatting + b.impact + b.density);
  return { score: Math.min(100, Math.max(0, score)), breakdown: b };
}
