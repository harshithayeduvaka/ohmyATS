import { KeywordAnalysisItem } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";

interface KeywordHighlightProps {
  keywords: KeywordAnalysisItem[];
}

const importanceBadge = (importance: string) => {
  const styles: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-warning/10 text-warning border-warning/20",
    medium: "bg-technical/10 text-technical border-technical/20",
    low: "bg-muted text-muted-foreground border-border",
  };
  return styles[importance] || styles.low;
};

const KeywordHighlight = ({ keywords }: KeywordHighlightProps) => (
  <section>
    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
      Keyword Analysis
    </h2>

    <div className="space-y-2">
      {keywords.map((kw, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2.5 rounded-md bg-card border border-border"
        >
          {kw.foundInCV ? (
            <CheckCircle className="w-4 h-4 text-accent shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${importanceBadge(kw.importance)}`}>
                {kw.importance}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{kw.context}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default KeywordHighlight;
