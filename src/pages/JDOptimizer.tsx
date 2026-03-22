import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Lightbulb, Copy, Check } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const JDOptimizer = () => {
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-jd", {
        body: { jd, cv: cv.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to analyze JD", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">JD Optimizer</h1>
          <p className="text-xs text-muted-foreground">Analyze & optimize job descriptions for ATS screening</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Job Description *</label>
            <Textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description here..." className="min-h-[200px] text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Your CV (optional)</label>
            <Textarea value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Paste your CV for personalized tailoring advice..." className="min-h-[200px] text-sm" />
          </div>
        </div>

        <Button onClick={handleAnalyze} disabled={!jd.trim() || loading} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : "Analyze & Optimize JD"}
        </Button>

        {result && (
          <div className="space-y-6">
            {/* ATS Score */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">ATS Friendliness Score</h3>
                <span className={`text-2xl font-bold ${result.atsScore >= 70 ? "text-accent" : result.atsScore >= 40 ? "text-warning" : "text-destructive"}`}>
                  {result.atsScore}/100
                </span>
              </div>
            </div>

            {/* Optimized JD */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Optimized JD</h3>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.optimizedJD)}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.optimizedJD}</p>
            </div>

            {/* Key Changes */}
            {result.keyChanges?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">Key Changes</h3>
                <ul className="space-y-1.5">
                  {result.keyChanges.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Red Flags
                </h3>
                <ul className="space-y-1.5">
                  {result.warnings.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hidden Requirements */}
            {result.hiddenRequirements?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">Hidden Requirements</h3>
                <ul className="space-y-1.5">
                  {result.hiddenRequirements.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Application Tips */}
            {result.applicationTips?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-warning" /> Application Tips
                </h3>
                <ul className="space-y-1.5">
                  {result.applicationTips.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {t}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tailoring Advice */}
            {result.tailoringAdvice?.length > 0 && (
              <div className="p-4 rounded-lg border border-technical/30 bg-technical/5">
                <h3 className="font-semibold text-foreground mb-2">CV Tailoring Advice</h3>
                <ul className="space-y-1.5">
                  {result.tailoringAdvice.map((a: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default JDOptimizer;
