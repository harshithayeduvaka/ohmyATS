import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ExternalLink, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Alumni / Warm Contact", "Founder / CEO", "Hiring Manager", "Recruiter", "Team Member"];
const JOB_TYPES = ["Internship", "CDI", "CDD", "Freelance"];
const STATUSES = ["Submitted", "Reviewed", "Interview", "Awaiting Revert", "LinkedIn Connection Sent", "Outreach Sent", "Replied", "Follow Up Sent", "Rejected", "Closed"];

const statusColor: Record<string, string> = {
  Submitted: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Reviewed: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  Interview: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Awaiting Revert": "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "LinkedIn Connection Sent": "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "Outreach Sent": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Replied: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "Follow Up Sent": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  Rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
  Closed: "bg-muted text-muted-foreground",
};

interface JobApp {
  id: string;
  category: string;
  company: string;
  role_title: string;
  jd_link: string;
  location: string;
  website: string;
  source: string;
  job_type: string;
  contact_name: string;
  contact_role: string;
  contact_linkedin: string;
  contact_email: string;
  linkedin_message: string;
  connection_sent_date: string | null;
  applied_date: string | null;
  status: string;
  notes: string;
  created_at: string;
  _dirty?: boolean;
}

const emptyRow = (): Partial<JobApp> => ({
  category: "Hiring Manager",
  company: "",
  role_title: "",
  jd_link: "",
  location: "",
  website: "",
  source: "",
  job_type: "CDI",
  contact_name: "",
  contact_role: "",
  contact_linkedin: "",
  contact_email: "",
  linkedin_message: "",
  connection_sent_date: null,
  applied_date: new Date().toISOString().split("T")[0],
  status: "Submitted",
  notes: "",
});

const InlineSelect = ({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-8 text-xs bg-transparent border-0 focus:ring-1 focus:ring-ring rounded px-1 py-0 w-full text-foreground"
  >
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

const JobTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<JobApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (user) fetchApps();
    else setLoading(false);
  }, [user]);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("job_applications").select("*").order("created_at", { ascending: false });
    if (!error && data) setApps(data as unknown as JobApp[]);
    setLoading(false);
  };

  const addRow = () => {
    const tempId = `new-${Date.now()}`;
    setApps((prev) => [{ ...emptyRow(), id: tempId, created_at: new Date().toISOString(), _dirty: true } as JobApp, ...prev]);
  };

  const updateCell = useCallback((id: string, field: keyof JobApp, value: string) => {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value, _dirty: true } : a));
  }, []);

  const saveRow = async (app: JobApp) => {
    if (!user || !app.company.trim() || !app.role_title.trim()) {
      toast({ title: "Company and Role are required", variant: "destructive" });
      return;
    }
    const { id, _dirty, created_at, ...rest } = app;
    const payload = {
      ...rest,
      user_id: user.id,
      connection_sent_date: rest.connection_sent_date || null,
      applied_date: rest.applied_date || null,
    };

    if (id.startsWith("new-")) {
      const { data, error } = await supabase.from("job_applications").insert(payload).select().single();
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
      setApps((prev) => prev.map((a) => a.id === id ? { ...data, _dirty: false } as unknown as JobApp : a));
    } else {
      const { error } = await supabase.from("job_applications").update(payload).eq("id", id);
      if (error) { toast({ title: "Failed to update", variant: "destructive" }); return; }
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, _dirty: false } : a));
    }
    toast({ title: "Saved!" });
  };

  const deleteRow = async (id: string) => {
    if (id.startsWith("new-")) {
      setApps((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    await supabase.from("job_applications").delete().eq("id", id);
    setApps((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Application deleted" });
  };

  const filtered = filterStatus === "all" ? apps : apps.filter((a) => a.status === filterStatus);
  const counts = apps.reduce<Record<string, number>>((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Sign in to track your job applications.</p>
        <AuthButton />
        <Link to="/" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Job Application Tracker</h1>
            <p className="text-sm text-muted-foreground">{apps.length} application{apps.length !== 1 ? "s" : ""} tracked</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`cursor-pointer ${filterStatus === "all" ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setFilterStatus("all")}>
            All ({apps.length})
          </Badge>
          {STATUSES.map((s) => (
            <Badge key={s} variant="outline" className={`cursor-pointer ${filterStatus === s ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setFilterStatus(s)}>
              {s} ({counts[s] || 0})
            </Badge>
          ))}
        </div>

        <Button onClick={addRow}><Plus className="w-4 h-4 mr-2" /> Add Application</Button>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">{apps.length === 0 ? "No applications yet. Add your first one!" : "No applications match this filter."}</p>
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[130px]">Company</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[130px]">Role</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[90px]">Location</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[90px]">Type</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">Category</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">Source</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[90px]">JD Link</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[90px]">Website</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">Contact</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">C. Role</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">C. Email</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[60px]">C. LI</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[90px]">Applied</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">Notes</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className={`border-b border-border hover:bg-muted/30 ${app._dirty ? "bg-primary/5" : ""}`}>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.company} onChange={(e) => updateCell(app.id, "company", e.target.value)} placeholder="Company *" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.role_title} onChange={(e) => updateCell(app.id, "role_title", e.target.value)} placeholder="Role *" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.location} onChange={(e) => updateCell(app.id, "location", e.target.value)} placeholder="Location" /></td>
                    <td className="px-1 py-1"><InlineSelect value={app.job_type} options={JOB_TYPES} onChange={(v) => updateCell(app.id, "job_type", v)} /></td>
                    <td className="px-1 py-1"><InlineSelect value={app.category} options={CATEGORIES} onChange={(v) => updateCell(app.id, "category", v)} /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.source} onChange={(e) => updateCell(app.id, "source", e.target.value)} placeholder="Source" /></td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.jd_link} onChange={(e) => updateCell(app.id, "jd_link", e.target.value)} placeholder="JD URL" />
                        {app.jd_link && <a href={app.jd_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary flex-shrink-0" /></a>}
                      </div>
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.website} onChange={(e) => updateCell(app.id, "website", e.target.value)} placeholder="Website" />
                        {app.website && <a href={app.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary flex-shrink-0" /></a>}
                      </div>
                    </td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.contact_name} onChange={(e) => updateCell(app.id, "contact_name", e.target.value)} placeholder="Name" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.contact_role} onChange={(e) => updateCell(app.id, "contact_role", e.target.value)} placeholder="Role" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.contact_email} onChange={(e) => updateCell(app.id, "contact_email", e.target.value)} placeholder="Email" /></td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1 w-16" value={app.contact_linkedin} onChange={(e) => updateCell(app.id, "contact_linkedin", e.target.value)} placeholder="LI URL" />
                        {app.contact_linkedin && <a href={app.contact_linkedin} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-primary flex-shrink-0" /></a>}
                      </div>
                    </td>
                    <td className="px-1 py-1"><Input type="date" className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.applied_date || ""} onChange={(e) => updateCell(app.id, "applied_date", e.target.value)} /></td>
                    <td className="px-1 py-1"><InlineSelect value={app.status} options={STATUSES} onChange={(v) => updateCell(app.id, "status", v)} /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={app.notes} onChange={(e) => updateCell(app.id, "notes", e.target.value)} placeholder="Notes" /></td>
                    <td className="px-1 py-1">
                      <div className="flex gap-1">
                        {app._dirty && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => saveRow(app)}><Save className="w-3.5 h-3.5" /></Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteRow(app.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobTracker;
