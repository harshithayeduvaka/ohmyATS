import { useState } from "react";
import { Activity, Play, Loader2, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EVAL_FIXTURES, FEATURE_LABELS, type EvalFeature } from "@/lib/evalFixtures";

interface Accuracy {
  atsMae: number;
  atsInBandRate: number;
  keywordF1: number;
  keywordPrecision: number;
  keywordRecall: number;
  groundingPassRate: number;
  bannedPhraseRate: number;
  ensembleCount?: number;
  ensembleInBandRate?: number;
  ensembleConsistency?: number;
  overall: number;
}

interface EvalReport {
  ranAt: string;
  fixtureCount: number;
  accuracy: Accuracy;
  byFeature?: Array<{ feature: string; fixtureCount: number; accuracy: Accuracy }>;
  fixtures: Array<{
    id: string;
    label: string;
    feature?: string;
    ats: { predicted: number; band: [number, number]; inBand: boolean; error: number };
    keywordExtraction: { predicted: string[]; expected: string[]; precision: number; recall: number; f1: number };
    grounding: { passed: boolean; issues: string[] };
    bannedPhrases: { passed: boolean; hits: string[] };
    ensemble?: {
      meta: { models: string[]; scores: number[]; median: number; spread: number; agreement: number; consistent: boolean };
      band: [number, number];
      inBand: boolean;
    };
  }>;
}


