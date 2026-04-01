import { useState } from "react";
import { Globe, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string;
}

const Portfolio = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);

  const addProject = () => {
    const p: Project = { id: crypto.randomUUID(), title: "", description: "", url: "", tags: "" };
    setProjects((prev) => [p, ...prev]);
    setEditing(p);
  };

  const save = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
  };

  const remove = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          </div>
          <Button onClick={addProject} size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Project</Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Showcase your projects and work samples to share with recruiters.</p>

        {projects.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects yet. Add your first portfolio piece!</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p) =>
            editing?.id === p.id ? (
              <div key={p.id} className="p-4 rounded-xl border border-primary bg-card space-y-3">
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Project title" />
                <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Brief description" className="min-h-[80px]" />
                <Input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://..." />
                <Input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="Tags (comma-separated)" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save(editing)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div key={p.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{p.title || "Untitled"}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(p)}><Globe className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{p.description || "No description"}</p>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline">
                    <ExternalLink className="w-3 h-3" /> {p.url}
                  </a>
                )}
                {p.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.split(",").map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
