import { useState } from "react";
import { Mic, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import LanguageSelector from "@/components/LanguageSelector";

const ElevatorPitch = () => {
  const { toast } = useToast();
  const [cv, setCv] = useState("");
  const [role, setRole] = useState("");
  const [language, setLanguage] = useState<"english" | "french">("english");
  const [duration, setDuration] = useState<"30s" | "60s" | "90s">("60s");
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!cv.trim()) { toast({ title: "Paste your CV first", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-elevator-pitch", {
        body: { cv, role, language, duration },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setPitch(data.pitch);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Mic className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Elevator Pitch Generator</h1>
            <p className="text-sm text-muted-foreground">Generate a compelling pitch from your CV in seconds</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <LanguageSelector value={language} onChange={setLanguage} />
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Target role (e.g. Data Analyst)" />
            <div className="flex gap-2">
              {(["30s", "60s", "90s"] as const).map((d) => (
                <Button key={d} variant={duration === d ? "default" : "outline"} size="sm" onClick={() => setDuration(d)}>{d}</Button>
              ))}
            </div>
            <Textarea value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Paste your CV..." className="min-h-[250px] text-sm" />
            <Button onClick={generate} disabled={loading || !cv.trim()} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : "Generate Pitch"}
            </Button>
          </div>

          <div>
            {pitch ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Your Elevator Pitch</h2>
                  <Button variant="ghost" size="sm" onClick={copy} className="gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="p-5 rounded-lg border border-border bg-card">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{pitch}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Mic className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Your pitch will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElevatorPitch;
