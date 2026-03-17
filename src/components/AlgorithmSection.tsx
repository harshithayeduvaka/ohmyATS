import { AlgorithmData } from "@/lib/types";
import { Cpu, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

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
    </div>
  </section>
);

export default AlgorithmSection;
