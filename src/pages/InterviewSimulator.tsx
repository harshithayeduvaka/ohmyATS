import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare, Loader2, Send, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  whyAsked: string;
  tips: string[];
}

interface EvalResult {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  tips: string[];
}

const InterviewSimulator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [language, setLanguage] = useState<"english" | "french">("english");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResults, setEvalResults] = useState<Record<number, EvalResult>>({});
  const [showTips, setShowTips] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

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
      setCurrentQ(0);
      setStarted(true);
      setEvalResults({});
      setAnswer("");
    } catch (err: any) {
      toast({ title: "Failed to generate questions", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: {
          cv,
          jd,
          role,
          question: questions[currentQ].question,
          answer,
          language,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setEvalResults((prev) => ({ ...prev, [currentQ]: data }));
    } catch (err: any) {
      toast({ title: "Evaluation failed", description: err.message, variant: "destructive" });
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setAnswer("");
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

  const avgScore = () => {
    const scores = Object.values(evalResults).map((r) => r.score);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Interview Simulator</h1>
            <p className="text-xs text-muted-foreground">Practice with AI-generated questions & get evaluated</p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          <LanguageSelector value={language} onChange={setLanguage} />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Role Title</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Product Manager" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Job Description *</label>
            <Textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the JD..." className="min-h-[160px] resize-none font-mono text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Your CV (optional — enables personalized evaluation)</label>
            <Textarea value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Paste your CV for tailored feedback..." className="min-h-[160px] resize-none font-mono text-sm" />
          </div>
          <Button onClick={handleGenerate} disabled={loading || !jd.trim()} className="w-full">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating questions...</span> : "Start Interview Practice"}
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const evaluation = evalResults[currentQ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setStarted(false)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Setup
          </Button>
          <span className="text-sm text-muted-foreground">
            Question {currentQ + 1} of {questions.length}
          </span>
        </div>
        {avgScore() && (
          <span className="text-sm font-semibold text-foreground">
            Avg Score: {avgScore()}/10
          </span>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Progress */}
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentQ(i); setAnswer(""); }}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentQ
                  ? "bg-technical"
                  : evalResults[i]
                  ? evalResults[i].score >= 7 ? "bg-accent" : evalResults[i].score >= 4 ? "bg-warning" : "bg-destructive"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Question card */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${diffBadge(q.difficulty)}`}>{q.difficulty}</span>
            <span className="text-[10px] uppercase text-muted-foreground px-2 py-0.5 rounded bg-muted">{q.category}</span>
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed">{q.question}</p>
          <button
            onClick={() => setShowTips(showTips === currentQ ? null : currentQ)}
            className="text-xs text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1"
          >
            {showTips === currentQ ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showTips === currentQ ? "Hide" : "Show"} tips & what they're assessing
          </button>
          {showTips === currentQ && (
            <div className="mt-3 text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>Assessing:</strong> {q.whyAsked}</p>
              {q.tips.map((t, i) => <p key={i}>• {t}</p>)}
            </div>
          )}
        </div>

        {/* Answer input */}
        {!evaluation ? (
          <div className="space-y-3">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer as if you're in the interview..."
              className="min-h-[140px] resize-none text-sm"
            />
            <Button onClick={handleSubmitAnswer} disabled={evaluating || !answer.trim()} className="w-full gap-2">
              {evaluating ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><Send className="w-4 h-4" /> Submit Answer</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up">
            {/* Score */}
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${evaluation.score >= 7 ? "text-accent" : evaluation.score >= 4 ? "text-warning" : "text-destructive"}`}>
                {evaluation.score}/10
              </div>
              <p className="text-sm text-foreground">{evaluation.verdict}</p>
            </div>

            {/* Strengths/Weaknesses */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <h4 className="text-xs font-semibold text-accent mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Strengths</h4>
                {evaluation.strengths.map((s, i) => <p key={i} className="text-xs text-foreground">• {s}</p>)}
              </div>
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <h4 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1"><XCircle className="w-3 h-3" /> Weaknesses</h4>
                {evaluation.weaknesses.map((w, i) => <p key={i} className="text-xs text-foreground">• {w}</p>)}
              </div>
            </div>

            {/* Ideal answer */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Ideal Answer</h4>
              <p className="text-sm text-foreground leading-relaxed">{evaluation.idealAnswer}</p>
            </div>

            {/* Tips */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Tips</h4>
              {evaluation.tips.map((t, i) => <p key={i} className="text-xs text-foreground">• {t}</p>)}
            </div>

            {currentQ < questions.length - 1 && (
              <Button onClick={nextQuestion} variant="outline" className="w-full">
                Next Question →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSimulator;
