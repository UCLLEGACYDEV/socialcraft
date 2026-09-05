import { useState } from "react";
import { Download, ImageIcon, Loader2, Sparkles, Trash2, UserCheck } from "lucide-react";
import { mockGenerateImage } from "../mock-api";
import type { HistoryEntry } from "../types";

interface DirectPromptViewProps {
  initialPrompt?: string;
}

export function DirectPromptView({ initialPrompt }: DirectPromptViewProps = {}) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Update prompt if initialPrompt changes
  const prevInitRef = useState(initialPrompt)[0];
  if (initialPrompt && initialPrompt !== prompt && initialPrompt !== prevInitRef) {
    setPrompt(initialPrompt);
  }

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await mockGenerateImage(images.length + 1);
      setImages((p) => [res.imageUrl, ...p]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-card-hero space-y-3 p-5">
        <h1 className="text-lg font-semibold">Einzelbild</h1>
        <textarea
          rows={5}
          className="field-input text-xs sm:text-sm leading-relaxed"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Photorealistic 3D marble statue, ember rim light…"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          Bild erzeugen
        </button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <img key={i} src={src} alt="" className="rounded-xl border border-border" />
          ))}
        </div>
      )}
    </div>
  );
}

export function AiCloneView() {
  const [desc, setDesc] = useState("");
  return (
    <div className="glass-card-hero space-y-3 p-5">
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <UserCheck className="h-4 w-4 text-primary-bright" /> AI Clone
      </h1>
      <p className="text-xs text-muted-foreground">
        Beschreibe dein wiederkehrendes Motiv. Wird bei aktivem Clone jedem Prompt vorangestellt.
      </p>
      <textarea
        rows={6}
        className="field-input text-xs sm:text-sm leading-relaxed"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Mann, Ende 30, kurzer Bart, schwarzer Rollkragen, dramatisches Seitenlicht…"
      />
      <p className="text-xs text-muted-foreground">Lokal gespeichert, sobald du weiter tippst.</p>
    </div>
  );
}

export { PromptHubView as PromptGallery } from "./PromptHubView";

export function HistoryView({
  entries,
  onOpen,
  onDelete,
}: {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Galerie</h1>
      {entries.length === 0 && (
        <p className="glass-card p-6 text-center text-xs text-muted-foreground">
          Noch keine Karussells archiviert.
        </p>
      )}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="glass-card hover:ember-glow p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{entry.topic}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString("de-DE")} · {entry.slides.length} Slides
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-foreground/[0.06]"
                >
                  <Download className="h-3.5 w-3.5" /> Öffnen
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {entry.slides.filter((s) => s.imageUrl).map((s) => (
                <img
                  key={s.id}
                  src={s.imageUrl}
                  alt=""
                  className="h-24 w-auto rounded-lg border border-border"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function McpModalContent() {
  return (
    <div className="space-y-3 text-xs text-muted-foreground">
      <p>
        ONYX kann Prompts direkt aus Claude Desktop empfangen. Trage den lokalen Server in deine
        Claude-Konfiguration ein:
      </p>
      <pre className="overflow-x-auto rounded-lg border border-border bg-foreground/[0.04] p-3 font-mono text-xs text-foreground">
{`{
  "mcpServers": {
    "onyx-studio": {
      "command": "npx",
      "args": ["onyx-studio-mcp"]
    }
  }
}`}
      </pre>
      <p>In dieser Browser-Version ist die Verbindung noch nicht aktiv.</p>
    </div>
  );
}
