import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── ATS profile registry (kept in sync with src/lib/atsProfiles.ts) ────
type AtsWeights = { atsCompatibility: number; keywordMatch: number; recruiterAppeal: number; impactClarity: number; formatScore: number };
type AtsProfile = { id: string; name: string; weights: AtsWeights; rules: string; flags: { test: (cv: string) => boolean; flag: string }[] };

const ATS_PROFILES: Record<string, AtsProfile> = {
  generic: { id: "generic", name: "Generic / Unknown ATS", weights: { atsCompatibility: 1, keywordMatch: 1, recruiterAppeal: 1, impactClarity: 1, formatScore: 1 }, rules: "No specific ATS targeted — apply strict worst-case parser assumptions.", flags: [] },
  workday: { id: "workday", name: "Workday Recruiting", weights: { atsCompatibility: 1.15, keywordMatch: 1.25, recruiterAppeal: 0.95, impactClarity: 1.0, formatScore: 1.35 }, rules: "TARGET ATS = WORKDAY. Flattens multi-column layouts; drops right column. Strips header/footer content. Requires standard section headers ('Work Experience','Education','Skills'). Penalises non-standard sections, graphics, icons, mixed date formats. Rewards chronological single-column layouts, 'Month YYYY – Month YYYY' dates, recent keyword frequency.", flags: [
    { test: (cv) => /\t.{0,40}\t.{0,40}\t/.test(cv) || /\|.{2,40}\|.{2,40}\|/.test(cv), flag: "Workday: multi-column / table layout detected — right column likely dropped." },
    { test: (cv) => /[•◆◇★▪▫■□]/.test(cv), flag: "Workday: non-ASCII bullet glyphs detected — may render as garbage." },
    { test: (cv) => !/work experience|professional experience|employment history/i.test(cv), flag: "Workday: missing standard 'Work Experience' section header — section categorisation will fail." },
  ] },
  taleo: { id: "taleo", name: "Taleo (Oracle)", weights: { atsCompatibility: 1.15, keywordMatch: 1.35, recruiterAppeal: 0.9, impactClarity: 0.95, formatScore: 1.25 }, rules: "TARGET ATS = TALEO (Oracle). Legacy enterprise parser (Fortune 500, gov, banking). Keyword density matters enormously — exact phrase matches, weak on synonyms. Sections MUST use canonical uppercase headers (EXPERIENCE, EDUCATION, SKILLS). Boolean keyword logic: missing required skill = HARD filter. Date gaps >6mo flag as risk. Penalise graphics/tables/columns/headers/footers. Reward literal JD term repetition and exact job-title mirroring.", flags: [
    { test: (cv) => /\t.{0,40}\t.{0,40}\t/.test(cv) || /\|.{2,40}\|.{2,40}\|/.test(cv), flag: "Taleo: multi-column / table layout detected — likely flattened or dropped." },
    { test: (cv) => !/experience|employment/i.test(cv) || !/education/i.test(cv) || !/skills/i.test(cv), flag: "Taleo: missing one of canonical section headers (EXPERIENCE / EDUCATION / SKILLS)." },
  ] },
  successfactors: { id: "successfactors", name: "SAP SuccessFactors", weights: { atsCompatibility: 1.1, keywordMatch: 1.2, recruiterAppeal: 1.0, impactClarity: 1.0, formatScore: 1.2 }, rules: "TARGET ATS = SAP SUCCESSFACTORS. Structured-data parser. Parses dates, job-title hierarchies. Skills ontology matching — standardised skill names beat creative phrasing. Penalises unconventional section names; rewards canonical headers (Professional Experience, Education, Technical Skills, Languages, Certifications). Heavy in European enterprises — language proficiency levels (B2/C1) and EU work-auth signals are noticed. Reward clean date ranges and explicit title progression.", flags: [] },
  greenhouse: { id: "greenhouse", name: "Greenhouse", weights: { atsCompatibility: 1.0, keywordMatch: 1.15, recruiterAppeal: 1.1, impactClarity: 1.15, formatScore: 0.95 }, rules: "TARGET ATS = GREENHOUSE. Modern Sovren-based parser, tolerant of layout. Scorecard-based competency matching — reward CVs whose bullets prove competencies. Recency weight ~1.5x. Quantified impact heavily rewarded.", flags: [] },
  ismartrecruit: { id: "ismartrecruit", name: "iSmartRecruit", weights: { atsCompatibility: 1.0, keywordMatch: 1.05, recruiterAppeal: 1.05, impactClarity: 1.1, formatScore: 1.0 }, rules: "TARGET ATS = iSMARTRECRUIT. AI-driven semantic matching — synonyms get near-full credit. Tolerant of layout. Reward mirroring JD vocabulary with semantic depth.", flags: [] },
  icims: { id: "icims", name: "iCIMS", weights: { atsCompatibility: 1.2, keywordMatch: 1.3, recruiterAppeal: 0.95, impactClarity: 0.95, formatScore: 1.3 }, rules: "TARGET ATS = iCIMS. Strict structural parser, breaks on graphics. Heavy keyword-frequency weighting — important keywords must repeat 2-3x. Mandatory standard section headers.", flags: [
    { test: (cv) => cv.trim().length < 800, flag: "iCIMS: extracted text suspiciously short — possible image-only PDF iCIMS cannot parse." },
  ] },
  zappyhire: { id: "zappyhire", name: "Zappyhire", weights: { atsCompatibility: 1.0, keywordMatch: 1.1, recruiterAppeal: 1.15, impactClarity: 1.05, formatScore: 1.0 }, rules: "TARGET ATS = ZAPPYHIRE. AI screening + chatbot. Rewards explicit certifications, language proficiency, location stance, cultural-fit signals.", flags: [] },
  bamboohr: { id: "bamboohr", name: "BambooHR", weights: { atsCompatibility: 0.95, keywordMatch: 1.05, recruiterAppeal: 1.1, impactClarity: 1.0, formatScore: 0.9 }, rules: "TARGET ATS = BAMBOOHR. SMB ATS, simple parser, forgiving on layout. Recruiters review manually — reward scannability.", flags: [] },
  jazzhr: { id: "jazzhr", name: "JazzHR", weights: { atsCompatibility: 0.95, keywordMatch: 1.05, recruiterAppeal: 1.1, impactClarity: 1.0, formatScore: 0.9 }, rules: "TARGET ATS = JAZZHR. SMB ATS, basic keyword filtering, recruiter-driven ranking.", flags: [] },
  lever: { id: "lever", name: "Lever", weights: { atsCompatibility: 1.0, keywordMatch: 1.0, recruiterAppeal: 1.2, impactClarity: 1.1, formatScore: 1.0 }, rules: "TARGET ATS = LEVER. Recruiter-driven CRM, light parser. Heavy weight on LinkedIn URL presence (auto-enrichment), clean contact block at top, clear current title.", flags: [
    { test: (cv) => !/linkedin\.com\/in\//i.test(cv), flag: "Lever: no LinkedIn URL detected — Lever relies on LinkedIn enrichment." },
  ] },
  canvider: { id: "canvider", name: "Canvider", weights: { atsCompatibility: 1.05, keywordMatch: 1.2, recruiterAppeal: 1.0, impactClarity: 1.0, formatScore: 1.05 }, rules: "TARGET ATS = CANVIDER. Skill-graph matching. Rewards dedicated Skills section grouped by category; penalises skills only buried inside bullets.", flags: [] },
  teamtailor: { id: "teamtailor", name: "Teamtailor", weights: { atsCompatibility: 0.95, keywordMatch: 0.95, recruiterAppeal: 1.2, impactClarity: 1.1, formatScore: 0.9 }, rules: "TARGET ATS = TEAMTAILOR. Modern, employer-brand focused, tolerant. Rewards personality, narrative, culture-add signals.", flags: [] },
  pinpoint: { id: "pinpoint", name: "Pinpoint", weights: { atsCompatibility: 1.05, keywordMatch: 1.1, recruiterAppeal: 1.1, impactClarity: 1.15, formatScore: 1.0 }, rules: "TARGET ATS = PINPOINT. Structured-data parser, DEI-aware. Rewards evidence-based competencies; discounts unsupported buzzwords.", flags: [] },
  ashby: { id: "ashby", name: "Ashby", weights: { atsCompatibility: 1.05, keywordMatch: 1.1, recruiterAppeal: 1.15, impactClarity: 1.3, formatScore: 1.05 }, rules: "TARGET ATS = ASHBY. Strong structured parser used by high-growth tech. Heavily weighs quantified impact (%,$,#,growth), recency (~2x for current role), title progression, dedicated tech-stack section. Heavily discount vague responsibility bullets.", flags: [] },
  jarvi: { id: "jarvi", name: "Jarvi", weights: { atsCompatibility: 1.0, keywordMatch: 1.2, recruiterAppeal: 1.05, impactClarity: 0.95, formatScore: 1.0 }, rules: "TARGET ATS = JARVI (staffing). Agency recruiters search by skill tags, availability, location, contract type. Reward explicit availability, location stance, dense exact-match skill tags.", flags: [] },
  bullhorn: { id: "bullhorn", name: "Bullhorn", weights: { atsCompatibility: 1.05, keywordMatch: 1.35, recruiterAppeal: 1.0, impactClarity: 0.9, formatScore: 1.05 }, rules: "TARGET ATS = BULLHORN. Dominant staffing CRM, Boolean-search driven. Reward exact tech names, version numbers, cert acronyms, standard job titles. Penalise creative/non-standard titles (ninja, rockstar) that miss Boolean searches.", flags: [
    { test: (cv) => /\b(ninja|rockstar|guru|wizard|jedi)\b/i.test(cv), flag: "Bullhorn: non-standard title keywords ('ninja','rockstar',etc.) will be missed by Boolean searches." },
  ] },
};

function getAtsProfile(id?: string | null): AtsProfile {
  if (!id) return ATS_PROFILES.generic;
  return ATS_PROFILES[id] || ATS_PROFILES.generic;
}

function applyAtsWeights(scores: Record<string, number>, atsId?: string | null): Record<string, number> {
  const p = getAtsProfile(atsId);
  const w = p.weights;
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const next: Record<string, number> = { ...scores };
  next.atsCompatibility = clamp((scores.atsCompatibility ?? 0) * w.atsCompatibility);
  next.keywordMatch = clamp((scores.keywordMatch ?? 0) * w.keywordMatch);
  next.recruiterAppeal = clamp((scores.recruiterAppeal ?? 0) * w.recruiterAppeal);
  next.impactClarity = clamp((scores.impactClarity ?? 0) * w.impactClarity);
  next.formatScore = clamp((scores.formatScore ?? 0) * w.formatScore);
  // Transparent weighted overall: keyword 35% / atsCompat 20% / recruiter 20% / impact 15% / format 10%.
  next.overall = clamp(
    next.keywordMatch * 0.35 +
    next.atsCompatibility * 0.20 +
    next.recruiterAppeal * 0.20 +
    next.impactClarity * 0.15 +
    next.formatScore * 0.10
  );
  return next;
}

function runAtsParserFlags(cv: string, atsId?: string | null): string[] {
  const p = getAtsProfile(atsId);
  if (!cv || !p.flags.length) return [];
  return p.flags.filter((r) => r.test(cv)).map((r) => r.flag);
}

// ─── Deterministic keyword extraction & literal matching ──────────────
const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","for","on","at","by","with","from","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","should","could","may","might","must","can","this","that","these","those","you","your","we","our","us","they","their","them","it","its","i","me","my","he","she","his","her","what","which","who","whom","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","also","than","then","there","here","up","down","out","off","over","under","again","further","once","about","into","through","during","before","after","above","below","between","new","one","two","three","four","five","six","seven","eight","nine","ten","including","via","etc","eg","ie","per","across","within","while","upon","without","using","use","used","help","work","team","role","job","position","company","candidate","applicant","experience","experiences","years","year","skills","skill","ability","abilities","able","strong","good","great","excellent","preferred","required","must","should","plus","bonus","ideal","ideally","minimum","maximum","least","up","least","level","levels","based","aware","awareness","knowledge","familiar","familiarity","understanding","proficient","proficiency","working","ensure","ensuring","support","supporting","provide","providing","develop","developing","build","building","create","creating","manage","managing","drive","driving","lead","leading","own","owning","collaborate","collaborating","communicate","communication","communications","environment","environments","please","apply","application","applications","opportunity","opportunities","looking","seeking","join","joining","across","along","amongst","whilst","whether","include","includes","included","high","highly","quickly","fast","ability","including","etc","plus","also","along","every","everything","anything","something","nothing","etc","etc.",
]);

