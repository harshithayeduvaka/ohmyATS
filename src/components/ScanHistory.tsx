import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScanResult } from "@/lib/types";
import { Clock, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ScanHistoryProps {
  onLoadScan: (result: ScanResult) => void;
}

interface HistoryItem {
  id: string;
  created_at: string;
  cv_text: string;
  jd_text: string;
  result: ScanResult;
}

const ScanHistory = ({ onLoadScan }: ScanHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setItems((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scan_history").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Scan deleted" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Clock className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No scan history yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your AI scans will be saved here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground mb-3">Scan History</h2>
      {items.map((item) => {
        const score = (item.result as any)?.scores?.overall;
        return (
          <div
            key={item.id}
            className="p-3 rounded-md bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-foreground mt-1 truncate">
                  {item.jd_text.substring(0, 80)}...
                </p>
                {score !== undefined && (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                    Score: {score}/100
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onLoadScan(item.result)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScanHistory;
