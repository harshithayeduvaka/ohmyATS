import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Lightbulb, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ScoreBar = ({ label, score, max = 100 }: { label: string; score: number; max?: number }) => {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? "bg-accent" : pct >= 40 ? "bg-warning" : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const LinkedInAnalyzer = () => {
  const [profileText, setProfileText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!profileText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-linkedin", {
        body: { profileText, targetRole: targetRole.trim() || undefined, industry: industry.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to analyze profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">LinkedIn Coach</h1>
          <p className="text-xs text-muted-foreground">Analyze, optimize & get coaching for your LinkedIn profile</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">LinkedIn Profile Text *</label>
          <p className="text-xs text-muted-foreground mb-2">Copy your entire LinkedIn profile (headline, about, experience, skills, etc.) and paste it here.</p>
          <Textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} placeholder="Paste your full LinkedIn profile content..." className="min-h-[200px] text-sm" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Target Role (optional)</label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Product Manager" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Industry (optional)</label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Fintech, SaaS" />
          </div>
        </div>

        <Button onClick={handleAnalyze} disabled={!profileText.trim() || loading} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Profile...</> : "Analyze My LinkedIn"}
        </Button>

        {result && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="p-5 rounded-lg border border-border bg-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Overall Profile Score</p>
              <p className={`text-5xl font-bold ${result.overallScore >= 70 ? "text-accent" : result.overallScore >= 40 ? "text-warning" : "text-destructive"}`}>
                {result.overallScore}
              </p>
              <p className="text-xs text-muted-foreground mt-1">out of 100</p>
            </div>

            {/* Section Scores */}
            {result.scores && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <h3 className="font-semibold text-foreground">Section Breakdown</h3>
                <ScoreBar label="Headline" score={result.scores.headline} />
                <ScoreBar label="About / Summary" score={result.scores.summary} />
                <ScoreBar label="Experience" score={result.scores.experience} />
                <ScoreBar label="Skills" score={result.scores.skills} />
                <ScoreBar label="Keywords" score={result.scores.keywords} />
                <ScoreBar label="Completeness" score={result.scores.completeness} />
              </div>
            )}

            {/* Headline */}
            {result.headline && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">Headline Optimization</h3>
                <div className="space-y-2">
                  <div><span className="text-xs text-muted-foreground">Current:</span><p className="text-sm text-foreground">{result.headline.current}</p></div>
                  <div><span className="text-xs text-accent font-medium">Suggested:</span><p className="text-sm text-foreground font-medium">{result.headline.suggested}</p></div>
                  <p className="text-xs text-muted-foreground">{result.headline.feedback}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">About Section</h3>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{result.summary.feedback}</p>
                  <div className="p-3 rounded-md bg-accent/5 border border-accent/20">
                    <span className="text-xs text-accent font-medium block mb-1">Suggested About:</span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{result.summary.suggested}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid gap-4 md:grid-cols-2">
              {result.strengths?.length > 0 && (
                <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Strengths</h3>
                  <ul className="space-y-1">{result.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
                </div>
              )}
              {result.weaknesses?.length > 0 && (
                <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" /> Weaknesses</h3>
                  <ul className="space-y-1">{result.weaknesses.map((w: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {w}</li>)}</ul>
                </div>
              )}
            </div>

            {/* Quick Wins */}
            {result.quickWins?.length > 0 && (
              <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-warning" /> Quick Wins</h3>
                <ul className="space-y-1">{result.quickWins.map((q: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {q}</li>)}</ul>
              </div>
            )}

            {/* Missing Keywords */}
            {result.missingKeywords?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((k: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Issues */}
            {result.experienceIssues?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Experience Section Issues</h3>
                <div className="space-y-3">
                  {result.experienceIssues.map((e: any, i: number) => (
                    <div key={i} className="p-3 rounded-md bg-muted/50">
                      <p className="text-sm font-medium text-foreground">{e.section}</p>
                      <p className="text-xs text-destructive mt-0.5">{e.issue}</p>
                      <p className="text-xs text-accent mt-0.5">Fix: {e.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Strategy */}
            {result.contentStrategy && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Lightbulb className="w-4 h-4 text-warning" /> Content Strategy</h3>
                {result.contentStrategy.postIdeas?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Post Ideas</p>
                    <ul className="space-y-1">{result.contentStrategy.postIdeas.map((p: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {p}</li>)}</ul>
                  </div>
                )}
                {result.contentStrategy.engagementTips?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Engagement Tips</p>
                    <ul className="space-y-1">{result.contentStrategy.engagementTips.map((t: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {t}</li>)}</ul>
                  </div>
                )}
                {result.contentStrategy.networkingAdvice?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Networking</p>
                    <ul className="space-y-1">{result.contentStrategy.networkingAdvice.map((n: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {n}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* SSI Estimate */}
            {result.ssiEstimate && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><Target className="w-4 h-4 text-technical" /> SSI Score Estimate</h3>
                  <span className="text-2xl font-bold text-technical">{result.ssiEstimate.score}/100</span>
                </div>
                {result.ssiEstimate.breakdown && (
                  <>
                    <ScoreBar label="Professional Brand" score={result.ssiEstimate.breakdown.professionalBrand} max={25} />
                    <ScoreBar label="Find Right People" score={result.ssiEstimate.breakdown.rightPeople} max={25} />
                    <ScoreBar label="Engage with Insights" score={result.ssiEstimate.breakdown.engageInsights} max={25} />
                    <ScoreBar label="Build Relationships" score={result.ssiEstimate.breakdown.buildRelationships} max={25} />
                  </>
                )}
                {result.ssiEstimate.tips?.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-foreground mb-1">SSI Improvement Tips</p>
                    <ul className="space-y-1">{result.ssiEstimate.tips.map((t: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {t}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LinkedInAnalyzer;