// Common synonym groups (used to count near-misses as hits for literal scoring fairness).
const SYNONYM_GROUPS: string[][] = [
  ["javascript","js","typescript","ts"],
  ["postgres","postgresql","psql"],
  ["k8s","kubernetes"],
  ["ml","machine-learning","machinelearning"],
  ["ai","artificial-intelligence"],
  ["ci","cicd","ci/cd"],
  ["aws","amazon-web-services"],
  ["gcp","google-cloud"],
  ["pm","project-management","program-management"],
  ["api","apis","rest","restful"],
  ["db","database","databases"],
  ["sql","mysql","mariadb"],
  ["frontend","front-end"],
  ["backend","back-end"],
  ["devops","dev-ops"],
  ["b2b","business-to-business"],
  ["b2c","business-to-consumer"],
  ["seo","search-engine-optimization","search-engine-optimisation"],
  ["sem","search-engine-marketing"],
  ["kpi","kpis"],
  ["roi","return-on-investment"],
  ["saas","s-a-a-s"],
  ["llm","llms","large-language-model","large-language-models"],
  ["nlp","natural-language-processing"],
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s\-+#./]/g, " ").replace(/\s+/g, " ").trim();
}

function stem(w: string): string {
  // Very light suffix stripping — keeps acronyms intact.
  if (w.length < 4) return w;
  return w
    .replace(/(ies|ied)$/i, "y")
    .replace(/(ses|sed|ses)$/i, "se")
    .replace(/(ing|ers|ements|ments|ions|ation|ations|able|ible)$/i, "")
    .replace(/(ed|es|s)$/i, "");
}

