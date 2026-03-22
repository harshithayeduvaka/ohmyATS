import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Copy, Check, Mail, Linkedin } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ColdOutreach = () => {
  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [tone, setTone] = useState<"professional" | "casual" | "bold">("professional");
  const [language, setLanguage] = useState<"english" | "french">("english");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!recipientName.trim() || !companyName.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cold-outreach", {
        body: { cv: cv.trim() || undefined, jd: jd.trim() || undefined, recipientName, recipientRole, companyName, channel, tone, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate outreach", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="sm" onClick={() => copyText(text, field)}>
      {copiedField === field ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cold Outreach Generator</h1>
          <p className="text-xs text-muted-foreground">Craft personalized cold emails & LinkedIn messages</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Language, Channel & Tone */}
        <div className="flex gap-3 flex-wrap">
          <LanguageSelector value={language} onChange={setLanguage} />
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setChannel("email")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${channel === "email" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <Mail className="w-4 h-4" /> Email
            </button>
            <button onClick={() => setChannel("linkedin")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${channel === "linkedin" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <Linkedin className="w-4 h-4" /> LinkedIn
            </button>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["professional", "casual", "bold"] as const).map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tone === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Info */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Recipient Name *</label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Recipient Role</label>
            <Input value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)} placeholder="Engineering Manager" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Company *</label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Google" />
          </div>
        </div>

        {/* Optional Context */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Your CV (optional)</label>
            <Textarea value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Paste your CV for better personalization..." className="min-h-[120px] text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Job Description (optional)</label>
            <Textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the JD to align your message..." className="min-h-[120px] text-sm" />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={!recipientName.trim() || !companyName.trim() || loading} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : `Generate ${channel === "email" ? "Cold Email" : "LinkedIn Message"}`}
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Subject (email only) */}
            {channel === "email" && result.subject && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-sm">Subject Line</h3>
                  <CopyBtn text={result.subject} field="subject" />
                </div>
                <p className="text-sm text-foreground font-medium">{result.subject}</p>
              </div>
            )}

            {/* Connection Note (LinkedIn only) */}
            {channel === "linkedin" && result.connectionNote && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-sm">Connection Request Note</h3>
                  <CopyBtn text={result.connectionNote} field="connectionNote" />
                </div>
                <p className="text-sm text-muted-foreground">{result.connectionNote}</p>
              </div>
            )}

            {/* Main Message */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground text-sm">Message</h3>
                <CopyBtn text={result.message} field="message" />
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.message}</p>
            </div>

            {/* Follow-up */}
            {result.followUp && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-sm">Follow-up (5 days later)</h3>
                  <CopyBtn text={result.followUp} field="followUp" />
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.followUp}</p>
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground text-sm mb-2">Response Rate Tips</h3>
                <ul className="space-y-1">
                  {result.tips.map((t: string, i: number) => (
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

export default ColdOutreach;
