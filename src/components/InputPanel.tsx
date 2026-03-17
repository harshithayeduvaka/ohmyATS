import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Briefcase, Zap } from "lucide-react";

interface InputPanelProps {
  onScan: (cv: string, jd: string) => void;
  isScanning: boolean;
}

const InputPanel = ({ onScan, isScanning }: InputPanelProps) => {
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          ATS Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dual ATS/Recruiter scan engine
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <FileText className="w-4 h-4 text-technical" />
            Your CV
          </label>
          <Textarea
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder="Paste your full CV text here..."
            className="flex-1 resize-none font-mono text-sm bg-card border-border focus:ring-technical focus:border-technical min-h-[200px]"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Briefcase className="w-4 h-4 text-accent" />
            Target Job Description
          </label>
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the target job description here..."
            className="flex-1 resize-none font-mono text-sm bg-card border-border focus:ring-accent focus:border-accent min-h-[200px]"
          />
        </div>
      </div>

      <Button
        onClick={() => onScan(cv, jd)}
        disabled={!cv.trim() || !jd.trim() || isScanning}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3"
      >
        {isScanning ? (
          <span className="flex items-center gap-2">
            <span className="pulse-keyword">Scanning</span>
            <span className="pulse-keyword">...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Initiate Dual Scan
          </span>
        )}
      </Button>
    </div>
  );
};

export default InputPanel;
