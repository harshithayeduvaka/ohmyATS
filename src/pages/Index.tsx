import { useState, useEffect, useCallback } from "react";
import InputPanel from "@/components/InputPanel";
import ScanningState from "@/components/ScanningState";
import ResultsFeed from "@/components/ResultsFeed";
import { ScanResult } from "@/lib/types";
import { mockScanResult } from "@/lib/mockScanResult";

type AppState = "input" | "scanning" | "results";

const Index = () => {
  const [state, setState] = useState<AppState>("input");
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = useCallback((_cv: string, _jd: string) => {
    setState("scanning");
    setScanStep(0);
  }, []);

  const handleReset = useCallback(() => {
    setState("input");
    setResult(null);
    setScanStep(0);
  }, []);

  useEffect(() => {
    if (state !== "scanning") return;

    const totalSteps = 8;
    if (scanStep < totalSteps) {
      const timer = setTimeout(() => setScanStep((s) => s + 1), 400);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setResult(mockScanResult);
        setState("results");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state, scanStep]);

  return (
    <div className="flex h-screen bg-background">
      {/* Left panel */}
      <div className="w-[420px] shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <InputPanel onScan={handleScan} isScanning={state === "scanning"} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {state === "input" && (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 rounded-lg bg-technical/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-mono-tech text-technical text-lg font-bold">&gt;_</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ready to Scan</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Paste your CV and target Job Description on the left, then initiate the dual ATS/Recruiter scan. You'll receive a full parsing check, semantic analysis, recruiter evaluation, and actionable rewrites.
              </p>
            </div>
          </div>
        )}

        {state === "scanning" && <ScanningState currentStep={scanStep} />}

        {state === "results" && result && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-sm font-semibold text-foreground">Intelligence Report</h2>
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← New Scan
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ResultsFeed result={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
