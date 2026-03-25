import { ScanResult } from "@/lib/types";
import { ArrowRight, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface CVComparisonProps {
  cv: string;
  result: ScanResult;
}

const CVComparison = ({ cv, result }: CVComparisonProps) => {
  const [copied, setCopied] = useState(false);

  const optimizedCV = useMemo(() => {
    let text = cv;

    // Apply rewrites
    for (const r of result.rewrites) {
      if (r.before && r.after) {
        text = text.replace(r.before, r.after);
      }
    }

    // Apply weak verb upgrades
    for (const v of result.humanPass.weakVerbs) {
      if (v.original && v.suggestion) {
        text = text.replace(new RegExp(escapeRegex(v.original), "gi"), v.suggestion);
      }
    }

    return text;
  }, [cv, result]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimizedCV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-technical" />
          Side-by-Side Comparison
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy Optimized"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-destructive/5">
            <span className="text-xs font-semibold text-destructive uppercase">Original CV</span>
          </div>
          <div className="p-3 max-h-[500px] overflow-y-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{cv}</pre>
          </div>
        </div>

        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-accent/5">
            <span className="text-xs font-semibold text-accent uppercase">Optimized CV</span>
          </div>
          <div className="p-3 max-h-[500px] overflow-y-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{optimizedCV}</pre>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Optimized version applies suggested rewrites and verb upgrades. Review before using.
      </p>
    </div>
  );
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default CVComparison;
