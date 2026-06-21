// ATS engine profiles. Each profile simulates a specific real-world ATS by
// (a) injecting parser-specific guidance into the AI prompt and
// (b) re-weighting the six sub-scores after the dual-model merge.
//
// Weights MULTIPLY the base score (clamped 0-100). 1.0 = neutral.
// Keep weights in a narrow band (0.75-1.4) so calibration stays honest.

export type AtsId =
  | "generic"
  | "workday"
  | "greenhouse"
  | "ismartrecruit"
  | "icims"
  | "zappyhire"
  | "bamboohr"
  | "jazzhr"
  | "lever"
  | "canvider"
  | "teamtailor"
  | "pinpoint"
  | "ashby"
  | "jarvi"
  | "bullhorn";

export type AtsGroup = "Generic" | "Enterprise" | "Mid-market" | "Specialized" | "Agency / Staffing";

export interface AtsProfile {
  id: AtsId;
  name: string;
  group: AtsGroup;
  short: string; // 1-line UI tooltip
  // Multipliers applied to each sub-score after AI scoring.
  weights: {
    atsCompatibility: number;
    keywordMatch: number;
    recruiterAppeal: number;
    impactClarity: number;
    formatScore: number;
  };
  // Prompt fragment injected as additional ATS-specific simulation rules.
  promptRules: string;
  // Heuristic flags added to botPass.formatIssues when the regex matches.
  // Each rule is { test, flag } — test runs against the raw CV text.
  parserFlags: { test: (cv: string) => boolean; flag: string }[];
}

