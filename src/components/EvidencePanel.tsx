import { KeywordBreakdown, DocumentHealth, OptimizedRescan } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, FileText, Search } from "lucide-react";

interface Props {
  keywordBreakdown?: KeywordBreakdown;
  documentHealth?: DocumentHealth;
  optimizedRescan?: OptimizedRescan;
  originalOverall: number;
}

const scoreColor = (n: number) =>
  n >= 75 ? "text-emerald-500" : n >= 50 ? "text-amber-500" : "text-red-500";

const EvidencePanel = ({ keywordBreakdown, documentHealth, optimizedRescan, originalOverall }: Props) => {
  if (!keywordBreakdown && !documentHealth && !optimizedRescan) return null;

  return (
    <div className="bg-card rounded-md border border-border p-4 space-y-5">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Evidence — Deterministic Signals
        </h3>
      </div>

      {keywordBreakdown && keywordBreakdown.totalKeywords > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded p-3 border border-border/60">
              <div className="text-[10px] uppercase text-muted-foreground font-mono-tech tracking-wide mb-1">
                Literal match
              </div>
              <div className={`text-2xl font-bold ${scoreColor(keywordBreakdown.literalScore)}`}>
                {keywordBreakdown.literalScore}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {keywordBreakdown.literalHits.length}/{keywordBreakdown.totalKeywords} exact JD terms found
              </div>
            </div>
            <div className="bg-muted/40 rounded p-3 border border-border/60">
              <div className="text-[10px] uppercase text-muted-foreground font-mono-tech tracking-wide mb-1">
                Semantic match (AI)
              </div>
              <div className={`text-2xl font-bold ${scoreColor(keywordBreakdown.semanticScore)}`}>
                {keywordBreakdown.semanticScore}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Includes synonyms & transferable skills
              </div>
            </div>
          </div>

          {keywordBreakdown.literalMisses.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                Missing literal JD keywords ({keywordBreakdown.literalMisses.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywordBreakdown.literalMisses.slice(0, 20).map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded text-[11px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {keywordBreakdown.literalHits.length > 0 && (
            <details className="text-[11px]">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Show {keywordBreakdown.literalHits.length} matched keywords
              </summary>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywordBreakdown.literalHits.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {documentHealth && (
        <div className="border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
              Document health
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground mb-2">
            {documentHealth.charCount.toLocaleString()} chars extracted • ~{documentHealth.textDensityPerPage} chars/page
          </div>
          {documentHealth.warnings.length > 0 ? (
            <ul className="space-y-1">
              {documentHealth.warnings.map((w, i) => (
                <li key={i} className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              No parsing red flags detected.
            </div>
          )}
        </div>
      )}

      {optimizedRescan && (
        <div className="border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <div className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
              Before / after — auto re-scan of optimised CV
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded p-3 border border-border/60">
              <div className="text-[10px] uppercase text-muted-foreground font-mono-tech tracking-wide">Before</div>
              <div className={`text-2xl font-bold ${scoreColor(originalOverall)}`}>{originalOverall}</div>
            </div>
            <div className="bg-muted/40 rounded p-3 border border-border/60">
              <div className="text-[10px] uppercase text-muted-foreground font-mono-tech tracking-wide">After</div>
              <div className={`text-2xl font-bold ${scoreColor(optimizedRescan.overall)}`}>
                {optimizedRescan.overall}
              </div>
            </div>
            <div className="bg-primary/5 rounded p-3 border border-primary/30">
              <div className="text-[10px] uppercase text-primary font-mono-tech tracking-wide">Delta</div>
              <div
                className={`text-2xl font-bold ${
                  optimizedRescan.delta >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {optimizedRescan.delta >= 0 ? "+" : ""}
                {optimizedRescan.delta}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2 text-[11px] text-muted-foreground">
            <div>
              Keywords:{" "}
              <span className={scoreColor(optimizedRescan.keywordMatch)}>{optimizedRescan.keywordMatch}</span>
            </div>
            <div>
              ATS compat:{" "}
              <span className={scoreColor(optimizedRescan.atsCompatibility)}>
                {optimizedRescan.atsCompatibility}
              </span>
            </div>
            <div>
              Impact:{" "}
              <span className={scoreColor(optimizedRescan.impactClarity)}>{optimizedRescan.impactClarity}</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Literal keyword match on rewrite:{" "}
            <span className={`font-semibold ${scoreColor(optimizedRescan.literalScore)}`}>
              {optimizedRescan.literalScore}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidencePanel;
