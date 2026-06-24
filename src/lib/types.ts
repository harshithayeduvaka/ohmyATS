export interface BotPassData {
  formatIssues: string[];
  extractedFields: { label: string; value: string; status: "ok" | "warning" | "error" }[];
}

export interface AlgorithmData {
  hardRequirements: { skill: string; status: "matched" | "missing" | "weak"; context?: string }[];
  softSkills: { skill: string; status: "matched" | "missing" }[];
  phantomMatches: { keyword: string; reason: string }[];
  similarityScore?: number;
  keyDifferences?: string[];
  outdatedTerms?: { term: string; modernAlternative: string }[];
  trendingSkillsGap?: string[];
}

export interface HumanPassData {
  overallImpression: string;
  strengths: string[];
  weaknesses: string[];
  weakVerbs: { original: string; suggestion: string }[];
  roleFitAssessment?: string;
}

export interface RewriteExample {
  context: string;
  before: string;
  after: string;
}

export interface ScoreData {
  overall: number;
  atsCompatibility: number;
  keywordMatch: number;
  recruiterAppeal: number;
  impactClarity: number;
  formatScore: number;
}

export interface KeywordAnalysisItem {
  keyword: string;
  foundInCV: boolean;
  importance: "critical" | "high" | "medium" | "low";
  context: string;
  whereToAdd?: string;
}

export interface SectionTip {
  section: string;
  score: number;
  tips: string[];
}

export interface MatchSummary {
  matchRate: number;
  hardSkillMatch: number;
  softSkillMatch: number;
  measurableImpact: number;
  summary: string;
}

export interface KeywordBreakdown {
  literalScore: number; // 0-100 deterministic literal/stem hit-rate against JD
  semanticScore: number; // 0-100 AI-judged semantic match
  totalKeywords: number;
  literalHits: string[];
  literalMisses: string[];
}

export interface DocumentHealth {
  charCount: number;
  textDensityPerPage: number;
  warnings: string[];
}

export interface OptimizedRescan {
  overall: number;
  keywordMatch: number;
  atsCompatibility: number;
  impactClarity: number;
  literalScore: number;
  delta: number;
}

export interface ScanResult {
  botPass: BotPassData;
  algorithm: AlgorithmData;
  humanPass: HumanPassData;
  rewrites: RewriteExample[];
  scores: ScoreData;
  keywordAnalysis: KeywordAnalysisItem[];
  sectionTips?: SectionTip[];
  matchSummary?: MatchSummary;
  modelsUsed?: string[];
  atsTarget?: string;
  atsTargetName?: string;
  optimizedCvText?: string;
  keywordBreakdown?: KeywordBreakdown;
  documentHealth?: DocumentHealth;
  optimizedRescan?: OptimizedRescan;
}

