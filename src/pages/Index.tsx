import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import InputPanel from "@/components/InputPanel";
import ScanningState from "@/components/ScanningState";
import ResultsFeed from "@/components/ResultsFeed";
import ScanHistory from "@/components/ScanHistory";
import AuthButton from "@/components/AuthButton";
import { ScanResult } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Download, History, LayoutDashboard, ArrowLeft, Save } from "lucide-react";
import { generatePdfReport } from "@/lib/pdfReport";
import { Button } from "@/components/ui/button";

type AppState = "input" | "scanning" | "results";
type RightView = "results" | "history";

const Index = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>("input");
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [rightView, setRightView] = useState<RightView>("results");
  const [lastCv, setLastCv] = useState("");
  const [lastJd, setLastJd] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleScan = useCallback(async (cv: string, jd: string) => {
    setState("scanning");
    setScanStep(0);
    setLastCv(cv);
    setLastJd(jd);

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

      if (error) throw new Error(error.message || "Scan failed");
      if (data?.error) throw new Error(data.error);

      const scanResult: ScanResult = {
        botPass: data.botPass || { formatIssues: [], extractedFields: [] },
        algorithm: data.algorithm || { hardRequirements: [], softSkills: [], phantomMatches: [] },
        humanPass: data.humanPass || { overallImpression: "", strengths: [], weaknesses: [], weakVerbs: [] },
        rewrites: data.rewrites || [],
        scores: data.scores || { overall: 0, atsCompatibility: 0, keywordMatch: 0, recruiterAppeal: 0, impactClarity: 0, formatScore: 0 },
        keywordAnalysis: data.keywordAnalysis || [],
        sectionTips: data.sectionTips || [],
        matchSummary: data.matchSummary || undefined,
      };

      setScanStep(8);

      // Save to history if logged in
      if (user) {
        await supabase.from("scan_history").insert({
          user_id: user.id,
          cv_text: cv,
          jd_text: jd,
          result: scanResult as any,
        });
      }

      setTimeout(() => {
        setResult(scanResult);
        setState("results");
        setRightView("results");
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("Scan error:", err);
      toast({
        title: "Scan Failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
      setState("input");
    }
  }, [toast, user]);

  const handleReset = useCallback(() => {
    setState("input");
    setResult(null);
    setScanStep(0);
    setRightView("results");
  }, []);

  const handleLoadHistory = (scanResult: ScanResult) => {
    setResult(scanResult);
    setState("results");
    setRightView("results");
  };

  const handleSaveVersion = async () => {
    if (!user || !result) return;
    const { error } = await supabase.from("resume_versions").insert({
      user_id: user.id,
      title: `Scan — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      cv_text: lastCv,
      jd_text: lastJd || null,
      overall_score: result.scores?.overall ?? null,
      scan_result: result as any,
    });
    if (error) {
      toast({ title: "Failed to save version", variant: "destructive" });
    } else {
      toast({ title: "Saved to Resume Versions!" });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left panel */}
      <div className="w-[420px] shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <InputPanel onScan={handleScan} isScanning={state === "scanning"} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-6 py-2 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {state === "results" && (
              <>
                <Button
                  variant={rightView === "results" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setRightView("results")}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Report
                </Button>
                {result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => generatePdfReport(result)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </Button>
                )}
              </>
            )}
            {user && (
              <Button
                variant={rightView === "history" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setRightView("history")}
              >
                <History className="w-3.5 h-3.5" />
                History
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Home
            </Button>
            {state === "results" && (
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← New Scan
              </button>
            )}
            <AuthButton />
          </div>
        </div>

        {/* Content */}
        {state === "input" && rightView !== "history" && (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 rounded-lg bg-technical/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-mono-tech text-technical text-lg font-bold">&gt;_</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ready to Scan</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Paste your CV and target Job Description, then initiate the AI-powered dual ATS/Recruiter scan.
                {!user && " Sign in to save your scan history."}
              </p>
            </div>
          </div>
        )}

        {state === "scanning" && <ScanningState currentStep={scanStep} />}

        {rightView === "history" && user && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScanHistory onLoadScan={handleLoadHistory} />
          </div>
        )}

        {state === "results" && result && rightView === "results" && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ResultsFeed result={result} cv={lastCv} jd={lastJd} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
