import { useState } from "react";
import { Copy, Download, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OptimizedCvProps {
  text: string;
}

const OptimizedCv = ({ text }: OptimizedCvProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optimised-cv-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            AI-Optimised CV — ready to copy
          </h3>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" />
            .txt
          </Button>
        </div>
      </div>
      <pre className="text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap px-4 py-4 max-h-[480px] overflow-y-auto">
        {text}
      </pre>
      <p className="text-[10px] text-muted-foreground px-4 pb-3 leading-snug">
        Placeholders like [X%] mark figures you need to fill in — the AI never fabricates real metrics.
      </p>
    </div>
  );
};

export default OptimizedCv;