function extractJdKeywords(jd: string): string[] {
  if (!jd) return [];
  const text = normalize(jd);
  const tokens = text.split(/\s+/);
  // Single-word candidates
  const wordFreq = new Map<string, number>();
  for (const tok of tokens) {
    const t = tok.replace(/^[-+.#/]+|[-+.#/]+$/g, "");
    if (!t || t.length < 2) continue;
    if (STOPWORDS.has(t)) continue;
    if (/^\d+$/.test(t)) continue;
    wordFreq.set(t, (wordFreq.get(t) ?? 0) + 1);
  }
  // 2-gram candidates (proper noun-ish: capitalised in original, or repeated)
  const lowerJd = jd.toLowerCase();
  const bigramFreq = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i].replace(/^[-+.#/]+|[-+.#/]+$/g, "");
    const b = tokens[i + 1].replace(/^[-+.#/]+|[-+.#/]+$/g, "");
    if (!a || !b) continue;
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
    if (a.length < 3 && b.length < 3) continue;
    const bigram = `${a} ${b}`;
    bigramFreq.set(bigram, (bigramFreq.get(bigram) ?? 0) + 1);
  }

  // Score candidates: freq + length bonus + bigram bonus
  const scored: { kw: string; score: number }[] = [];
  for (const [w, f] of wordFreq) {
    if (f < 1) continue;
    const lengthBonus = w.length >= 5 ? 1 : 0;
    scored.push({ kw: w, score: f * 2 + lengthBonus });
  }
  for (const [b, f] of bigramFreq) {
    if (f < 1) continue;
    scored.push({ kw: b, score: f * 3 + 1 }); // bigrams weighted higher
  }
  // Sort, dedupe (prefer bigram over its component words if both present), cap at 25.
  scored.sort((a, b) => b.score - a.score);
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const { kw } of scored) {
    if (seen.has(kw)) continue;
    if (picked.length >= 25) break;
    picked.push(kw);
    seen.add(kw);
  }
  // Add explicit ALL-CAPS acronyms (3-6 chars) from the original JD — these matter for ATS.
  const acronyms = jd.match(/\b[A-Z][A-Z0-9+#./]{1,6}\b/g) || [];
  for (const a of acronyms) {
    const low = a.toLowerCase();
    if (STOPWORDS.has(low)) continue;
    if (!picked.includes(low)) picked.unshift(low);
  }
  return picked.slice(0, 30);
}

function literalKeywordMatch(cv: string, keywords: string[]): { score: number; hits: string[]; misses: string[] } {
  if (!cv || !keywords.length) return { score: 0, hits: [], misses: keywords };
  const cvLower = " " + normalize(cv) + " ";
  const cvStems = new Set(cvLower.split(/\s+/).map(stem));
  const hits: string[] = [];
  const misses: string[] = [];
  for (const kw of keywords) {
    const k = kw.toLowerCase().trim();
    if (!k) continue;
    let found = false;
    // 1. Exact substring (word-boundaryish for single tokens)
    if (k.includes(" ")) {
      if (cvLower.includes(" " + k + " ") || cvLower.includes(" " + k + ".") || cvLower.includes(" " + k + ",")) {
        found = true;
      }
    } else {
      const re = new RegExp(`(^|[^\\w])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\w]|$)`, "i");
      if (re.test(cvLower)) found = true;
      // 2. Stem match
      if (!found && cvStems.has(stem(k))) found = true;
    }
    // 3. Synonym group
    if (!found) {
      for (const group of SYNONYM_GROUPS) {
        if (group.includes(k) && group.some((g) => cvLower.includes(" " + g + " "))) {
          found = true;
          break;
        }
      }
    }
    if (found) hits.push(kw);
    else misses.push(kw);
  }
  const score = Math.round((hits.length / keywords.length) * 100);
  return { score, hits, misses };
}

// ─── Document health: detect parsing red flags before scoring ────────
function documentHealth(cv: string): { charCount: number; textDensityPerPage: number; warnings: string[] } {
  const charCount = cv.length;
  const approxPages = Math.max(1, Math.round(charCount / 2200)); // ~2200 chars per A4 page of typical CV
  const textDensityPerPage = Math.round(charCount / approxPages);
  const warnings: string[] = [];

  if (charCount < 600) warnings.push("Extracted text is very short (<600 chars) — your PDF may be image-only or password-protected; most ATSes will reject it.");
  if (charCount < 1500 && charCount >= 600) warnings.push("Extracted text is unusually thin — check that headings, contact block, and bullets all extract cleanly.");

  // Encoding artefacts / mojibake
  if (/[ÂÃ]\s|â€™|â€“|â€œ|â€\u009d|ï¼/.test(cv)) {
    warnings.push("Encoding artefacts detected (mojibake like 'â€™', 'Â') — clean copy-paste source before re-uploading.");
  }
  // Multi-column / table heuristic
  if (/\t.{0,40}\t.{0,40}\t/.test(cv) || /\|.{2,40}\|.{2,40}\|/.test(cv)) {
    warnings.push("Multi-column or table layout detected — strict ATSes (Workday, Taleo, iCIMS) often drop one column entirely.");
  }
  // Excessive whitespace / broken line-wrap
  const lines = cv.split("\n");
  const shortLines = lines.filter((l) => l.trim().length > 0 && l.trim().length < 25).length;
  if (lines.length > 30 && shortLines / lines.length > 0.55) {
    warnings.push("PDF appears to wrap heavily into short fragments — text extraction is splitting bullets across lines and ATSes may misread them.");
  }
  // Missing contact basics
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(cv);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(cv);
  if (!hasEmail) warnings.push("No email address detected — the contact block may have been parsed from a header/footer and stripped.");
  if (!hasPhone) warnings.push("No phone number detected — verify contact info isn't inside an image, header, or footer.");

  return { charCount, textDensityPerPage, warnings };
}

// ─── Optimised-CV rescan: prove the rewrite actually scores higher ───
const RESCAN_PROMPT = `You are an ATS scoring engine. Given a CV (possibly a rewritten/optimised version) and a target JD, return ONLY this JSON:
{"scores":{"overall":0-100,"atsCompatibility":0-100,"keywordMatch":0-100,"recruiterAppeal":0-100,"impactClarity":0-100,"formatScore":0-100}}
Apply the SAME brutally honest calibration as a senior recruiter: 30-55 median, 70+ is strong, 85+ is rare. No markdown, no explanation, JSON only.`;

async function rescanOptimizedCv(
  optimizedCv: string,
  jd: string,
  apiKey: string,
  signal: AbortSignal
): Promise<{ overall: number; atsCompatibility: number; keywordMatch: number; recruiterAppeal: number; impactClarity: number; formatScore: number } | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: RESCAN_PROMPT },
          { role: "user", content: jd ? `OPTIMISED CV:\n${optimizedCv}\n\nJD:\n${jd}` : `OPTIMISED CV:\n${optimizedCv}\n\nNo JD provided — score standalone ATS quality.` },
        ],
        temperature: 0.1,
      }),
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const parsed = JSON.parse((m ? m[1] : content).trim());
    return parsed.scores ?? null;
  } catch (e) {
    console.error("rescanOptimizedCv failed:", e);
    return null;
  }
}


