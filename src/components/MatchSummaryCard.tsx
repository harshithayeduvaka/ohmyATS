import { MatchSummary } from "@/lib/types";
import { Target, Zap, Users, BarChart3 } from "lucide-react";

interface MatchSummaryCardProps {
  data: MatchSummary;
}

const MiniGauge = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => {
  const color = value >= 70 ? "text-accent" : value >= 40 ? "text-warning" : "text-destructive";
  const bg = value >= 70 ? "bg-accent/10" : value >= 40 ? "bg-warning/10" : "bg-destructive/10";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-sm font-bold ${color}`}>{value}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full mt-1">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              value >= 70 ? "bg-accent" : value >= 40 ? "bg-warning" : "bg-destructive"
            }`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const MatchSummaryCard = ({ data }: MatchSummaryCardProps) => (
  <div className="bg-card rounded-md border border-border p-4 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-technical" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Match Analysis
        </h2>
      </div>
      <div className={`text-2xl font-bold ${
        data.matchRate >= 70 ? "text-accent" : data.matchRate >= 40 ? "text-warning" : "text-destructive"
      }`}>
        {data.matchRate}%
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3">
      <MiniGauge label="Hard Skills" value={data.hardSkillMatch} icon={Zap} />
      <MiniGauge label="Soft Skills" value={data.softSkillMatch} icon={Users} />
      <MiniGauge label="Measurable Impact" value={data.measurableImpact} icon={BarChart3} />
    </div>

    <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
      {data.summary}
    </p>
  </div>
);

export default MatchSummaryCard;