const Eval = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<EvalReport | null>(null);
  const [withEnsemble, setWithEnsemble] = useState(true);

  const run = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-eval", {
        body: { fixtures: EVAL_FIXTURES, runEnsemble: withEnsemble },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setReport(data as EvalReport);
    } catch (err) {
      toast({
        title: "Eval failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Sign in required</h1>
          <p className="text-sm text-muted-foreground">The accuracy dashboard is owner-only.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Accuracy Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Runs the pipeline against {EVAL_FIXTURES.length} labelled fixtures and measures precision/recall/MAE.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className="accent-primary"
                checked={withEnsemble}
                onChange={(e) => setWithEnsemble(e.target.checked)}
              />
              3-model ensemble
            </label>
          <Button onClick={run} disabled={running} size="lg">
            {running ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Running…</> : <><Play className="w-4 h-4 mr-2" /> Run eval</>}
          </Button>
          </div>
        </header>

        {!report && !running && (
          <Card className="p-12 text-center border-dashed">
            <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Click <strong>Run eval</strong> to baseline current pipeline accuracy.
              <br />Target: overall ≥ 93.
            </p>
          </Card>
        )}

        {report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Metric label="Overall score" value={`${report.accuracy.overall}`} suffix="/100" highlight={report.accuracy.overall >= 93} />
              <Metric label="ATS in-band" value={`${(report.accuracy.atsInBandRate * 100).toFixed(0)}%`} sub={`MAE ${report.accuracy.atsMae}`} />
              <Metric label="Keyword F1" value={report.accuracy.keywordF1.toFixed(2)} sub={`P ${report.accuracy.keywordPrecision.toFixed(2)} · R ${report.accuracy.keywordRecall.toFixed(2)}`} />
              <Metric label="Grounding pass" value={`${(report.accuracy.groundingPassRate * 100).toFixed(0)}%`} sub={`Banned: ${(report.accuracy.bannedPhraseRate * 100).toFixed(0)}%`} />
              {(report.accuracy.ensembleCount ?? 0) > 0 && (
                <Metric
                  label="Ensemble in-band"
                  value={`${((report.accuracy.ensembleInBandRate ?? 0) * 100).toFixed(0)}%`}
                  sub={`Consistency ${((report.accuracy.ensembleConsistency ?? 0) * 100).toFixed(0)}% · ${report.accuracy.ensembleCount} scored`}
                />
              )}
            </div>

            {report.byFeature && report.byFeature.length > 0 && (
              <Card className="p-4 mb-4 overflow-x-auto">
                <h2 className="text-sm font-semibold mb-3">Per-feature accuracy</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide text-left">
                      <th className="py-1 pr-3 font-medium">Feature</th>
                      <th className="py-1 pr-3 font-medium">Fixtures</th>
                      <th className="py-1 pr-3 font-medium">Overall</th>
                      <th className="py-1 pr-3 font-medium">ATS in-band</th>
                      <th className="py-1 pr-3 font-medium">KW F1</th>
                      <th className="py-1 pr-3 font-medium">Grounding</th>
                      <th className="py-1 pr-3 font-medium">Ensemble</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byFeature
                      .slice()
                      .sort((a, b) => a.accuracy.overall - b.accuracy.overall)
                      .map((row) => (
                        <tr key={row.feature} className="border-t border-border">
                          <td className="py-2 pr-3 font-medium">
                            {FEATURE_LABELS[row.feature as EvalFeature] ?? row.feature}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">{row.fixtureCount}</td>
                          <td className={`py-2 pr-3 font-mono-tech font-semibold ${row.accuracy.overall >= 93 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {row.accuracy.overall}
                          </td>
                          <td className="py-2 pr-3 font-mono-tech">{(row.accuracy.atsInBandRate * 100).toFixed(0)}%</td>
                          <td className="py-2 pr-3 font-mono-tech">{row.accuracy.keywordF1.toFixed(2)}</td>
                          <td className="py-2 pr-3 font-mono-tech">{(row.accuracy.groundingPassRate * 100).toFixed(0)}%</td>
                          <td className="py-2 pr-3 font-mono-tech text-muted-foreground">
                            {(row.accuracy.ensembleCount ?? 0) > 0
                              ? `${((row.accuracy.ensembleInBandRate ?? 0) * 100).toFixed(0)}% / ${((row.accuracy.ensembleConsistency ?? 0) * 100).toFixed(0)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Card>
            )}


            <Card className="p-4 mb-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Per-fixture results
                <span className="text-xs text-muted-foreground font-normal">({report.fixtureCount} fixtures)</span>
              </h2>
              <div className="space-y-2">
                {report.fixtures.map((f) => (
                  <div key={f.id} className="border border-border rounded-md p-3 text-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-semibold">{f.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{f.id}</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <Badge label="ATS" ok={f.ats.inBand} detail={`${f.ats.predicted} vs ${f.ats.band[0]}-${f.ats.band[1]}`} />
                        <Badge label="KW F1" ok={f.keywordExtraction.f1 >= 0.7} detail={f.keywordExtraction.f1.toFixed(2)} />
                        <Badge label="Ground" ok={f.grounding.passed} />
                        <Badge label="Banned" ok={f.bannedPhrases.passed} />
                        {f.ensemble && (
                          <Badge
                            label="Ensemble"
                            ok={f.ensemble.inBand && f.ensemble.meta.consistent}
                            detail={`${f.ensemble.meta.median} vs ${f.ensemble.band[0]}-${f.ensemble.band[1]} · [${f.ensemble.meta.scores.join(", ")}] spread ${f.ensemble.meta.spread}`}
                          />
                        )}
                      </div>
                    </div>
                    {(f.grounding.issues.length > 0 || f.bannedPhrases.hits.length > 0) && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        {f.grounding.issues.map((i, idx) => <div key={idx}>• {i}</div>)}
                        {f.bannedPhrases.hits.map((i, idx) => <div key={`b${idx}`}>• {i}</div>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <p className="text-xs text-muted-foreground">
              Baseline run at {new Date(report.ranAt).toLocaleString()}. Deterministic-only scoring — the full AI pipeline
              will be wired in step 2 (scan-cv) and the number will move.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const Metric = ({ label, value, suffix, sub, highlight }: { label: string; value: string; suffix?: string; sub?: string; highlight?: boolean }) => (
  <Card className={`p-4 ${highlight ? "border-primary/60 bg-primary/5" : ""}`}>
    <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className="text-2xl font-bold mt-1">
      {value}<span className="text-sm text-muted-foreground font-normal">{suffix}</span>
    </div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </Card>
);

const Badge = ({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono-tech ${ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {label}{detail ? `: ${detail}` : ""}
  </span>
);

export default Eval;
