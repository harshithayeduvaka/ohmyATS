import { useState } from "react";
import { StickyNote, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);

  const addNote = () => {
    const n: Note = { id: crypto.randomUUID(), title: "Untitled Note", content: "", updatedAt: new Date() };
    setNotes((prev) => [n, ...prev]);
    setActive(n);
  };

  const updateActive = (field: "title" | "content", value: string) => {
    if (!active) return;
    const updated = { ...active, [field]: value, updatedAt: new Date() };
    setActive(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (active?.id === id) setActive(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <StickyNote className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          </div>
          <Button onClick={addNote} size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> New Note</Button>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {notes.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No notes yet. Create one!</p>}
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => setActive(n)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  active?.id === n.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{n.title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{n.content || "Empty note"}</p>
              </div>
            ))}
          </div>

          <div>
            {active ? (
              <div className="space-y-4">
                <Input
                  value={active.title}
                  onChange={(e) => updateActive("title", e.target.value)}
                  className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0"
                  placeholder="Note title..."
                />
                <Textarea
                  value={active.content}
                  onChange={(e) => updateActive("content", e.target.value)}
                  placeholder="Start writing..."
                  className="min-h-[400px] resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">Last updated: {active.updatedAt.toLocaleString()}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
