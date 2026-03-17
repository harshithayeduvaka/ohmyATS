import { HumanPassData } from "@/lib/types";
import { User, ArrowRight } from "lucide-react";

const HumanPassSection = ({ data }: { data: HumanPassData }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <User className="w-4 h-4 text-accent" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Human Pass — Recruiter Appeal
      </h2>
    </div>

    <div className="space-y-3">
      <div className="bg-card rounded-md border border-border p-3">
        <p className="text-sm text-foreground leading-relaxed">{data.overallImpression}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent/5 rounded-md border border-accent/15 p-3">
          <p className="text-xs font-semibold text-accent uppercase mb-2">Strengths</p>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-foreground">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-destructive/5 rounded-md border border-destructive/15 p-3">
          <p className="text-xs font-semibold text-destructive uppercase mb-2">Weaknesses</p>
          <ul className="space-y-1">
            {data.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-foreground">• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      {data.weakVerbs.length > 0 && (
        <div className="bg-card rounded-md border border-border p-3">
          <p className="text-xs font-semibold text-foreground uppercase mb-2">Weak Verb Upgrades</p>
          <div className="space-y-1.5">
            {data.weakVerbs.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">{v.original}</span>
                <ArrowRight className="w-3 h-3 text-accent shrink-0" />
                <span className="font-medium text-accent">{v.suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);

export default HumanPassSection;
