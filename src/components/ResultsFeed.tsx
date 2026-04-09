import { ScanResult } from "@/lib/types";
import BotPassSection from "./BotPassSection";
import AlgorithmSection from "./AlgorithmSection";
import HumanPassSection from "./HumanPassSection";
import RewriteSection from "./RewriteSection";
import ScoreDashboard from "./ScoreDashboard";
import KeywordHighlight from "./KeywordHighlight";
import ScanChat from "./ScanChat";
import MatchSummaryCard from "./MatchSummaryCard";
import SectionTips from "./SectionTips";
import CVComparison from "./CVComparison";

interface ResultsFeedProps {
  result: ScanResult;
  cv?: string;
  jd?: string;
}

const ResultsFeed = ({ result, cv = "", jd = "" }: ResultsFeedProps) => {
  return (
    <>
      <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
        {result.modelsUsed && result.modelsUsed.length > 0 && (
          <div className="animate-fade-in-up flex items-center gap-2 flex-wrap" style={{ animationDelay: "0ms" }}>
            <span className="text-xs text-muted-foreground font-mono-tech">Powered by</span>
            {result.modelsUsed.map((model) => (
              <span
                key={model}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-technical/10 text-technical border border-technical/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {model}
              </span>
            ))}
            {result.modelsUsed.length > 1 && (
              <span className="text-xs text-muted-foreground font-mono-tech">• Ensemble merged</span>
            )}
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <ScoreDashboard scores={result.scores} />
        </div>

        {result.matchSummary && (
          <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
            <MatchSummaryCard data={result.matchSummary} />
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <BotPassSection data={result.botPass} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <AlgorithmSection data={result.algorithm} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <KeywordHighlight keywords={result.keywordAnalysis} />
        </div>

        {result.humanPass.roleFitAssessment && (
          <div className="animate-fade-in-up bg-card rounded-md border border-border p-4" style={{ animationDelay: "350ms" }}>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Role Fit Assessment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.humanPass.roleFitAssessment}</p>
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <HumanPassSection data={result.humanPass} />
        </div>

        {result.sectionTips && result.sectionTips.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: "450ms" }}>
            <SectionTips tips={result.sectionTips} />
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <RewriteSection rewrites={result.rewrites} />
        </div>

        {cv && (
          <div className="animate-fade-in-up" style={{ animationDelay: "600ms" }}>
            <CVComparison cv={cv} result={result} />
          </div>
        )}
      </div>

      <ScanChat result={result} cv={cv} jd={jd} />
    </>
  );
};

export default ResultsFeed;
