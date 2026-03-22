import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  value: "english" | "french";
  onChange: (lang: "english" | "french") => void;
}

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => (
  <div className="flex items-center gap-2">
    <Globe className="w-4 h-4 text-muted-foreground" />
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => onChange("english")}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          value === "english"
            ? "bg-primary text-primary-foreground"
            : "bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        English
      </button>
      <button
        onClick={() => onChange("french")}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          value === "french"
            ? "bg-primary text-primary-foreground"
            : "bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        Français
      </button>
    </div>
  </div>
);

export default LanguageSelector;