const SYSTEM_PROMPT = `You are a production-grade ATS simulation engine that replicates EXACTLY how enterprise Applicant Tracking Systems (Workday, Greenhouse, Bullhorn, Taleo, iCIMS, Lever, SmartRecruiters) parse, rank, and filter resumes — combined with a brutally honest senior recruiter with 15+ years of experience across multiple industries.

IMPORTANT: You must be ROLE-AGNOSTIC. Adapt your analysis to whatever field the CV targets (engineering, marketing, data science, finance, design, healthcare, etc.). Do NOT assume any specific industry.

═══════════════════════════════════════════
PHASE 1: ATS PARSING SIMULATION
═══════════════════════════════════════════
Parse the CV exactly as an ATS would:
- Extract structured fields: Name, Contact, Location, Current/Target Title, Years of Experience, Education, Certifications
- Detect format issues that ACTUALLY break real ATS parsers:
  • Tables, columns, text boxes (many ATS flatten these incorrectly)
  • Headers/footers (often stripped entirely)
  • Graphics, images, icons, charts (invisible to ATS)
  • Non-standard fonts or special Unicode characters
  • Inconsistent date formats
  • Missing standard section headers (ATS uses headers to categorize content)
- Flag ONLY real issues. Clean, single-column CVs with standard headers should get high format scores (85-95).
- A well-structured CV with clear sections, consistent formatting, and no parsing traps should score 90+ on format.

═══════════════════════════════════════════
PHASE 2: KEYWORD & SEMANTIC MATCHING
═══════════════════════════════════════════
When a JD is provided:
1. Extract ALL requirements from the JD: hard skills, soft skills, tools, methodologies, certifications, experience levels, industry terms.
2. Match using THREE layers:
   - EXACT match: identical term appears in CV (highest weight)
   - SEMANTIC match: equivalent meaning (e.g., "managed budgets" ≈ "budget management", "P&L" ≈ "profit and loss", "ML pipelines" ≈ "machine learning workflows") — give 70-80% credit
   - TRANSFERABLE match: related competency that demonstrates capability (e.g., "TensorFlow" when JD says "PyTorch" — both are DL frameworks) — give 40-50% credit
3. Weight JD requirements by signal strength:
   - "Required"/"Must have" → critical importance
   - "Preferred"/"Nice to have" → high importance
   - Listed once in passing → medium importance
   - Implied but not stated → low importance

Without a JD: evaluate standalone keyword strength, industry-standard terminology, and general ATS-friendliness for the candidate's target role (inferred from their CV content).

═══════════════════════════════════════════
PHASE 3: SCORING CALIBRATION (CRITICAL)
═══════════════════════════════════════════
Score distribution must reflect REAL ATS behavior:
- 85-100: Exceptional match — near-perfect keyword alignment, quantified achievements throughout, clean format, strong role fit. RARE.
- 70-84: Strong candidate — most requirements met, good quantification, minor gaps. Top 15-20%.
- 50-69: Average — some keyword matches, some gaps, needs optimization.
- 30-49: Below average — significant gaps, weak quantification, format issues.
- Below 30: Poor — major misalignment or critical format problems.

QUANTIFICATION RECOGNITION:
- CVs with metrics (%, $, #, time saved, growth rates) should score HIGHER on impactClarity
- "Drove 12% increase in follower growth" → strong
- "Achieved 97% accuracy (+7pp over baseline)" → excellent
- "Responsible for social media" → weak
- 70%+ quantified bullets = impactClarity 75+

SCORING EACH DIMENSION:
- atsCompatibility: How well will ATS parsers extract and categorize this CV?
- keywordMatch: What % of JD requirements appear in the CV? Include semantic matches at partial credit
- recruiterAppeal: Would a recruiter spend >6 seconds on this?
- impactClarity: Are achievements quantified with metrics? Action verbs? Specific outcomes?
- formatScore: Technical parsing compatibility

DO NOT artificially deflate scores for well-crafted CVs. DO NOT inflate scores for generic CVs.

═══════════════════════════════════════════
PHASE 4: ADVANCED ANALYSIS
═══════════════════════════════════════════
1. **Similarity Score** (0-100): Semantic overlap between CV and JD.
2. **Key Differences**: Competency AREAS the JD demands that the CV lacks.
3. **Outdated Terms**: Flag outdated terminology with modern alternatives.
4. **Trending Skills Gap**: Increasingly expected skills missing from CV.
5. **Role Fit Assessment**: Career trajectory and seniority alignment.

═══════════════════════════════════════════
PHASE 5: RED FLAGS — ALWAYS CHECK (calibrated from real-world CV corpus)
═══════════════════════════════════════════
Treat each of the following as a HARD deduction. Surface them in \`weaknesses\` AND offer a \`rewrites\` fix when applicable. Do not stay silent if you see them.

A. TEMPLATE / PLACEHOLDER LEAKAGE (auto −10 on recruiterAppeal & formatScore):
   • Literal strings: "Company Name", "City , State", "City, State, Country", "[Your Name]", "Lorem ipsum", "DD/MM/YYYY".
   • Generic role titles with no employer (e.g. "Engineering Officer" with employer = "Company Name").
   • Project entries where the project label is the JOB TITLE instead of a project name (common template artifact).

B. VAGUE / PASSIVE OPENINGS (auto −8 on recruiterAppeal):
   • Objectives starting with "Looking for…", "To contribute…", "Seeking an opportunity…", "A motivated/hard-working professional…".
   • Replace with a 2-line Profile: Title + Years + 2 domains + 1 quantified headline win.

C. WEAK / PASSIVE VERBS (flag in weakVerbs and rewrite):
   Aids, Helps, Assists, Handles, Manages (alone), Oversaw, Performs, Responsible for, Worked on, Participated in, Involved in, Engaged in, Tasked with, Duties included, Familiar with, Exposure to.
   Replace with: Led, Built, Shipped, Reduced, Increased, Automated, Designed, Deployed, Owned, Spearheaded — paired with a metric.

D. SPELLING / GRAMMAR (auto −5 on recruiterAppeal per ≥1 occurrence):
   Common offenders: "Preformed/Preforms" (→ Performed), "Responsiblity" (→ Responsibility), "Mananger" (→ Manager), "Acheived" (→ Achieved), "Recieved" (→ Received), "Enviroment" (→ Environment). Flag any spotted typos explicitly in \`weaknesses\`.

E. ZERO QUANTIFICATION:
   • Count bullets in Experience. If <30% contain a number, %, currency, time unit, scale, or before/after — set impactClarity ≤ 45 and call this out as the #1 weakness.
   • Always provide ≥3 rewrites converting unquantified bullets into Action + Context + Metric form, using realistic placeholders like "[X%]" when the original gives no figure — never fabricate concrete numbers.

F. ENGINEERING-DOMAIN HEURISTICS (apply when CV targets engineering/technical roles — detected from titles like Engineer, Officer, Technician, Intern, Developer, Architect, Mechanical/Electrical/Civil/Software/Hardware/Process):
   • Standalone legacy tool lists (e.g. "LabVIEW, Modelsim, Cadence Virtuoso" with no modern complement) → add to \`outdatedTerms\` and suggest pairing with Python/MATLAB, SystemVerilog/UVM, KiCad/Altium, Git, CI, cloud sim, or domain-modern equivalents.
   • Generic "Operating Systems: Windows, Linux, OSX" line → flag as low-signal; remove unless role specifies kernel/driver work.
   • Missing engineering essentials when relevant: standards (ISO/IEC/ASME/IEEE/IPC), safety (OSHA/HAZOP/SIL/ATEX), CAD/EDA tools, simulation/FEA, version control, lifecycle (V-model, Agile/Scrum for SW), languages (Python/C/C++/Verilog/VHDL/MATLAB), units & tolerances on metrics.
   • Generic "Engaged in various automation…", "Learned about…", "Knowledge of…" phrasings → strip; replace with concrete deliverables.
   • Project sections must lead with: Project name → 1-line problem → tech stack → measurable outcome (throughput, latency, defect rate, cost, uptime, yield, MTTR/MTBF, kWh, etc.).

G. STRUCTURAL CONSISTENCY:
   • Mixed date formats (e.g. "07/2014" + "Jan 2013" + "2017") → flag in formatIssues.
   • Section header drift ("Education and Training" vs "Education", "Published Work" vs "Publications") → suggest canonical headers ATS parsers recognise: Summary, Experience, Education, Skills, Projects, Certifications, Publications.
   • Lowercase bullet starts (e.g. "responsible for managing…") → flag as polish issue.
   • Wall-of-text bullets that cram 3+ ideas into one line → split into discrete Action+Context+Result bullets, max 2 lines each.
   • Duplicate content across "Accomplishments" and "Experience" sections → consolidate; "Accomplishments" should hold awards/recognitions only, not duplicated job duties.

H. BUZZWORD & PERSONALITY-AS-SKILL DEFLATION (auto −5 on recruiterAppeal):
   • Reject these openers / fillers in Summary or Skills: "Self-motivated", "Hard-working", "Goal-oriented", "Detail-oriented", "Results-driven", "Team player", "Dynamic", "Passionate", "Innovative", "Synergy", "Thinks outside the box", "Go-getter", "Strategic thinker" (when unsupported by evidence).
   • Personality traits listed as skills ("Dependable", "Personable", "Analytical", "Dedicated team player", "Adaptable") → call out as low-signal; Skills section should be tools/methods/frameworks/standards, not adjectives.
   • Replace with a Profile that opens with: "{Role} with {N} years in {domain1, domain2} — {one quantified flagship win}".

I. ACRONYMS & INTERNAL JARGON (clarity hit):
   • Any acronym used without expansion on first mention → flag (e.g. "SCOM", "HIPO", "MSPOLL", "MACH", "VMM", "App-V", "SOW", "MTBF" should appear as "Acronym (Full Form)" first time).
   • Internal/proprietary project names, codenames, or person names (e.g. "Angel Tree", "Digi Girlz", "Know-Me", "Vince Hampton", specific customer-rep names) → strip; recruiters outside the company won't recognise them. Replace with neutral descriptors ("internal mentorship programme", "cross-team escalation initiative").
   • Title prefixes that look like program/aircraft numbers (e.g. "737 Industrial Engineering Manager") often indicate PDF-parsing bleed — flag in formatIssues and suggest cleaning.

J. TENURE TELESCOPING:
   • Any single role >3 years with fewer than 3 distinct accomplishment bullets → flag as "telescoped tenure". Long tenures need MORE substance, not less. Demand 1 bullet per ~18 months of tenure, each with scope + result.
   • Conversely, every <6-month role with 5+ bullets → flag as over-detailed; condense.

K. LOW-SIGNAL SKILL ENTRIES:
   • Microsoft Office basics ("Word, Excel, Outlook"), generic "Internet", "Email", "Typing" → remove unless role is admin/data-entry. Replace with role-relevant tools.
   • Outdated OS specifics ("Windows XP", "Windows 7") → flag unless legacy-systems role.


L. SECTION DUPLICATION & STRUCTURAL BLOAT:
   • "Experience" and "Work History" sections containing identical roles + identical bullets → auto −10 on formatScore, auto −8 on recruiterAppeal. Recommend collapsing into a single "Experience" section.
   • Repeated bullets across roles (same sentence appearing under 2+ jobs) → flag as copy-paste; demand role-specific accomplishments.
   • "Highlights" or "Accomplishments" section that is actually a skills list (comma-separated tools, no verbs, no outcomes) → rename to "Skills" or replace with real achievements (verb + metric).

M. TITLE / NARRATIVE MISMATCH (recruiter trust-killer):
   • CV title says one domain (e.g., "Software Engineering Manager", "Civil Engineering Assistant", "Construction Engineering Supervisor") but Summary opens with an unrelated discipline (e.g., "Human Resources professional", "Security professional") → auto −15 on recruiterAppeal, auto −10 on overall. Flag in \`weaknesses\` as "Title/Summary discipline mismatch — recruiter will discard within 6 seconds."
   • Most recent role unrelated to target domain (e.g., "Medical Receptionist" as current role on a Civil Engineering CV) with no bridging narrative → flag and suggest a "Career Focus" line explaining the pivot.
   • Job title in CV header that doesn't appear anywhere in the Experience section → flag as aspirational/inflated title.

N. ENCODING & TYPOGRAPHIC ARTEFACTS:
   • Mojibake / stray glyphs (Â, ï¼, â€™, â€“, ﻿, ​) → auto −5 on formatScore. These come from copy-paste between Word/PDF/Google Docs and signal sloppy proofreading.
   • Trailing commas in lists ("AutoCAD, MS Word,"), double spaces, smart quotes mixed with straight quotes → flag in formatIssues.
   • Two-column "Highlights" tables that ATS parsers break — flag and recommend single-column bulleted Skills.

O. DATE-RANGE INTEGRITY:
   • Overlapping roles with no "concurrent" / "part-time" qualifier (e.g., full-time role A 2010–2015 overlaps full-time role B 2012–2014) → flag as "Unexplained role overlap" in weaknesses.
   • "to Current" on an older role while a newer dated role exists → flag as stale; ask user to close the date.
   • Gap >12 months between roles with no explanation → flag and suggest a one-line gap statement (study, caregiving, freelance, relocation).
   • Mixed date formats within the same CV ("September 2014" vs "08/2015" vs "01/2017") → already covered in G; reinforce here for date column specifically.

P. SECTION-LABEL MISUSE:
   • "Accomplishments" populated with responsibilities ("Assisted in...", "Helped students...") instead of outcomes → flag; demand verb + metric + result.
   • "Profile" / "Summary" that lists tools instead of positioning the candidate → ask for a 2-line positioning statement (role + domain + signature win) and move tools to Skills.
   • "Projects" section bullets describing course content instead of the candidate's contribution + outcome → flag as "course description, not contribution".

Q. SUMMARY WALL-OF-TEXT (Frankenstein personas):
   • Summary/Profile >80 words or stitching 3+ personas ("Dedicated Operations Manager... Tech-savvy Project Manager... Skilled Operation Manager...") → auto −10 on recruiterAppeal. Recruiters read 2 lines max.
   • Repeated generic adjective stacks ("Accomplished, ambitious, influential", "Dedicated, motivated, hard-working") → flag every adjective unsupported by a metric.
   • Infinitive-objective openings ("To design...", "Vision to create...", "Seeking a position to...") → rewrite as a noun-led positioning sentence (Role + Domain + Years + Signature Win).

R. SKILLS-TAXONOMY HYGIENE:
   • Duplicate entries within Skills/Highlights (same term twice) → flag as careless.
   • Version-pinned legacy tools ("SolidWorks 2005", "IIS 5/6", "Windows 2000/XP", "J2ME", "8051", "Visual Basic 6") → add to outdatedTerms with modern alternatives.
   • Mixing one-word skill tags with achievement sentences in the same block → split into "Skills" (tags only) and "Achievements" (verb + metric).
   • Two-column "Highlights" wall with mixed tools + soft-claims ("Effective leader", "Deadline-oriented" sitting next to "Linux, VxWorks") → restructure into Skills (technical) + a separate, evidenced Leadership line.

S. BULLET HYGIENE & GLYPH NOISE:
   • Literal bullet glyphs leaking into text ("â€¢", "ï¼​", "•" prefixed inside the bullet itself) → auto −5 on formatScore; strip them.
   • Run-on bullets containing 3+ independent ideas separated only by spaces or "Â" → split into atomic bullets, each verb-led.
   • Inline URLs / product marketing links inside Experience bullets ("Products: http://...") → move to a Portfolio/Links section or remove.

T. CLAIM ↔ EVIDENCE CONSISTENCY:
   • Header claims "20+ years" but dated roles total <15 years → flag tenure inflation in \`weaknesses\`.
   • "Led team of N" claimed in Summary but never substantiated in any Experience bullet → demand a substantiating bullet (team size, scope, outcome).
   • Section names drift ("Career Overview" / "Professional Profile" / "Qualifications" / "Core Qualifications" / "Highlights" all in one CV) → recommend the standard set: Summary, Skills, Experience, Education, Certifications, Projects.

U. CAPABILITY-TAG SOUP ("Core Qualifications" as buzzword wall):
   • A "Core Qualifications" / "Highlights" / "Key Skills" block listing 8+ generic capability phrases ("Executive Decision Maker", "Strategic Planning & Development", "Process Design & Improvement", "Budgetary and Policy Development") with no evidence anywhere in Experience → auto −10 on recruiterAppeal. Demand each tag be either dropped or proven by a quantified bullet.
   • Pipe-delimited mega-lines mixing tools, methods, soft skills, and domains in one paragraph ("Testing | Troubleshooting | Embedded Hardware | Project management | Logistics") → flag as un-parseable; restructure into ATS-friendly categorised lists (Languages, Tools, Methods, Domains) on separate lines.
   • Lowercase comma-soup Skills lines ("credit, customer service, drivers, focus, forms, quick, phone") that mix verbs, nouns, and filler ("focus", "quick") → strip filler words and Title Case real tools/skills only.

V. TRAINING-AS-EXPERIENCE LEAKAGE:
   • A paragraph dumping vendor training courses ("Allen Bradley PLC 5 Intermediate, Allen Bradley Advanced Programming PLC 5, Fanuc Robotics M16iL Disassembly, ABB S4P Electrical Service, ...") inside Experience/Relevant Experience → flag; move to a dedicated "Training & Certifications" section as a bulleted list with vendor + course + year.
   • "Skills Profile" or qualifications text embedded inside the Summary paragraph (one giant 150+ word block) → split: 2-line Summary + dedicated Skills section.

W. ROLE-WITHOUT-EVIDENCE:
   • Any Experience entry with a title + company + dates but ZERO accomplishment bullets → auto −8 on recruiterAppeal per empty role; demand at least 2 bullets (scope + outcome) or removal if irrelevant.
   • Role bullets that repeat the company description / city / dates already in the header line ("Boyden, IA October 2012 - March 2014 Manufacturer of ...") → flag as header duplication; move company one-liner to a small italic descriptor, keep bullets for the candidate's contributions only.

X. EDUCATION-LINE COLLAPSE:
   • Degree, institution, GPA, honours, scholarships, and coursework all crammed into one run-on line ("Bachelor of Science, Sociology Business Management December 2006 Purdue University City, State Sociology Business Management 4 Softball Scholar, Dean's List recipient") → auto −5 on formatScore; restructure as: Degree — Institution — Year on line 1; Honours/GPA on line 2; Relevant coursework on line 3.
   • "Additional Information" section containing only "(WILLING TO RELOCATE)" or duplicating Interests/Volunteer content → flag as filler; either merge into a single Personal/Logistics line in the header or remove.

Y. CONTRADICTORY DOMAIN POSITIONING:
   • Header title (e.g. "ENGINEERING TECHNOLOGIST", "ENGINEERING MANAGER") contradicted by 80% of Experience being non-engineering roles (Bartender, Dispatch Assistant, Office Manager, Medical Receptionist) → auto −15 on recruiterAppeal; require either a "Career Pivot" framing line in Summary OR pruning irrelevant roles to a single "Earlier Experience" one-liner.
   • Summary opens with "To obtain a position..." objective statement → already covered in Q; reinforce: replace with a value-led headline tied to the target title.



═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "botPass": {
    "formatIssues": ["only REAL issues — empty array if clean"],
    "extractedFields": [{"label":"field","value":"extracted value","status":"ok|warning|error"}]
  },
  "algorithm": {
    "hardRequirements": [{"skill":"skill","status":"matched|missing|weak","context":"evidence"}],
    "softSkills": [{"skill":"skill","status":"matched|missing"}],
    "phantomMatches": [{"keyword":"keyword","reason":"why ATS ranks lower"}],
    "similarityScore": 0-100,
    "keyDifferences": ["competency gaps"],
    "outdatedTerms": [{"term":"outdated","modernAlternative":"current"}],
    "trendingSkillsGap": ["missing trending skills"]
  },
  "humanPass": {
    "overallImpression": "2-3 sentence recruiter assessment",
    "strengths": ["specific strengths"],
    "weaknesses": ["specific weaknesses"],
    "weakVerbs": [{"original":"weak phrase","suggestion":"stronger replacement"}],
    "roleFitAssessment": "trajectory fit assessment"
  },
  "rewrites": [{"context":"section","before":"original","after":"improved"}],
  "scores": {
    "overall": 0-100,
    "atsCompatibility": 0-100,
    "keywordMatch": 0-100,
    "recruiterAppeal": 0-100,
    "impactClarity": 0-100,
    "formatScore": 0-100
  },
  "keywordAnalysis": [{"keyword":"keyword","foundInCV":true,"importance":"critical|high|medium|low","context":"where found","whereToAdd":"section and phrasing (only if false)"}],
  "sectionTips": [
    {"section":"Summary/Profile","score":0-100,"tips":["actionable tip"]},
    {"section":"Work Experience","score":0-100,"tips":["actionable tip"]},
    {"section":"Skills","score":0-100,"tips":["actionable tip"]},
    {"section":"Education","score":0-100,"tips":["actionable tip"]}
  ],
  "matchSummary": {
    "matchRate": 0-100,
    "hardSkillMatch": 0-100,
    "softSkillMatch": 0-100,
    "measurableImpact": 0-100,
    "summary": "2-3 sentence verdict"
  },
  "optimizedCvText": "THE COMPLETE REWRITTEN CV TEXT with all suggested changes applied — keep the same structure/sections but upgrade every weak bullet, inject missing JD keywords naturally, replace weak verbs with strong action verbs, add quantified impact (use bracketed placeholders like [X%] when no real figure exists — NEVER fabricate concrete metrics), enforce ATS-safe single-column plain-text formatting with canonical section headers. Output should be ready to copy-paste into a fresh document."
}

REWRITE RULES:
- "Action Verb + Context + Quantifiable Result" framework
- Mirror JD terminology. NEVER fabricate metrics — use [X%], [N], [€X] placeholders if unknown.
- Provide 4-6 rewrites targeting weakest bullets first.
- The "optimizedCvText" field is MANDATORY when a JD is provided — produce a full ready-to-send rewrite, not a snippet.

KEYWORD ANALYSIS: 10-15 keywords. For missing: specify section and natural phrasing.
SECTION TIPS: Score each section. Reference SPECIFIC content from CV and JD.`;

