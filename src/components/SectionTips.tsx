import { SectionTip } from "@/lib/types";
import { ClipboardCheck, Lightbulb } from "lucide-react";

interface SectionTipsProps {
  tips: SectionTip[];
}

const SectionTips = ({ tips }: SectionTipsProps) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <ClipboardCheck className="w-4 h-4 text-technical" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Section-by-Section Tips
      </h2>
    </div>

    <div className="space-y-3">
      {tips.map((section, i) => {
        const color = section.score >= 70 ? "accent" : section.score >= 40 ? "warning" : "destructive";
        return (
          <div key={i} className="bg-card rounded-md border border-border overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase">{section.section}</span>
              <span className={`text-sm font-bold text-${color}`}>{section.score}/100</span>
            </div>
            <div className="p-3 space-y-1.5">
              {section.tips.map((tip, j) => (
                <div key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default SectionTips;
