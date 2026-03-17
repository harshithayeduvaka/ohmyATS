import { BotPassData } from "@/lib/types";
import { AlertTriangle, CheckCircle, XCircle, Terminal } from "lucide-react";

const statusIcon = (status: "ok" | "warning" | "error") => {
  if (status === "ok") return <CheckCircle className="w-3.5 h-3.5 text-accent" />;
  if (status === "warning") return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
};

const BotPassSection = ({ data }: { data: BotPassData }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Terminal className="w-4 h-4 text-technical" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Bot Pass — Parsing & Formatting
      </h2>
    </div>

    {data.formatIssues.length > 0 && (
      <div className="bg-warning/10 border border-warning/20 rounded-md p-3 mb-3">
        <p className="text-xs font-semibold text-warning uppercase mb-2">Format Issues Detected</p>
        <ul className="space-y-1">
          {data.formatIssues.map((issue, i) => (
            <li key={i} className="text-sm text-foreground flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="bg-card rounded-md border border-border">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-mono-tech text-muted-foreground">extracted_fields.log</span>
      </div>
      <div className="p-3 space-y-2">
        {data.extractedFields.map((field, i) => (
          <div key={i} className="flex items-center justify-between font-mono-tech text-xs">
            <span className="text-muted-foreground">{field.label}</span>
            <span className="flex items-center gap-1.5">
              {statusIcon(field.status)}
              <span className={field.status === "ok" ? "text-foreground" : "text-warning"}>
                {field.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BotPassSection;
