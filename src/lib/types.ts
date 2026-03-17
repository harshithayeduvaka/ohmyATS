export interface BotPassData {
  formatIssues: string[];
  extractedFields: { label: string; value: string; status: "ok" | "warning" | "error" }[];
}

export interface AlgorithmData {
  hardRequirements: { skill: string; status: "matched" | "missing" | "weak"; context?: string }[];
  softSkills: { skill: string; status: "matched" | "missing" }[];
  phantomMatches: { keyword: string; reason: string }[];
}

export interface HumanPassData {
  overallImpression: string;
  strengths: string[];
  weaknesses: string[];
  weakVerbs: { original: string; suggestion: string }[];
}

export interface RewriteExample {
  context: string;
  before: string;
  after: string;
}

export interface ScanResult {
  botPass: BotPassData;
  algorithm: AlgorithmData;
  humanPass: HumanPassData;
  rewrites: RewriteExample[];
}