const PROFILES: Record<AtsId, AtsProfile> = {
  generic: {
    id: "generic",
    name: "Generic / Unknown ATS",
    group: "Generic",
    short: "Strict worst-case parser. Default when company ATS is unknown.",
    weights: { atsCompatibility: 1, keywordMatch: 1, recruiterAppeal: 1, impactClarity: 1, formatScore: 1 },
    promptRules:
      "No specific ATS targeted — apply strict, worst-case parser assumptions and standard recruiter heuristics.",
    parserFlags: [],
  },

  workday: {
    id: "workday",
    name: "Workday Recruiting",
    group: "Enterprise",
    short: "Strict parser. Brutal on tables, columns, headers/footers, non-standard sections.",
    weights: { atsCompatibility: 1.15, keywordMatch: 1.25, recruiterAppeal: 0.95, impactClarity: 1.0, formatScore: 1.35 },
    promptRules: `TARGET ATS = WORKDAY RECRUITING. Apply Workday-specific parser behaviour:
- Workday flattens multi-column layouts and frequently drops the right column entirely.
- Content inside headers/footers is stripped — contact info there is invisible.
- Workday requires STANDARD section headers ("Work Experience", "Education", "Skills"). Non-standard labels ("My Journey", "What I Do") break section categorisation — penalise heavily.
- Workday auto-parses into structured fields (Job Title, Employer, Dates, Location). Mixed/inconsistent date formats break this — flag as critical.
- Workday weighs keyword frequency × recency. Recent roles with required keywords matter most.
- Penalise: graphics, icons, text boxes, special unicode bullets, embedded tables of skills.
- Reward: chronological order, single column, clean ASCII bullets, "Month YYYY – Month YYYY" date format.`,
    parserFlags: [
      { test: (cv) => /\t.{0,40}\t.{0,40}\t/.test(cv) || /\|.{2,40}\|.{2,40}\|/.test(cv), flag: "Workday: multi-column / table layout detected — right column likely dropped by parser." },
      { test: (cv) => /[•◆◇★▪▫■□]/.test(cv), flag: "Workday: non-ASCII bullet glyphs detected — may render as garbage in parsed output." },
      { test: (cv) => !/work experience|professional experience|employment history/i.test(cv), flag: "Workday: missing a standard 'Work Experience' section header — section categorisation will fail." },
    ],
  },

  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse",
    group: "Enterprise",
    short: "Modern parser. Tolerant of formatting. Weighs scorecards & competencies.",
    weights: { atsCompatibility: 1.0, keywordMatch: 1.15, recruiterAppeal: 1.1, impactClarity: 1.15, formatScore: 0.95 },
    promptRules: `TARGET ATS = GREENHOUSE. Apply Greenhouse-specific behaviour:
- Modern parser (Sovren-based) tolerates most formatting. Don't over-penalise mild layout quirks.
- Greenhouse uses scorecard-based competency matching — recruiters tag candidates against specific competencies. Reward CVs whose bullets demonstrate clear competencies tied to JD requirements.
- Weighs recency strongly: skills used in current role count ~1.5x older ones.
- Quantified impact is heavily rewarded by recruiters who use Greenhouse (heavy in tech).
- Penalise: vague responsibility bullets, skill lists without context, gaps without explanation.`,
    parserFlags: [],
  },

  ismartrecruit: {
    id: "ismartrecruit",
    name: "iSmartRecruit",
    group: "Enterprise",
    short: "AI-driven matching. Weighs semantic similarity over exact keywords.",
    weights: { atsCompatibility: 1.0, keywordMatch: 1.05, recruiterAppeal: 1.05, impactClarity: 1.1, formatScore: 1.0 },
    promptRules: `TARGET ATS = iSMARTRECRUIT. Apply iSmartRecruit-specific behaviour:
- AI-driven semantic matching — synonyms and equivalent terms get near-full credit.
- CV-to-JD similarity score is the primary ranking signal.
- Reward CVs that mirror JD vocabulary AND demonstrate semantic depth on each requirement.
- Tolerant of layout; less tolerant of vague claims without evidence.`,
    parserFlags: [],
  },

  icims: {
    id: "icims",
    name: "iCIMS",
    group: "Enterprise",
    short: "Strict structural parser. Breaks on graphics. Heavy keyword frequency weighting.",
    weights: { atsCompatibility: 1.2, keywordMatch: 1.3, recruiterAppeal: 0.95, impactClarity: 0.95, formatScore: 1.3 },
    promptRules: `TARGET ATS = iCIMS. Apply iCIMS-specific behaviour:
- Strict structural parser — breaks on embedded graphics, charts, logos, icons.
- Heavy keyword-frequency weighting. Important keywords must appear 2-3+ times across the CV to rank well.
- Penalise PDFs likely created from image scans (no extractable text).
- Standard section headers (Summary, Experience, Education, Skills) are mandatory.
- Reward: keyword density without stuffing, repeated mention of critical skills across multiple roles.`,
    parserFlags: [
      { test: (cv) => cv.trim().length < 800, flag: "iCIMS: extracted text is suspiciously short — possible image-only PDF that iCIMS cannot parse." },
    ],
  },

  zappyhire: {
    id: "zappyhire",
    name: "Zappyhire",
    group: "Enterprise",
    short: "AI screening + chatbot. Weighs cultural fit signals and explicit qualifications.",
    weights: { atsCompatibility: 1.0, keywordMatch: 1.1, recruiterAppeal: 1.15, impactClarity: 1.05, formatScore: 1.0 },
    promptRules: `TARGET ATS = ZAPPYHIRE. Apply Zappyhire-specific behaviour:
- AI screening looks for explicit qualifications, certifications, and matching titles.
- Cultural-fit signals matter (volunteer work, languages, soft skills demonstrated through evidence).
- Reward: clearly stated certifications, languages with proficiency level, location/remote preferences.`,
    parserFlags: [],
  },

  bamboohr: {
    id: "bamboohr",
    name: "BambooHR",
    group: "Mid-market",
    short: "SMB-friendly. Simple keyword match. Forgiving on format.",
    weights: { atsCompatibility: 0.95, keywordMatch: 1.05, recruiterAppeal: 1.1, impactClarity: 1.0, formatScore: 0.9 },
    promptRules: `TARGET ATS = BAMBOOHR. Apply BambooHR-specific behaviour:
- SMB ATS. Simpler parser — forgiving on layout.
- Basic keyword match; recruiters review most applications manually.
- Reward CVs that are recruiter-friendly (clear structure, scannable, personality OK).`,
    parserFlags: [],
  },

  jazzhr: {
    id: "jazzhr",
    name: "JazzHR",
    group: "Mid-market",
    short: "SMB ATS. Keyword-based. Manual recruiter review dominates.",
    weights: { atsCompatibility: 0.95, keywordMatch: 1.05, recruiterAppeal: 1.1, impactClarity: 1.0, formatScore: 0.9 },
    promptRules: `TARGET ATS = JAZZHR. Similar to BambooHR. Simple keyword filtering; recruiters do most ranking manually. Reward scannability and a clear summary.`,
    parserFlags: [],
  },

  lever: {
    id: "lever",
    name: "Lever",
    group: "Mid-market",
    short: "Recruiter-driven CRM. Weighs LinkedIn URL, clean contact block, referrals.",
    weights: { atsCompatibility: 1.0, keywordMatch: 1.0, recruiterAppeal: 1.2, impactClarity: 1.1, formatScore: 1.0 },
    promptRules: `TARGET ATS = LEVER. Apply Lever-specific behaviour:
- Recruiter-driven CRM. Lever's parser is light — recruiters rank manually.
- Heavy weight on LinkedIn URL presence (Lever auto-enriches from LinkedIn).
- Clean contact block at top is critical.
- Reward: visible LinkedIn URL, portfolio/GitHub for tech roles, clear current title in header.
- Penalise: missing LinkedIn, contact info buried in footer, no clear current title.`,
    parserFlags: [
      { test: (cv) => !/linkedin\.com\/in\//i.test(cv), flag: "Lever: no LinkedIn URL detected — Lever heavily relies on LinkedIn enrichment." },
    ],
  },

  canvider: {
    id: "canvider",
    name: "Canvider",
    group: "Mid-market",
    short: "Skill-graph matching. Rewards explicit, structured skills sections.",
    weights: { atsCompatibility: 1.05, keywordMatch: 1.2, recruiterAppeal: 1.0, impactClarity: 1.0, formatScore: 1.05 },
    promptRules: `TARGET ATS = CANVIDER. Apply skill-graph matching:
- Builds a candidate skill graph from explicit Skills section + extracted bullets.
- Reward: dedicated, well-organised Skills section grouped by category (Languages, Frameworks, Tools).
- Penalise: skills only mentioned inside experience bullets with no dedicated section.`,
    parserFlags: [],
  },

  teamtailor: {
    id: "teamtailor",
    name: "Teamtailor",
    group: "Specialized",
    short: "Modern, employer-brand focused. Tolerant parser. Weighs culture-add signals.",
    weights: { atsCompatibility: 0.95, keywordMatch: 0.95, recruiterAppeal: 1.2, impactClarity: 1.1, formatScore: 0.9 },
    promptRules: `TARGET ATS = TEAMTAILOR. Modern, employer-brand focused. Tolerant of design-forward CVs. Reward personality, narrative, culture-add signals (causes, side projects, languages).`,
    parserFlags: [],
  },

  pinpoint: {
    id: "pinpoint",
    name: "Pinpoint",
    group: "Specialized",
    short: "Structured-data parser. DEI-friendly. Weighs evidence-based competencies.",
    weights: { atsCompatibility: 1.05, keywordMatch: 1.1, recruiterAppeal: 1.1, impactClarity: 1.15, formatScore: 1.0 },
    promptRules: `TARGET ATS = PINPOINT. Structured-data parser with DEI-aware scoring. Reward evidence-based competency demonstration. Discount unsupported buzzwords ("strategic", "innovative") without proof.`,
    parserFlags: [],
  },

  ashby: {
    id: "ashby",
    name: "Ashby",
    group: "Specialized",
    short: "Strong structured parser. Heavily weighs quantified impact + recency.",
    weights: { atsCompatibility: 1.05, keywordMatch: 1.1, recruiterAppeal: 1.15, impactClarity: 1.3, formatScore: 1.05 },
    promptRules: `TARGET ATS = ASHBY. Strong structured-data parser used by high-growth tech companies. Heavily weighs:
- Quantified impact (%, $, #, growth rates) — unquantified bullets are heavily discounted.
- Recency — current and last role carry ~2x weight of older roles.
- Title progression — clear upward trajectory rewarded.
- Tech-stack tags in dedicated Skills/Stack section.
Penalise: vague responsibility-driven bullets, missing metrics, flat trajectory.`,
    parserFlags: [],
  },

  jarvi: {
    id: "jarvi",
    name: "Jarvi",
    group: "Agency / Staffing",
    short: "Agency CRM. Weighs availability, location, exact skill tags.",
    weights: { atsCompatibility: 1.0, keywordMatch: 1.2, recruiterAppeal: 1.05, impactClarity: 0.95, formatScore: 1.0 },
    promptRules: `TARGET ATS = JARVI (agency/staffing). Agency recruiters search by exact skill tags, availability, location, contract type. Reward:
- Explicit availability/notice period.
- Clear location and remote/relocation stance.
- Dense, exact-match skill tags (versions, frameworks, certifications).
Penalise: missing availability, vague location, soft-skill-heavy summaries.`,
    parserFlags: [],
  },

  bullhorn: {
    id: "bullhorn",
    name: "Bullhorn",
    group: "Agency / Staffing",
    short: "Dominant staffing CRM. Boolean-search driven. Loves exact skill tags & cert names.",
    weights: { atsCompatibility: 1.05, keywordMatch: 1.35, recruiterAppeal: 1.0, impactClarity: 0.9, formatScore: 1.05 },
    promptRules: `TARGET ATS = BULLHORN. Dominant staffing-agency CRM. Recruiters use Boolean searches across the entire CV. Apply:
- Reward exact technology names, version numbers, certification acronyms (AWS SAA-C03, PMP, CCNA).
- Reward standard job titles that match common Boolean search terms.
- Penalise creative/non-standard titles ("Code Wizard", "Growth Ninja") — Boolean searches will miss them.
- Penalise missing tech stack section for technical roles.
- Quantification matters less here than searchable keyword density.`,
    parserFlags: [
      { test: (cv) => /\b(ninja|rockstar|guru|wizard|jedi)\b/i.test(cv), flag: "Bullhorn: non-standard title keywords ('ninja', 'rockstar', etc.) will be missed by recruiter Boolean searches." },
    ],
  },
};

