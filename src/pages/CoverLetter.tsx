import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, Copy, Download, Loader2 } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

interface CoverLetterResult {
  coverLetter: string;
  keyHighlights: string[];
  tone: string;
  wordCount: number;
}

const CoverLetter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [language, setLanguage] = useState<"english" | "french">("english");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);

  const handleGenerate = async () => {
    if (!cv.trim() || !jd.trim()) {
      toast({ title: "Both CV and Job Description are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
        body: { cv, jd, companyName, roleName, language },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.coverLetter);
      toast({ title: "Copied to clipboard!" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Cover Letter Generator</h1>
          <p className="text-xs text-muted-foreground">AI-tailored cover letters from your CV + JD</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 grid lg:grid-cols-2 gap-6">
        {/* Input side */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Company Name</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Google" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Role</label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Product Manager" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <FileText className="w-4 h-4 text-technical" /> Your CV
            </label>
            <Textarea
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder="Paste your full CV text here..."
              className="min-h-[200px] resize-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <FileText className="w-4 h-4 text-accent" /> Job Description
            </label>
            <Textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the target job description..."
              className="min-h-[200px] resize-none font-mono text-sm"
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading || !cv.trim() || !jd.trim()} className="w-full">
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating...</span>
            ) : (
              "Generate Cover Letter"
            )}
          </Button>
        </div>

        {/* Result side */}
        <div>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Your Cover Letter</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-lg border border-border bg-card">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.coverLetter}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Tone: {result.tone}</span>
                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{result.wordCount} words</span>
              </div>

              {result.keyHighlights?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Matches Used</h3>
                  <ul className="space-y-1">
                    {result.keyHighlights.map((h, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Your generated cover letter will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
