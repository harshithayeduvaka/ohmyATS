import { ScanResult } from "@/lib/types";
import BotPassSection from "./BotPassSection";
import AlgorithmSection from "./AlgorithmSection";
import HumanPassSection from "./HumanPassSection";
import RewriteSection from "./RewriteSection";

interface ResultsFeedProps {
  result: ScanResult;
}

const ResultsFeed = ({ result }: ResultsFeedProps) => {
  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <BotPassSection data={result.botPass} />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <AlgorithmSection data={result.algorithm} />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <HumanPassSection data={result.humanPass} />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <RewriteSection rewrites={result.rewrites} />
      </div>
    </div>
  );
};

export default ResultsFeed;
