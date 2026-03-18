import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, History, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

interface ResumeVersion {
  id: string;
  title: string;
  cv_text: string;
  jd_text: string | null;
  overall_score: number | null;
  scan_result: any;
  created_at: string;
}

const ResumeVersions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCv, setNewCv] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchVersions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error(error);
    else setVersions((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVersions();
  }, [user]);

  const handleSave = async () => {
    if (!user || !newCv.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("resume_versions").insert({
      user_id: user.id,
      title: newTitle.trim() || "Untitled CV",
      cv_text: newCv,
    });
    if (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "CV version saved!" });
      setShowAdd(false);
      setNewTitle("");
      setNewCv("");
      fetchVersions();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("resume_versions").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      setVersions((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const scoreTrend = (idx: number) => {
    if (idx >= versions.length - 1) return null;
    const current = versions[idx].overall_score;
    const prev = versions[idx + 1].overall_score;
    if (current == null || prev == null) return null;
    const diff = current - prev;
    if (diff > 0) return { icon: TrendingUp, color: "text-accent", diff: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: "text-destructive", diff: `${diff}` };
    return { icon: Minus, color: "text-muted-foreground", diff: "0" };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-lg font-bold text-foreground">Resume Version History</h1>
        </header>
        <div className="flex items-center justify-center h-[60vh] text-center px-8">
          <div>
            <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sign in to save and track your resume versions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Resume Version History</h1>
            <p className="text-xs text-muted-foreground">Track and compare your CV improvements</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Save New Version
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {showAdd && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 animate-fade-in-up">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Version name, e.g. 'v3 — added metrics'" />
            <Textarea value={newCv} onChange={(e) => setNewCv(e.target.value)} placeholder="Paste your CV text..." className="min-h-[160px] resize-none font-mono text-sm" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !newCv.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No versions saved yet. Save your first CV to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v, i) => {
              const trend = scoreTrend(i);
              return (
                <div key={v.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{v.title}</h3>
                        {v.overall_score != null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${v.overall_score >= 70 ? "bg-accent/15 text-accent" : v.overall_score >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                            {v.overall_score}/100
                          </span>
                        )}
                        {trend && (
                          <span className={`text-xs font-medium ${trend.color} flex items-center gap-0.5`}>
                            <trend.icon className="w-3 h-3" /> {trend.diff}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{v.cv_text.substring(0, 100)}...</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeVersions;
