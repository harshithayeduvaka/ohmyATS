import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Briefcase, Zap, Upload, X, Loader2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { extractTextFromPdf } from "@/lib/pdfParser";

interface InputPanelProps {
  onScan: (cv: string, jd: string) => void;
  isScanning: boolean;
}

const InputPanel = ({ onScan, isScanning }: InputPanelProps) => {
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [cvMode, setCvMode] = useState<"text" | "file">("text");
  const [jdMode, setJdMode] = useState<"text" | "file">("text");
  const cvFileRef = useRef<HTMLInputElement>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    file: File | undefined,
    setFile: (f: File | null) => void,
    setText: (t: string) => void
  ) => {
    if (!file) return;
    setFile(file);

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      setText(text);
    } else if (file.type === "application/pdf") {
      // For PDF, we read as text (basic extraction)
      // A more robust solution would use a PDF parsing library
      const text = await file.text();
      setText(`[PDF uploaded: ${file.name}]\n\n${text}`);
    } else {
      const text = await file.text();
      setText(text);
    }
  };

  const clearFile = (
    setFile: (f: File | null) => void,
    setText: (t: string) => void,
    setMode: (m: "text" | "file") => void
  ) => {
    setFile(null);
    setText("");
    setMode("text");
  };

  const isReady = cv.trim() && jd.trim() && !isScanning;

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            ATS Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered dual ATS/Recruiter scan
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* CV Input */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4 text-technical" />
              Your CV
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => { setCvMode("text"); setCvFile(null); }}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  cvMode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paste
              </button>
              <button
                onClick={() => setCvMode("file")}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  cvMode === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload
              </button>
            </div>
          </div>

          {cvMode === "text" ? (
            <Textarea
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder="Paste your full CV text here..."
              className="flex-1 resize-none font-mono text-sm bg-card border-border focus:ring-technical focus:border-technical min-h-[180px]"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md bg-card min-h-[180px]">
              {cvFile ? (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="truncate max-w-[200px]">{cvFile.name}</span>
                  <button onClick={() => clearFile(setCvFile, setCv, setCvMode)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Drop PDF or TXT file</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cvFileRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <input
                    ref={cvFileRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0], setCvFile, setCv)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* JD Input */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Briefcase className="w-4 h-4 text-accent" />
              Target Job Description
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => { setJdMode("text"); setJdFile(null); }}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  jdMode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paste
              </button>
              <button
                onClick={() => setJdMode("file")}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  jdMode === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload
              </button>
            </div>
          </div>

          {jdMode === "text" ? (
            <Textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the target job description here..."
              className="flex-1 resize-none font-mono text-sm bg-card border-border focus:ring-accent focus:border-accent min-h-[180px]"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md bg-card min-h-[180px]">
              {jdFile ? (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="truncate max-w-[200px]">{jdFile.name}</span>
                  <button onClick={() => clearFile(setJdFile, setJd, setJdMode)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Drop PDF or TXT file</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => jdFileRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <input
                    ref={jdFileRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0], setJdFile, setJd)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={() => onScan(cv, jd)}
        disabled={!isReady}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3"
      >
        {isScanning ? (
          <span className="flex items-center gap-2">
            <span className="pulse-keyword">Analyzing with AI</span>
            <span className="pulse-keyword">...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Initiate AI Scan
          </span>
        )}
      </Button>
    </div>
  );
};

export default InputPanel;
