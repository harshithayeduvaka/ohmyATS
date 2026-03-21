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
}

export interface ScanResult {
  botPass: BotPassData;
  algorithm: AlgorithmData;
  humanPass: HumanPassData;
  rewrites: RewriteExample[];
  scores: ScoreData;
  keywordAnalysis: KeywordAnalysisItem[];
}
