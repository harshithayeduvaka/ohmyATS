import { AlgorithmData } from "@/lib/types";
import { Cpu, CheckCircle, XCircle, AlertTriangle, TrendingUp, ArrowRightLeft, Zap } from "lucide-react";

const statusBadge = (status: "matched" | "missing" | "weak") => {
  const styles = {
    matched: "bg-accent/10 text-accent border-accent/20",
    missing: "bg-destructive/10 text-destructive border-destructive/20",
    weak: "bg-warning/10 text-warning border-warning/20",
  };
  const labels = { matched: "Matched", missing: "Critical Gap", weak: "Weak Match" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const AlgorithmSection = ({ data }: { data: AlgorithmData }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Cpu className="w-4 h-4 text-technical" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Algorithm Ranking — Semantic Match
      </h2>
    </div>

    {/* Similarity Score */}
    {typeof data.similarityScore === "number" && (
      <div className="bg-card rounded-md border border-border p-3 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground uppercase flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-technical" />
            CV ↔ JD Similarity
          </p>
          <span className={`text-lg font-bold ${
            data.similarityScore >= 70 ? "text-accent" : data.similarityScore >= 40 ? "text-warning" : "text-destructive"
          }`}>
            {data.similarityScore}%
          </span>
        </div>
      </div>
    )}

    <div className="space-y-3">
      <div className="bg-card rounded-md border border-border p-3">
        <p className="text-xs font-semibold text-foreground uppercase mb-2">Hard Requirements</p>
        <div className="space-y-2">
          {data.hardRequirements.map((req, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{req.skill}</span>
                {req.context && (
                  <p className="text-xs text-muted-foreground mt-0.5">{req.context}</p>
                )}
              </div>
              {statusBadge(req.status)}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-md border border-border p-3">
        <p className="text-xs font-semibold text-foreground uppercase mb-2">Soft Skills</p>
        <div className="flex flex-wrap gap-2">
          {data.softSkills.map((s, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
                s.status === "matched"
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {s.status === "matched" ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {s.skill}
            </span>
          ))}
        </div>
      </div>

      {data.phantomMatches.length > 0 && (
        <div className="bg-warning/5 rounded-md border border-warning/20 p-3">
          <p className="text-xs font-semibold text-warning uppercase mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Phantom Matches
          </p>
          <div className="space-y-2">
            {data.phantomMatches.map((pm, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-foreground">"{pm.keyword}"</span>
                <span className="text-muted-foreground"> — {pm.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Differences */}
      {data.keyDifferences && data.keyDifferences.length > 0 && (
        <div className="bg-destructive/5 rounded-md border border-destructive/20 p-3">
          <p className="text-xs font-semibold text-destructive uppercase mb-2 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Key Gaps vs JD
          </p>
          <ul className="space-y-1">
            {data.keyDifferences.map((diff, i) => (
              <li key={i} className="text-sm text-foreground">• {diff}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Outdated Terms */}
      {data.outdatedTerms && data.outdatedTerms.length > 0 && (
        <div className="bg-warning/5 rounded-md border border-warning/20 p-3">
          <p className="text-xs font-semibold text-warning uppercase mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Outdated Terminology
          </p>
          <div className="space-y-2">
            {data.outdatedTerms.map((t, i) => (
              <div key={i} className="text-sm flex items-center gap-2">
                <span className="line-through text-muted-foreground">{t.term}</span>
                <span className="text-foreground">→</span>
                <span className="font-medium text-accent">{t.modernAlternative}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Skills Gap */}
      {data.trendingSkillsGap && data.trendingSkillsGap.length > 0 && (
        <div className="bg-primary/5 rounded-md border border-primary/20 p-3">
          <p className="text-xs font-semibold text-primary uppercase mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Trending Skills You're Missing
          </p>
          <div className="flex flex-wrap gap-2">
            {data.trendingSkillsGap.map((skill, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-md border border-primary/20 bg-primary/10 text-primary font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);

export default AlgorithmSection;
