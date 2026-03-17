import { ScoreData } from "@/lib/types";

interface ScoreDashboardProps {
  scores: ScoreData;
}

const ScoreGauge = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{value}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
};

const getScoreColor = (value: number): string => {
  if (value >= 75) return "hsl(var(--accent))";
  if (value >= 50) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
};

const ScoreDashboard = ({ scores }: ScoreDashboardProps) => (
  <section>
    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
      Score Breakdown
    </h2>

    {/* Overall Score */}
    <div className="flex items-center justify-center mb-6">
      <div className="text-center">
        <div className="relative w-28 h-28 mx-auto">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={getScoreColor(scores.overall)}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 - (scores.overall / 100) * 2 * Math.PI * 52}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{scores.overall}</span>
            <span className="text-xs text-muted-foreground">Overall</span>
          </div>
        </div>
      </div>
    </div>

    {/* Individual Scores */}
    <div className="grid grid-cols-5 gap-3">
      <ScoreGauge label="ATS Compat." value={scores.atsCompatibility} color={getScoreColor(scores.atsCompatibility)} />
      <ScoreGauge label="Keywords" value={scores.keywordMatch} color={getScoreColor(scores.keywordMatch)} />
      <ScoreGauge label="Recruiter" value={scores.recruiterAppeal} color={getScoreColor(scores.recruiterAppeal)} />
      <ScoreGauge label="Impact" value={scores.impactClarity} color={getScoreColor(scores.impactClarity)} />
      <ScoreGauge label="Format" value={scores.formatScore} color={getScoreColor(scores.formatScore)} />
    </div>
  </section>
);

export default ScoreDashboard;
