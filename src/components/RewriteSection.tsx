import { RewriteExample } from "@/lib/types";
import { PenLine } from "lucide-react";

const RewriteSection = ({ rewrites }: { rewrites: RewriteExample[] }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <PenLine className="w-4 h-4 text-technical" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Actionable Rewrites
      </h2>
    </div>

    <div className="space-y-3">
      {rewrites.map((r, i) => (
        <div key={i} className="bg-card rounded-md border border-border overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">{r.context}</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="bg-destructive/5 rounded px-3 py-2 border border-destructive/10">
              <span className="text-[10px] font-semibold text-destructive uppercase">Before</span>
              <p className="text-sm text-foreground mt-1">{r.before}</p>
            </div>
            <div className="bg-accent/5 rounded px-3 py-2 border border-accent/10">
              <span className="text-[10px] font-semibold text-accent uppercase">After</span>
              <p className="text-sm text-foreground mt-1">{r.after}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default RewriteSection;
