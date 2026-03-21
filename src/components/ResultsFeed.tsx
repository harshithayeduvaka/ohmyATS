import { ScanResult } from "@/lib/types";
import BotPassSection from "./BotPassSection";
import AlgorithmSection from "./AlgorithmSection";
import HumanPassSection from "./HumanPassSection";
import RewriteSection from "./RewriteSection";
import ScoreDashboard from "./ScoreDashboard";
import KeywordHighlight from "./KeywordHighlight";
import ScanChat from "./ScanChat";

interface ResultsFeedProps {
  result: ScanResult;
  cv?: string;
  jd?: string;
}

const ResultsFeed = ({ result, cv = "", jd = "" }: ResultsFeedProps) => {
  return (
    <>
      <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <ScoreDashboard scores={result.scores} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <BotPassSection data={result.botPass} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <AlgorithmSection data={result.algorithm} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <KeywordHighlight keywords={result.keywordAnalysis} />
        </div>

        {/* Role Fit Assessment */}
        {result.humanPass.roleFitAssessment && (
          <div className="animate-fade-in-up bg-card rounded-md border border-border p-4" style={{ animationDelay: "350ms" }}>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Role Fit Assessment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.humanPass.roleFitAssessment}</p>
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <HumanPassSection data={result.humanPass} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <RewriteSection rewrites={result.rewrites} />
        </div>
      </div>

      <ScanChat result={result} cv={cv} jd={jd} />
    </>
  );
};

export default ResultsFeed;