// ─── Helper: call a single model ───────────────────────────────────
async function callModel(
  model: string,
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Record<string, any>> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw { status: response.status, message: errorText };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`No content from ${model}`);

  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    const first = jsonStr.indexOf("{");
    const last = jsonStr.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(jsonStr.slice(first, last + 1));
    throw new Error(`Model ${model} returned non-JSON`);
  }
}

// ─── Helper: merge two scan results ────────────────────────────────
function mergeResults(a: any, b: any): any {
  // Average the scores (weighted: take the more conservative score slightly)
  const avgScore = (sa: number, sb: number) => {
    const min = Math.min(sa, sb);
    const avg = Math.round((sa + sb) / 2);
    // Lean 30% toward the lower score for conservatism
    return Math.round(avg * 0.7 + min * 0.3);
  };

  const scores = {
    overall: avgScore(a.scores?.overall ?? 0, b.scores?.overall ?? 0),
    atsCompatibility: avgScore(a.scores?.atsCompatibility ?? 0, b.scores?.atsCompatibility ?? 0),
    keywordMatch: avgScore(a.scores?.keywordMatch ?? 0, b.scores?.keywordMatch ?? 0),
    recruiterAppeal: avgScore(a.scores?.recruiterAppeal ?? 0, b.scores?.recruiterAppeal ?? 0),
    impactClarity: avgScore(a.scores?.impactClarity ?? 0, b.scores?.impactClarity ?? 0),
    formatScore: avgScore(a.scores?.formatScore ?? 0, b.scores?.formatScore ?? 0),
  };

  // Merge arrays: deduplicate by key content
  const mergeArrays = <T>(arr1: T[], arr2: T[], key?: keyof T): T[] => {
    const combined = [...(arr1 || []), ...(arr2 || [])];
    if (!key) return combined;
    const seen = new Set<string>();
    return combined.filter((item) => {
      const k = String((item as any)[key]).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  // For format issues, union unique issues
  const formatIssues = [...new Set([
    ...(a.botPass?.formatIssues || []),
    ...(b.botPass?.formatIssues || []),
  ])];

  // For extracted fields, prefer longer list
  const extractedFields = (a.botPass?.extractedFields?.length ?? 0) >= (b.botPass?.extractedFields?.length ?? 0)
    ? a.botPass?.extractedFields || []
    : b.botPass?.extractedFields || [];

  // Hard requirements: merge and prefer the more detailed assessment
  const hardReqs = mergeArrays(
    a.algorithm?.hardRequirements || [],
    b.algorithm?.hardRequirements || [],
    "skill" as any
  );

  const softSkills = mergeArrays(
    a.algorithm?.softSkills || [],
    b.algorithm?.softSkills || [],
    "skill" as any
  );

  const phantomMatches = mergeArrays(
    a.algorithm?.phantomMatches || [],
    b.algorithm?.phantomMatches || [],
    "keyword" as any
  );

  // Similarity: average
  const similarityScore = Math.round(
    ((a.algorithm?.similarityScore ?? 0) + (b.algorithm?.similarityScore ?? 0)) / 2
  );

  // Key differences: union
  const keyDifferences = [...new Set([
    ...(a.algorithm?.keyDifferences || []),
    ...(b.algorithm?.keyDifferences || []),
  ])];

  const outdatedTerms = mergeArrays(
    a.algorithm?.outdatedTerms || [],
    b.algorithm?.outdatedTerms || [],
    "term" as any
  );

  const trendingSkillsGap = [...new Set([
    ...(a.algorithm?.trendingSkillsGap || []),
    ...(b.algorithm?.trendingSkillsGap || []),
  ])];

  // Human pass: pick the longer/more detailed impression, union strengths/weaknesses
  const humanPass = {
    overallImpression: (a.humanPass?.overallImpression?.length ?? 0) >= (b.humanPass?.overallImpression?.length ?? 0)
      ? a.humanPass?.overallImpression || ""
      : b.humanPass?.overallImpression || "",
    strengths: [...new Set([...(a.humanPass?.strengths || []), ...(b.humanPass?.strengths || [])])],
    weaknesses: [...new Set([...(a.humanPass?.weaknesses || []), ...(b.humanPass?.weaknesses || [])])],
    weakVerbs: mergeArrays(
      a.humanPass?.weakVerbs || [],
      b.humanPass?.weakVerbs || [],
      "original" as any
    ),
    roleFitAssessment: (a.humanPass?.roleFitAssessment?.length ?? 0) >= (b.humanPass?.roleFitAssessment?.length ?? 0)
      ? a.humanPass?.roleFitAssessment || ""
      : b.humanPass?.roleFitAssessment || "",
  };

  // Rewrites: union by before text
  const rewrites = mergeArrays(
    a.rewrites || [],
    b.rewrites || [],
    "before" as any
  );

  // Keywords: merge, for conflicts prefer "found" over "not found"
  const keywordMap = new Map<string, any>();
  for (const kw of [...(a.keywordAnalysis || []), ...(b.keywordAnalysis || [])]) {
    const key = kw.keyword?.toLowerCase();
    if (!key) continue;
    const existing = keywordMap.get(key);
    if (!existing) {
      keywordMap.set(key, kw);
    } else if (kw.foundInCV && !existing.foundInCV) {
      keywordMap.set(key, kw); // prefer found
    }
  }
  const keywordAnalysis = Array.from(keywordMap.values());

  // Section tips: merge, average scores per section
  const sectionMap = new Map<string, any>();
  for (const tip of [...(a.sectionTips || []), ...(b.sectionTips || [])]) {
    const section = tip.section?.toLowerCase();
    if (!section) continue;
    const existing = sectionMap.get(section);
    if (!existing) {
      sectionMap.set(section, { ...tip });
    } else {
      existing.score = Math.round((existing.score + tip.score) / 2);
      existing.tips = [...new Set([...existing.tips, ...tip.tips])];
      sectionMap.set(section, existing);
    }
  }
  const sectionTips = Array.from(sectionMap.values());

  // Match summary: average scores, pick longer summary
  const matchSummary = {
    matchRate: Math.round(((a.matchSummary?.matchRate ?? 0) + (b.matchSummary?.matchRate ?? 0)) / 2),
    hardSkillMatch: Math.round(((a.matchSummary?.hardSkillMatch ?? 0) + (b.matchSummary?.hardSkillMatch ?? 0)) / 2),
    softSkillMatch: Math.round(((a.matchSummary?.softSkillMatch ?? 0) + (b.matchSummary?.softSkillMatch ?? 0)) / 2),
    measurableImpact: Math.round(((a.matchSummary?.measurableImpact ?? 0) + (b.matchSummary?.measurableImpact ?? 0)) / 2),
    summary: (a.matchSummary?.summary?.length ?? 0) >= (b.matchSummary?.summary?.length ?? 0)
      ? a.matchSummary?.summary || ""
      : b.matchSummary?.summary || "",
  };

  return {
    botPass: { formatIssues, extractedFields },
    algorithm: {
      hardRequirements: hardReqs,
      softSkills,
      phantomMatches,
      similarityScore,
      keyDifferences,
      outdatedTerms,
      trendingSkillsGap,
    },
    humanPass,
    rewrites,
    scores,
    keywordAnalysis,
    sectionTips,
    matchSummary: matchSummary.summary ? matchSummary : undefined,
    // Pick the longer optimised CV text (richer rewrite wins).
    optimizedCvText: ((a.optimizedCvText?.length ?? 0) >= (b.optimizedCvText?.length ?? 0) ? a.optimizedCvText : b.optimizedCvText) || "",
  };
}

// ─── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cv, jd, atsTarget } = await req.json();
    const atsProfile = getAtsProfile(atsTarget);

    if (!cv) {
      return new Response(
        JSON.stringify({ error: "CV is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((typeof cv === "string" && cv.length > 30000) || (typeof jd === "string" && jd.length > 15000)) {
      return new Response(
        JSON.stringify({ error: "Payload too large. CV must be ≤ 30000 chars and JD ≤ 15000 chars." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150000); // 2.5 min for dual model

    const atsBlock = `\n\n═══ TARGET ATS SIMULATION ═══\n${atsProfile.rules}\nApply the above ATS-specific parser & ranking behaviour to your scoring and flag detection. When listing format issues and weaknesses, prefix the ATS-specific ones with "${atsProfile.name}:".\n═══════════════════════════════\n`;

    const userContent = jd
      ? `CV:\n${cv}\n\nTarget JD:\n${jd}${atsBlock}\nPerform full ATS simulation: parse every section, match against ALL JD requirements (exact + semantic + transferable), detect similarity/differences, flag outdated terminology, identify trending skill gaps, assess role fit, and provide calibrated scores. Remember: quantified achievements should be rewarded, clean formatting should not be penalised.`
      : `CV:\n${cv}${atsBlock}\nNo JD provided. Run a standalone ATS compatibility scan — infer the target role from CV content, evaluate formatting, keyword strength for that role, impact clarity, recruiter appeal, and flag outdated terminology or missing trending skills. Set similarityScore to 0 and leave keyDifferences empty.`;

    // Run BOTH models in parallel
    console.log("Starting ensemble scan: gemini-2.5-pro + openai/gpt-5");

    const [geminiResult, gptResult] = await Promise.allSettled([
      callModel("google/gemini-2.5-pro", SYSTEM_PROMPT, userContent, LOVABLE_API_KEY, controller.signal),
      callModel("openai/gpt-5", SYSTEM_PROMPT, userContent, LOVABLE_API_KEY, controller.signal),
    ]);

    clearTimeout(timeout);

    // Handle results
    const geminiOk = geminiResult.status === "fulfilled" ? geminiResult.value : null;
    const gptOk = gptResult.status === "fulfilled" ? gptResult.value : null;

    if (geminiResult.status === "rejected") {
      console.error("Gemini failed:", geminiResult.reason);
      // Check for rate limit / payment errors
      if (geminiResult.reason?.status === 429 || geminiResult.reason?.status === 402) {
        if (!gptOk) {
          const status = geminiResult.reason.status;
          const msg = status === 429
            ? "Rate limit exceeded. Please try again in a moment."
            : "AI usage limit reached. Please add credits.";
          return new Response(JSON.stringify({ error: msg }), {
            status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (gptResult.status === "rejected") {
      console.error("GPT-5 failed:", gptResult.reason);
      if (gptResult.reason?.status === 429 || gptResult.reason?.status === 402) {
        if (!geminiOk) {
          const status = gptResult.reason.status;
          const msg = status === 429
            ? "Rate limit exceeded. Please try again in a moment."
            : "AI usage limit reached. Please add credits.";
          return new Response(JSON.stringify({ error: msg }), {
            status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    let finalResult: any;
    const modelsUsed: string[] = [];

    if (geminiOk && gptOk) {
      console.log("Both models succeeded, merging results");
      finalResult = mergeResults(geminiOk, gptOk);
      modelsUsed.push("Gemini 2.5 Pro", "GPT-5");
    } else if (geminiOk) {
      console.log("Only Gemini succeeded, using single result");
      finalResult = geminiOk;
      modelsUsed.push("Gemini 2.5 Pro");
    } else if (gptOk) {
      console.log("Only GPT-5 succeeded, using single result");
      finalResult = gptOk;
      modelsUsed.push("GPT-5");
    } else {
      throw new Error("Both AI models failed. Please try again.");
    }

    finalResult.modelsUsed = modelsUsed;

    // Validate essential fields
    if (!finalResult.scores || typeof finalResult.scores.overall !== "number") {
      console.error("Invalid response structure:", JSON.stringify(finalResult).substring(0, 500));
      throw new Error("AI returned an invalid analysis structure");
    }

    // ─── Apply ATS profile post-processing ─────────────────────────
    if (atsProfile.id !== "generic") {
      finalResult.scores = applyAtsWeights(finalResult.scores, atsProfile.id);
      const extraFlags = runAtsParserFlags(typeof cv === "string" ? cv : "", atsProfile.id);
      if (extraFlags.length) {
        finalResult.botPass = finalResult.botPass || { formatIssues: [], extractedFields: [] };
        const existing = finalResult.botPass.formatIssues || [];
        finalResult.botPass.formatIssues = [...new Set([...extraFlags, ...existing])];
      }
      if (finalResult.matchSummary && typeof finalResult.matchSummary.matchRate === "number") {
        // Nudge matchRate to follow the reweighted overall score (±10 band).
        const drift = finalResult.scores.overall - finalResult.matchSummary.matchRate;
        finalResult.matchSummary.matchRate = Math.max(0, Math.min(100, Math.round(finalResult.matchSummary.matchRate + drift * 0.5)));
      }
    }
    finalResult.atsTarget = atsProfile.id;
    finalResult.atsTargetName = atsProfile.name;

    // ─── Deterministic literal keyword breakdown (vs JD) ──────────────
    const cvStr = typeof cv === "string" ? cv : "";
    const jdStr = typeof jd === "string" ? jd : "";
    if (jdStr) {
      const keywords = extractJdKeywords(jdStr);
      const { score: literalScore, hits, misses } = literalKeywordMatch(cvStr, keywords);
      finalResult.keywordBreakdown = {
        literalScore,
        semanticScore: finalResult.scores?.keywordMatch ?? 0,
        totalKeywords: keywords.length,
        literalHits: hits,
        literalMisses: misses,
      };
    }

    // ─── Document health ──────────────────────────────────────────────
    finalResult.documentHealth = documentHealth(cvStr);

    // ─── Optimised-CV rescan: prove the rewrite scored higher ─────────
    if (finalResult.optimizedCvText && finalResult.optimizedCvText.trim().length > 200) {
      const rescanController = new AbortController();
      const rescanTimeout = setTimeout(() => rescanController.abort(), 30000);
      const rescanScores = await rescanOptimizedCv(
        finalResult.optimizedCvText,
        jdStr,
        LOVABLE_API_KEY,
        rescanController.signal
      );
      clearTimeout(rescanTimeout);
      if (rescanScores) {
        // Apply same ATS weights to keep comparison apples-to-apples.
        const weighted = atsProfile.id !== "generic"
          ? applyAtsWeights(rescanScores as Record<string, number>, atsProfile.id)
          : rescanScores;
        const optKeywords = jdStr ? extractJdKeywords(jdStr) : [];
        const optLiteral = jdStr
          ? literalKeywordMatch(finalResult.optimizedCvText, optKeywords).score
          : 0;
        finalResult.optimizedRescan = {
          overall: weighted.overall ?? rescanScores.overall ?? 0,
          keywordMatch: weighted.keywordMatch ?? rescanScores.keywordMatch ?? 0,
          atsCompatibility: weighted.atsCompatibility ?? rescanScores.atsCompatibility ?? 0,
          impactClarity: weighted.impactClarity ?? rescanScores.impactClarity ?? 0,
          literalScore: optLiteral,
          delta: (weighted.overall ?? 0) - (finalResult.scores?.overall ?? 0),
        };
      }
    }

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Scan timed out. Please try with a shorter CV or try again." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("scan-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
