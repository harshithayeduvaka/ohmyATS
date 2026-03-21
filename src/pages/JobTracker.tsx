import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ExternalLink, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Alumni / Warm Contact", "Founder / CEO", "Hiring Manager", "Recruiter", "Team Member"];
const JOB_TYPES = ["Internship", "CDI", "CDD", "Freelance"];
const STATUSES = ["Submitted", "Reviewed", "Interview", "Awaiting Revert", "LinkedIn Connection Sent", "Outreach Sent", "Replied", "Follow Up Sent", "Rejected", "Closed"];

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
}

const emptyForm = {
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
  connection_sent_date: "",
  applied_date: new Date().toISOString().split("T")[0],
  status: "Submitted",
  notes: "",
};

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

const JobTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<JobApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (user) fetchApps();
    else setLoading(false);
  }, [user]);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setApps(data as unknown as JobApp[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.company.trim() || !form.role_title.trim()) {
      toast({ title: "Company and Role are required", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      user_id: user.id,
      connection_sent_date: form.connection_sent_date || null,
      applied_date: form.applied_date || null,
    };

    if (editingId) {
      const { error } = await supabase.from("job_applications").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Failed to update", variant: "destructive" }); return; }
      toast({ title: "Application updated" });
    } else {
      const { error } = await supabase.from("job_applications").insert(payload);
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
      toast({ title: "Application added" });
    }

    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(false);
    fetchApps();
  };

  const handleEdit = (app: JobApp) => {
    setForm({
      category: app.category || "Hiring Manager",
      company: app.company,
      role_title: app.role_title,
      jd_link: app.jd_link || "",
      location: app.location || "",
      website: app.website || "",
      source: app.source || "",
      job_type: app.job_type || "CDI",
      contact_name: app.contact_name || "",
      contact_role: app.contact_role || "",
      contact_linkedin: app.contact_linkedin || "",
      contact_email: app.contact_email || "",
      linkedin_message: app.linkedin_message || "",
      connection_sent_date: app.connection_sent_date || "",
      applied_date: app.applied_date || "",
      status: app.status || "Submitted",
      notes: app.notes || "",
    });
    setEditingId(app.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("job_applications").delete().eq("id", id);
    setApps((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Application deleted" });
  };

  const filtered = filterStatus === "all" ? apps : apps.filter((a) => a.status === filterStatus);

  const counts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
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

        {/* Add button */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Application</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Application</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Company *</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>JD Link</Label>
                <Input value={form.jd_link} onChange={(e) => setForm({ ...form, jd_link: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="LinkedIn, Indeed..." />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Applied Date</Label>
                <Input type="date" value={form.applied_date} onChange={(e) => setForm({ ...form, applied_date: e.target.value })} />
              </div>

              <div className="col-span-full border-t border-border pt-4 mt-2">
                <p className="text-sm font-semibold text-foreground mb-3">Contact Details</p>
              </div>
              <div className="space-y-1.5">
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Role</Label>
                <Input value={form.contact_role} onChange={(e) => setForm({ ...form, contact_role: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact LinkedIn</Label>
                <Input value={form.contact_linkedin} onChange={(e) => setForm({ ...form, contact_linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn Message</Label>
                <Textarea value={form.linkedin_message} onChange={(e) => setForm({ ...form, linkedin_message: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Connection Sent Date</Label>
                <Input type="date" value={form.connection_sent_date} onChange={(e) => setForm({ ...form, connection_sent_date: e.target.value })} />
              </div>

              <div className="col-span-full space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); }}>Cancel</Button>
              <Button onClick={handleSave}><Check className="w-4 h-4 mr-1" /> {editingId ? "Update" : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table */}
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">{apps.length === 0 ? "No applications yet. Add your first one!" : "No applications match this filter."}</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {app.company}
                        {app.website && <a href={app.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" /></a>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {app.role_title}
                        {app.jd_link && <a href={app.jd_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" /></a>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{app.location || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{app.job_type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{app.category}</TableCell>
                    <TableCell>
                      {app.contact_name ? (
                        <div className="text-xs">
                          {app.contact_linkedin ? (
                            <a href={app.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{app.contact_name}</a>
                          ) : app.contact_name}
                          {app.contact_role && <span className="text-muted-foreground block">{app.contact_role}</span>}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{app.applied_date || "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[app.status] || "bg-muted text-muted-foreground"}`}>
                        {app.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(app)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(app.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobTracker;
