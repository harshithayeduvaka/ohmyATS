import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ExternalLink, Bell, RefreshCw, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  company_name: string;
  careers_url: string;
  keywords: string;
  active: boolean;
  last_checked_at: string | null;
}

interface Notification {
  id: string;
  alert_id: string;
  company_name: string;
  job_title: string;
  job_url: string;
  location: string;
  read: boolean;
  created_at: string;
}

const JobAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: "", careers_url: "", keywords: "" });

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [a, n] = await Promise.all([
      supabase.from("job_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("job_notifications").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (a.data) setAlerts(a.data as Alert[]);
    if (n.data) setNotifications(n.data as Notification[]);
    setLoading(false);
  };

  const addAlert = async () => {
    if (!user || !form.company_name.trim() || !form.careers_url.trim()) {
      toast({ title: "Company name and careers URL required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("job_alerts").insert({ ...form, user_id: user.id });
    if (error) return toast({ title: "Failed to add", variant: "destructive" });
    setForm({ company_name: "", careers_url: "", keywords: "" });
    toast({ title: "Alert added" });
    load();
  };

  const deleteAlert = async (id: string) => {
    await supabase.from("job_alerts").delete().eq("id", id);
    load();
  };

  const scan = async (id: string) => {
    setScanning(id);
    try {
      const { data, error } = await supabase.functions.invoke("scan-job-alert", { body: { alertId: id } });
      if (error) throw error;
      toast({ title: `Scan complete`, description: `${data.new} new of ${data.found} jobs found` });
      load();
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    }
    setScanning(null);
  };

  const markRead = async (id: string) => {
    await supabase.from("job_notifications").update({ read: true }).eq("id", id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };

  const markAllRead = async () => {
    await supabase.from("job_notifications").update({ read: true }).eq("read", false);
    load();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Sign in to manage job alerts.</p>
        <AuthButton />
        <Link to="/" className="text-sm text-primary hover:underline">← Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Job Alerts <Bell className="w-4 h-4 text-primary" />
              {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">Monitor company career pages and get notified of new jobs</p>
          </div>
        </div>
        <div className="flex items-center gap-3"><ThemeToggle /><AuthButton /></div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Add a careers page to monitor</h2>
          <div className="grid sm:grid-cols-4 gap-2">
            <Input placeholder="Company name *" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
            <Input className="sm:col-span-2" placeholder="https://company.com/careers *" value={form.careers_url} onChange={e => setForm({ ...form, careers_url: e.target.value })} />
            <Input placeholder="Keywords (optional)" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} />
          </div>
          <Button onClick={addAlert} className="mt-3"><Plus className="w-4 h-4 mr-2" /> Add Alert</Button>
        </Card>

        <div>
          <h2 className="font-semibold mb-3">Tracked careers pages ({alerts.length})</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No alerts yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <Card key={a.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{a.company_name}</div>
                    <a href={a.careers_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                      {a.careers_url} <ExternalLink className="w-3 h-3" />
                    </a>
                    {a.keywords && <div className="text-xs text-muted-foreground mt-0.5">Keywords: {a.keywords}</div>}
                    {a.last_checked_at && <div className="text-xs text-muted-foreground">Last checked: {new Date(a.last_checked_at).toLocaleString()}</div>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => scan(a.id)} disabled={scanning === a.id}>
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${scanning === a.id ? "animate-spin" : ""}`} /> Scan
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteAlert(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Notifications ({notifications.length})</h2>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-1" /> Mark all read</Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notifications yet. Run a scan above.</p>
          ) : (
            <div className="space-y-1.5">
              {notifications.map(n => (
                <Card key={n.id} className={`p-3 flex items-center justify-between gap-3 ${!n.read ? "border-primary/40 bg-primary/5" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      <a href={n.job_url} target="_blank" rel="noopener noreferrer" onClick={() => markRead(n.id)} className="font-medium hover:text-primary truncate">
                        {n.job_title}
                      </a>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {n.company_name}{n.location ? ` · ${n.location}` : ""} · {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <a href={n.job_url} target="_blank" rel="noopener noreferrer" onClick={() => markRead(n.id)}>
                    <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobAlerts;
