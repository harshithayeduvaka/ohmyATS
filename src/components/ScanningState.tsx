const steps = [
  "Extracting contact fields...",
  "Parsing education blocks...",
  "Mapping work experience dates...",
  "Running dual-model semantic analysis...",
  "Cross-referencing with GPT-5 engine...",
  "Cross-referencing with Gemini Pro engine...",
  "Merging ensemble results...",
  "Assessing recruiter appeal...",
  "Generating actionable rewrites...",
];

interface ScanningStateProps {
  currentStep: number;
}

const ScanningState = ({ currentStep }: ScanningStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Running Dual Scan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bot Pass → Algorithm Ranking → Human Pass
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm font-mono-tech transition-all duration-300 ${
                i < currentStep
                  ? "text-accent"
                  : i === currentStep
                  ? "text-foreground pulse-keyword"
                  : "text-muted-foreground/40"
              }`}
            >
              <span className="w-5 text-right text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
              {i < currentStep && <span className="text-accent ml-auto">✓</span>}
            </div>
          ))}
        </div>

        <div className="mt-8 h-0.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-technical rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScanningState;
