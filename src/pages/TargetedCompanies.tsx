import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Search, Loader2, ExternalLink, Building2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Company {
  id: string;
  company_name: string;
  careers_url?: string | null;
  website?: string | null;
  notes?: string | null;
  profession?: string | null;
  preferred_location?: string | null;
  preferred_job_type?: string | null;
  preferred_keywords?: string | null;
  last_scanned_at?: string | null;
}

interface JobPosting {
  title: string;
  company: string;
  location?: string;
  jobType?: string;
  url: string;
  snippet?: string;
  postedAt?: string;
  source: "scrape" | "search";
}

const PROFESSIONS = ["Engineering", "Finance", "Marketing", "Consultant", "Legal", "IT", "Sales & Partnerships", "Customer Experience", "G&A", "Product"];
const JOB_TYPES = ["CDI", "CDD", "Internship", "Freelance"];
const RECENCY = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
];

const TargetedCompanies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ company_name: "", careers_url: "", website: "", profession: "", notes: "" });

  // Filters
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [recency, setRecency] = useState<"24h" | "7d" | "30d" | "">("");
  const [keywords, setKeywords] = useState("");
  const [profession, setProfession] = useState("");

  const [searching, setSearching] = useState<string | null>(null);
  const [jobsByCompany, setJobsByCompany] = useState<Record<string, JobPosting[]>>({});

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("targeted_companies").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading companies", description: error.message, variant: "destructive" });
    else setCompanies((data || []) as Company[]);
    setLoading(false);
  };

  const addCompany = async () => {
    if (!form.company_name.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("targeted_companies").insert({
      user_id: user.id,
      company_name: form.company_name.trim(),
      careers_url: form.careers_url.trim() || null,
      website: form.website.trim() || null,
      profession: form.profession || null,
      notes: form.notes.trim() || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setForm({ company_name: "", careers_url: "", website: "", profession: "", notes: "" });
      load();
    }
    setAdding(false);
  };

  const removeCompany = async (id: string) => {
    const { error } = await supabase.from("targeted_companies").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const findJobs = async (c: Company) => {
    setSearching(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("find-jobs", {
        body: {
          companyName: c.company_name,
          careersUrl: c.careers_url,
          website: c.website,
          filters: {
            location: location || undefined,
            jobType: jobType || undefined,
            recency: recency || undefined,
            keywords: keywords || undefined,
            profession: profession || c.profession || undefined,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setJobsByCompany((prev) => ({ ...prev, [c.id]: data.jobs || [] }));
      await supabase.from("targeted_companies").update({ last_scanned_at: new Date().toISOString() }).eq("id", c.id);
      toast({ title: "Search complete", description: `${data.jobs?.length || 0} job(s) found for ${c.company_name}` });
    } catch (e: any) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally {
      setSearching(null);
    }
  };

  const scanAll = async () => {
    for (const c of companies) {
      await findJobs(c);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Sign in to track companies</h2>
          <p className="text-sm text-muted-foreground mb-4">Save your target companies and scan them for fresh job openings.</p>
          <Link to="/" className="text-primary text-sm underline">Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Targeted Companies</h1>
          <p className="text-xs text-muted-foreground">Track companies and scan for recent job postings</p>
        </div>
        <Button onClick={scanAll} disabled={!companies.length || !!searching} variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-1.5" /> Scan all
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Filters */}
        <section className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-md">
          <h2 className="text-sm font-semibold text-foreground mb-3">Job feed filters</h2>
          <div className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Location (Paris, Remote…)" value={location} onChange={(e) => setLocation(e.target.value)} />
            <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Any job type</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={recency} onChange={(e) => setRecency(e.target.value as any)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Any time</option>
              {RECENCY.map((r) => <option key={r.value} value={r.value}>Posted within {r.label}</option>)}
            </select>
            <select value={profession} onChange={(e) => setProfession(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Any profession</option>
              {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <Input placeholder="Keywords (senior, growth…)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
        </section>

        {/* Add company */}
        <section className="p-4 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add a target company</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Company name *" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            <Input placeholder="Careers page URL (best results)" value={form.careers_url} onChange={(e) => setForm({ ...form, careers_url: e.target.value })} />
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <select value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Profession (optional)</option>
              {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2 min-h-[60px]" />
          </div>
          <Button onClick={addCompany} disabled={!form.company_name.trim() || adding} className="mt-3">
            {adding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />} Add company
          </Button>
        </section>

        {/* Companies list */}
        <section className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No targeted companies yet. Add one above to start scanning.</div>
          ) : (
            companies.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> {c.company_name}
                      {c.profession && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{c.profession}</span>}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      {c.careers_url && <a href={c.careers_url} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">Careers <ExternalLink className="w-3 h-3" /></a>}
                      {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">Website <ExternalLink className="w-3 h-3" /></a>}
                      {c.last_scanned_at && <span>Last scan: {new Date(c.last_scanned_at).toLocaleString()}</span>}
                    </div>
                    {c.notes && <p className="text-xs text-muted-foreground mt-2">{c.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => findJobs(c)} disabled={searching === c.id}>
                      {searching === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span className="ml-1.5">Find jobs</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeCompany(c.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {jobsByCompany[c.id] && (
                  <div className="mt-4 border-t border-border pt-3 space-y-2">
                    {jobsByCompany[c.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground">No matching postings found. Try removing filters or add the careers page URL.</p>
                    ) : (
                      jobsByCompany[c.id].map((j, i) => (
                        <a key={i} href={j.url} target="_blank" rel="noreferrer" className="block p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-foreground">{j.title}</div>
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                {j.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location}</span>}
                                {j.jobType && <span className="px-1.5 py-0.5 rounded bg-muted">{j.jobType}</span>}
                                {j.postedAt && <span>{j.postedAt}</span>}
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{j.source === "scrape" ? "Direct" : "Web"}</span>
                              </div>
                              {j.snippet && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.snippet}</p>}
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default TargetedCompanies;
