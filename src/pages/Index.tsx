import { useState, useEffect, useCallback } from "react";
import InputPanel from "@/components/InputPanel";
import ScanningState from "@/components/ScanningState";
import ResultsFeed from "@/components/ResultsFeed";
import { ScanResult } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppState = "input" | "scanning" | "results";

const Index = () => {
  const [state, setState] = useState<AppState>("input");
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleScan = useCallback(async (cv: string, jd: string) => {
    setState("scanning");
    setScanStep(0);

    // Start the step animation
    const stepInterval = setInterval(() => {
      setScanStep((s) => {
        if (s >= 7) {
          clearInterval(stepInterval);
          return 7;
        }
        return s + 1;
      });
    }, 800);

    try {
      const { data, error } = await supabase.functions.invoke("scan-cv", {
        body: { cv, jd },
      });

      clearInterval(stepInterval);

      if (error) {
        throw new Error(error.message || "Scan failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Ensure we have all required fields with defaults
      const scanResult: ScanResult = {
        botPass: data.botPass || { formatIssues: [], extractedFields: [] },
        algorithm: data.algorithm || { hardRequirements: [], softSkills: [], phantomMatches: [] },
        humanPass: data.humanPass || { overallImpression: "", strengths: [], weaknesses: [], weakVerbs: [] },
        rewrites: data.rewrites || [],
        scores: data.scores || { overall: 0, atsCompatibility: 0, keywordMatch: 0, recruiterAppeal: 0, impactClarity: 0, formatScore: 0 },
        keywordAnalysis: data.keywordAnalysis || [],
      };

      setScanStep(8);
      setTimeout(() => {
        setResult(scanResult);
        setState("results");
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("Scan error:", err);
      toast({
        title: "Scan Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setState("input");
    }
  }, [toast]);

  const handleReset = useCallback(() => {
    setState("input");
    setResult(null);
    setScanStep(0);
  }, []);

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
                Paste your CV and target Job Description on the left, then initiate the AI-powered dual ATS/Recruiter scan. You'll receive real semantic analysis, recruiter evaluation, and actionable rewrites.
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
