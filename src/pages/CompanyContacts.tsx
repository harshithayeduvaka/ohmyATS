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

interface Contact {
  id: string;
  company: string;
  industry: string;
  website: string;
  ceo_name: string;
  ceo_email: string;
  ceo_linkedin: string;
  marketing_head_name: string;
  marketing_head_email: string;
  marketing_head_linkedin: string;
  hr_head_name: string;
  hr_head_email: string;
  hr_head_linkedin: string;
  notes: string;
  created_at: string;
  _dirty?: boolean;
}

const emptyContact = (): Partial<Contact> => ({
  company: "",
  industry: "",
  website: "",
  ceo_name: "",
  ceo_email: "",
  ceo_linkedin: "",
  marketing_head_name: "",
  marketing_head_email: "",
  marketing_head_linkedin: "",
  hr_head_name: "",
  hr_head_email: "",
  hr_head_linkedin: "",
  notes: "",
});

const CompanyContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchContacts();
    else setLoading(false);
  }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setContacts(data as unknown as Contact[]);
    setLoading(false);
  };

  const addRow = () => {
    const tempId = `new-${Date.now()}`;
    setContacts((prev) => [{ ...emptyContact(), id: tempId, created_at: new Date().toISOString(), _dirty: true } as Contact, ...prev]);
  };

  const updateCell = useCallback((id: string, field: keyof Contact, value: string) => {
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value, _dirty: true } : c));
  }, []);

  const saveRow = async (contact: Contact) => {
    if (!user || !contact.company.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    const { id, _dirty, created_at, ...rest } = contact;
    const payload = { ...rest, user_id: user.id };

    if (id.startsWith("new-")) {
      const { data, error } = await supabase.from("company_contacts").insert(payload).select().single();
      if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
      setContacts((prev) => prev.map((c) => c.id === id ? { ...data, _dirty: false } as unknown as Contact : c));
    } else {
      const { error } = await supabase.from("company_contacts").update(payload).eq("id", id);
      if (error) { toast({ title: "Failed to update", variant: "destructive" }); return; }
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, _dirty: false } : c));
    }
    toast({ title: "Saved!" });
  };

  const deleteRow = async (id: string) => {
    if (id.startsWith("new-")) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    await supabase.from("company_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Contact deleted" });
  };

  const LinkedInIcon = ({ url }: { url: string }) =>
    url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
        <ExternalLink className="w-3 h-3" />
      </a>
    ) : null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Sign in to manage your company contacts.</p>
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
            <h1 className="text-xl font-bold text-foreground">Company Contacts Directory</h1>
            <p className="text-sm text-muted-foreground">{contacts.length} companies tracked</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-6 space-y-4">
        <Button onClick={addRow}><Plus className="w-4 h-4 mr-2" /> Add Company</Button>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : contacts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No contacts yet. Add your first company!</p>
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[140px]">Company</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">Industry</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">Website</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">CEO Name</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[140px]">CEO Email</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[60px]">CEO LI</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">Mktg Head</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[140px]">Mktg Email</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[60px]">Mktg LI</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">HR Head</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[140px]">HR Email</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[60px]">HR LI</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">Notes</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className={`border-b border-border hover:bg-muted/30 ${c._dirty ? "bg-primary/5" : ""}`}>
                    <td className="px-1 py-1">
                      <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.company} onChange={(e) => updateCell(c.id, "company", e.target.value)} placeholder="Company *" />
                    </td>
                    <td className="px-1 py-1">
                      <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.industry} onChange={(e) => updateCell(c.id, "industry", e.target.value)} placeholder="Industry" />
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.website} onChange={(e) => updateCell(c.id, "website", e.target.value)} placeholder="https://..." />
                        {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary flex-shrink-0" /></a>}
                      </div>
                    </td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.ceo_name} onChange={(e) => updateCell(c.id, "ceo_name", e.target.value)} placeholder="Name" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.ceo_email} onChange={(e) => updateCell(c.id, "ceo_email", e.target.value)} placeholder="email" /></td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1 w-16" value={c.ceo_linkedin} onChange={(e) => updateCell(c.id, "ceo_linkedin", e.target.value)} placeholder="URL" />
                        <LinkedInIcon url={c.ceo_linkedin} />
                      </div>
                    </td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.marketing_head_name} onChange={(e) => updateCell(c.id, "marketing_head_name", e.target.value)} placeholder="Name" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.marketing_head_email} onChange={(e) => updateCell(c.id, "marketing_head_email", e.target.value)} placeholder="email" /></td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1 w-16" value={c.marketing_head_linkedin} onChange={(e) => updateCell(c.id, "marketing_head_linkedin", e.target.value)} placeholder="URL" />
                        <LinkedInIcon url={c.marketing_head_linkedin} />
                      </div>
                    </td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.hr_head_name} onChange={(e) => updateCell(c.id, "hr_head_name", e.target.value)} placeholder="Name" /></td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.hr_head_email} onChange={(e) => updateCell(c.id, "hr_head_email", e.target.value)} placeholder="email" /></td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-1">
                        <Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1 w-16" value={c.hr_head_linkedin} onChange={(e) => updateCell(c.id, "hr_head_linkedin", e.target.value)} placeholder="URL" />
                        <LinkedInIcon url={c.hr_head_linkedin} />
                      </div>
                    </td>
                    <td className="px-1 py-1"><Input className="h-8 text-xs border-0 bg-transparent focus-visible:ring-1" value={c.notes} onChange={(e) => updateCell(c.id, "notes", e.target.value)} placeholder="Notes" /></td>
                    <td className="px-1 py-1">
                      <div className="flex gap-1">
                        {c._dirty && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => saveRow(c)}><Save className="w-3.5 h-3.5" /></Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteRow(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

export default CompanyContacts;
