import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, HelpCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

interface QAItem {
  question: string;
  category: string;
  difficulty: string;
  whyAsked: string;
  suggestedAnswer?: string;
  tips: string[];
}

const InterviewQA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySector, setCompanySector] = useState("");
  const [language, setLanguage] = useState<"english" | "french">("english");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!jd.trim()) {
      toast({ title: "Job Description is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-questions", {
        body: { cv, jd, role, mode: "generate", language },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setQuestions(data.questions || []);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const diffBadge = (d: string) => {
    const colors: Record<string, string> = {
      easy: "bg-accent/15 text-accent",
      medium: "bg-warning/15 text-warning",
      hard: "bg-destructive/15 text-destructive",
    };
    return colors[d] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Interview Q&A Bank</h1>
          <p className="text-xs text-muted-foreground">Get likely questions + suggested answers from your CV</p>
        </div>
      </header>

      {questions.length === 0 ? (
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          <LanguageSelector value={language} onChange={setLanguage} />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Role Title</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Marketing Director" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Job Description *</label>
            <Textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the JD..." className="min-h-[160px] resize-none font-mono text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Your CV (strongly recommended for tailored answers)</label>
            <Textarea value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Paste your CV..." className="min-h-[160px] resize-none font-mono text-sm" />
          </div>
          <Button onClick={handleGenerate} disabled={loading || !jd.trim()} className="w-full">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating Q&A...</span> : "Generate Interview Q&A"}
          </Button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{questions.length} questions generated for <strong>{role || "this role"}</strong></p>
            <Button variant="outline" size="sm" onClick={() => setQuestions([])}>New Q&A</Button>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground mt-0.5 w-6">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${diffBadge(q.difficulty)}`}>{q.difficulty}</span>
                    <span className="text-[10px] uppercase text-muted-foreground px-2 py-0.5 rounded bg-muted">{q.category}</span>
                  </div>
                </div>
                {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {expanded === i && (
                <div className="px-4 pb-4 pl-[52px] space-y-3 border-t border-border pt-3">
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">What they're assessing</h4>
                    <p className="text-sm text-foreground">{q.whyAsked}</p>
                  </div>
                  {q.suggestedAnswer && (
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <h4 className="text-[10px] font-semibold uppercase text-accent mb-1">Suggested Answer (from your CV)</h4>
                      <p className="text-sm text-foreground leading-relaxed">{q.suggestedAnswer}</p>
                    </div>
                  )}
                  {q.tips.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Tips</h4>
                      {q.tips.map((t, j) => <p key={j} className="text-xs text-muted-foreground">• {t}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewQA;