export const ATS_PROFILES = PROFILES;

export const ATS_LIST: AtsProfile[] = Object.values(PROFILES);

export const ATS_GROUPED: Record<AtsGroup, AtsProfile[]> = ATS_LIST.reduce((acc, p) => {
  (acc[p.group] ||= []).push(p);
  return acc;
}, {} as Record<AtsGroup, AtsProfile[]>);

export function getAtsProfile(id?: string | null): AtsProfile {
  if (!id) return PROFILES.generic;
  return (PROFILES as Record<string, AtsProfile>)[id] || PROFILES.generic;
}

// Apply per-ATS sub-score weights + clamp 0-100. Returns a new scores object.
export function applyAtsWeights<T extends Record<string, number>>(scores: T, atsId?: string | null): T {
  const profile = getAtsProfile(atsId);
  const w = profile.weights;
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const next = { ...scores } as any;
  next.atsCompatibility = clamp((scores.atsCompatibility ?? 0) * w.atsCompatibility);
  next.keywordMatch = clamp((scores.keywordMatch ?? 0) * w.keywordMatch);
  next.recruiterAppeal = clamp((scores.recruiterAppeal ?? 0) * w.recruiterAppeal);
  next.impactClarity = clamp((scores.impactClarity ?? 0) * w.impactClarity);
  next.formatScore = clamp((scores.formatScore ?? 0) * w.formatScore);
  // Overall = weighted mean of sub-scores (matches user-perceived dashboard).
  next.overall = clamp(
    (next.atsCompatibility + next.keywordMatch + next.recruiterAppeal + next.impactClarity + next.formatScore) / 5
  );
  return next as T;
}

// Run the parser-flag heuristics for an ATS profile against raw CV text.
export function runAtsParserFlags(cv: string, atsId?: string | null): string[] {
  const profile = getAtsProfile(atsId);
  if (!cv || !profile.parserFlags.length) return [];
  return profile.parserFlags.filter((r) => r.test(cv)).map((r) => r.flag);
}
