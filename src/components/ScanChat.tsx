import { useState, useRef, useEffect } from "react";
import { ScanResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, X, Loader2, RotateCcw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ScoreDashboard from "./ScoreDashboard";

interface ScanChatProps {
  result: ScanResult;
  cv: string;
  jd: string;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-scan`;

const ScanChat = ({ result, cv, jd }: ScanChatProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [updatedCv, setUpdatedCv] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [previewScores, setPreviewScores] = useState<ScanResult["scores"] | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, cv: updatedCv || cv, jd, scanResult: result }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Chat Error", description: e.message, variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleRescan = async () => {
    const cvToScan = updatedCv.trim();
    if (!cvToScan) {
      toast({ title: "Empty CV", description: "Please enter your updated CV text to preview scores.", variant: "destructive" });
      return;
    }
    setIsRescanning(true);
    setPreviewScores(null);

    try {
      const { data, error } = await supabase.functions.invoke("scan-cv", {
        body: { cv: cvToScan, jd },
      });

      if (error) throw new Error(error.message || "Rescan failed");
      if (data?.error) throw new Error(data.error);

      setPreviewScores(data.scores || null);

      const systemMsg: ChatMessage = {
        role: "assistant",
        content: `✅ **Updated Score Preview**\n\nI've rescanned your updated CV. Here's how your scores changed:\n\n| Metric | Before | After |\n|--------|--------|-------|\n| Overall | ${result.scores.overall}% | ${data.scores?.overall ?? "?"}% |\n| ATS Compatibility | ${result.scores.atsCompatibility}% | ${data.scores?.atsCompatibility ?? "?"}% |\n| Keyword Match | ${result.scores.keywordMatch}% | ${data.scores?.keywordMatch ?? "?"}% |\n| Recruiter Appeal | ${result.scores.recruiterAppeal}% | ${data.scores?.recruiterAppeal ?? "?"}% |\n\nKeep editing and rescan again to keep improving!`,
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch (e: any) {
      toast({ title: "Rescan Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsRescanning(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[440px] h-[560px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Chat & Edit CV</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={showEditor ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowEditor(!showEditor)}
            title="Toggle CV editor"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* CV Editor Panel */}
      {showEditor && (
        <div className="border-b border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Edit your CV & preview new scores</span>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 text-xs h-7"
              onClick={handleRescan}
              disabled={isRescanning || !updatedCv.trim()}
            >
              {isRescanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Rescan
            </Button>
          </div>
          <Textarea
            value={updatedCv || cv}
            onChange={(e) => setUpdatedCv(e.target.value)}
            className="text-xs min-h-[100px] max-h-[150px] resize-none font-mono"
            placeholder="Paste or edit your CV here..."
          />
          {previewScores && (
            <div className="rounded-lg border border-border bg-card p-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Overall", before: result.scores.overall, after: previewScores.overall },
                  { label: "ATS", before: result.scores.atsCompatibility, after: previewScores.atsCompatibility },
                  { label: "Keywords", before: result.scores.keywordMatch, after: previewScores.keywordMatch },
                ].map(({ label, before, after }) => (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-xs font-bold">
                      <span className="text-muted-foreground">{before}%</span>
                      <span className="mx-1">→</span>
                      <span className={after > before ? "text-green-500" : after < before ? "text-destructive" : "text-foreground"}>
                        {after}%
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8">
            <p className="font-medium mb-2">Ask me about your scan results</p>
            <div className="space-y-1">
              <p>"Why did I score low on keyword match?"</p>
              <p>"Rewrite my second bullet point"</p>
              <p>"I actually have 3 years of Python experience"</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="font-medium mb-1">💡 Live CV Editor</p>
              <p>Click the <Eye className="w-3 h-3 inline" /> icon above to edit your CV and preview updated scores instantly.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Ask about your results..."
          className="min-h-[40px] max-h-[80px] resize-none text-sm"
          rows={1}
        />
        <Button size="icon" onClick={send} disabled={!input.trim() || isStreaming} className="shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ScanChat;
