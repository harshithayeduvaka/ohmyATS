import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const importanceBadge = (importance: string) => {
  const styles: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-warning/10 text-warning border-warning/20",
    medium: "bg-technical/10 text-technical border-technical/20",
  };
  return styles[importance] || styles.medium;
};

const KeywordAnalyzer = () => {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("extract-keywords", {
        body: { jd },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to extract keywords", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyAllKeywords = () => {
    if (!result) return;
    const all = [
      ...(result.hardSkills || []).map((k: any) => k.keyword),
      ...(result.softSkills || []).map((k: any) => k.keyword),
      ...(result.tools || []).map((k: any) => k.keyword),
      ...(result.certifications || []).map((k: any) => k.keyword),
      ...(result.industryTerms || []).map((k: any) => k.keyword),
    ].join(", ");
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderKeywordGroup = (title: string, items: any[], showCategory = false) => {
    if (!items?.length) return null;
    return (
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold text-foreground mb-3">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((item: any, i: number) => (
            <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${importanceBadge(item.importance)}`}>
              {item.keyword}
              {showCategory && item.category && <span className="text-[10px] opacity-60">({item.category})</span>}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Keyword Analyzer</h1>
          <p className="text-xs text-muted-foreground">Extract ATS keywords from any job description</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Job Description</label>
          <Textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description to extract keywords..." className="min-h-[180px] text-sm" />
        </div>

        <Button onClick={handleExtract} disabled={!jd.trim() || loading} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting Keywords...</> : "Extract Keywords"}
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copyAllKeywords}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Copy All Keywords
              </Button>
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-1">Ideal Candidate Profile</h3>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>
            )}

            {renderKeywordGroup("Hard Skills", result.hardSkills, true)}
            {renderKeywordGroup("Soft Skills", result.softSkills)}
            {renderKeywordGroup("Tools & Technologies", result.tools)}
            {renderKeywordGroup("Certifications", result.certifications)}
            {renderKeywordGroup("Industry Terms", result.industryTerms)}

            {/* Action Verbs */}
            {result.actionVerbs?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Action Verbs to Use</h3>
                <div className="flex flex-wrap gap-2">
                  {result.actionVerbs.map((v: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/20">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Tips */}
            {result.resumeTips?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-2">Resume Tips</h3>
                <ul className="space-y-1.5">
                  {result.resumeTips.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {t}</li>
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

export default KeywordAnalyzer;
