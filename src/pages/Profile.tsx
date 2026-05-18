import { useState } from "react";
import { User, Download, Trash2, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No active session");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `madeforats-export-${user.id}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Export ready", description: "Your data has been downloaded." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (confirmText !== "DELETE") {
      toast({ title: "Type DELETE to confirm", variant: "destructive" });
      return;
    }
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No active session");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "DELETE" }),
        },
      );
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);

      await signOut();
      toast({ title: "Account deleted", description: "All your data has been removed." });
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>

        <section className="p-6 rounded-xl border border-border bg-card">
          {user ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Email</label>
                <p className="text-sm font-medium text-foreground mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">User ID</label>
                <p className="text-xs font-mono text-muted-foreground mt-1">{user.id}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Joined</label>
                <p className="text-sm text-foreground mt-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to view your profile.</p>
          )}
        </section>

        {user && (
          <section className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Your data</h2>
              <p className="text-xs text-muted-foreground mt-1">
                You have the right to export or delete your data at any time (GDPR Art. 15 & 17).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                {exporting ? "Preparing export…" : "Export my data (JSON)"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete my account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                      Delete your account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">
                        This permanently deletes your account, all saved scans, CV versions,
                        contacts, notes, and tracked applications. This cannot be undone.
                      </span>
                      <span className="block">
                        Type <code className="font-mono text-destructive font-bold">DELETE</code> below to confirm.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    autoComplete="off"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting || confirmText !== "DELETE"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Deleting…" : "Delete permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        )}

        <section className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-base font-semibold text-foreground mb-2">Legal</h2>
          <div className="flex gap-4 text-sm">
            <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
            <Link to="/data-processing" className="text-primary underline">Data Processing</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
