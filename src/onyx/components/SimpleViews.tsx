export { DirectPromptView } from "./DirectPromptView";
export { AiCloneView } from "./AiCloneView";

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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Karussell Galerie & Archiv</h1>
        <p className="text-xs text-zinc-400">Deine lokal gespeicherten Karussell-Projekte.</p>
      </div>
      {entries.length === 0 && (
        <p className="cryptox-card p-6 text-center text-xs text-zinc-400 border border-white/[0.08]">
          Noch keine Karussells archiviert.
        </p>
      )}
      <div className="space-y-3.5">
        {entries.map((entry) => (
          <div key={entry.id} className="cryptox-card relative overflow-hidden p-5 border border-white/[0.08] hover:border-orange-500/40 hover:shadow-[0_15px_40px_-10px_rgba(255,77,23,0.2)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-white">{entry.topic}</div>
                <div className="text-xs text-zinc-400">
                  {new Date(entry.createdAt).toLocaleString("de-DE")} · {entry.slides.length} Slides
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-orange-400" /> Öffnen
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="rounded-full border border-white/[0.1] bg-white/[0.02] p-2 text-zinc-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3.5 flex gap-2.5 overflow-x-auto pb-1">
              {entry.slides.filter((s) => s.imageUrl).map((s) => (
                <img
                  key={s.id}
                  src={s.imageUrl}
                  alt=""
                  className="h-28 w-auto rounded-xl border border-white/[0.08] object-cover shadow"
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
    <div className="space-y-3.5 text-xs text-zinc-400">
      <p>
        ONYX kann Prompts direkt aus Claude Desktop empfangen. Trage den lokalen Server in deine
        Claude-Konfiguration ein:
      </p>
      <pre className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/50 p-4 font-mono text-xs text-zinc-200">
{`{
  "mcpServers": {
    "onyx-studio": {
      "command": "npx",
      "args": ["onyx-studio-mcp"]
    }
  }
}`}
      </pre>
      <p className="text-[11px] text-zinc-500">In dieser Browser-Version ist die Verbindung noch nicht aktiv.</p>
    </div>
  );
}
