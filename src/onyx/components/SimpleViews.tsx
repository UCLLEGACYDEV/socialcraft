import { Download, Trash2 } from "lucide-react";
import type { HistoryEntry } from "../types";

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

import { useState, useEffect } from "react";
import { Check, Copy, RefreshCw, Sparkles, Terminal, Cpu } from "lucide-react";
import { toast } from "sonner";

export function McpModalContent() {
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    loading: boolean;
    active: boolean;
    postCount: number;
    profileCount: number;
    channelCount: number;
  }>({
    loading: true,
    active: false,
    postCount: 0,
    profileCount: 0,
    channelCount: 0,
  });

  const checkStatus = async () => {
    setSyncStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/mcp/sync");
      if (res.ok) {
        const data = await res.json();
        setSyncStatus({
          loading: false,
          active: true,
          postCount: data.scheduledPosts?.length || 0,
          profileCount: data.brandProfiles?.length || 0,
          channelCount: data.socialChannels?.length || 0,
        });
      } else {
        setSyncStatus({ loading: false, active: false, postCount: 0, profileCount: 0, channelCount: 0 });
      }
    } catch {
      setSyncStatus({ loading: false, active: false, postCount: 0, profileCount: 0, channelCount: 0 });
    }
  };

  useEffect(() => {
    void checkStatus();
  }, []);

  const configSnippet = JSON.stringify(
    {
      mcpServers: {
        socialcraft: {
          command: "npx",
          args: ["-y", "tsx", "src/mcp/index.ts"],
          cwd: typeof window !== "undefined" ? "g:\\websites\\SOCIALCRAFT\\socialcraft" : "",
        },
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopied(true);
    toast.success("Claude Desktop Konfiguration kopiert! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-xs text-zinc-300">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            {syncStatus.active && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                syncStatus.active ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
          </div>
          <div>
            <div className="font-semibold text-white">
              {syncStatus.active ? "SocialCraft MCP Server Bridge aktiv" : "MCP Bridge bereit"}
            </div>
            <div className="text-[11px] text-zinc-400">
              {syncStatus.postCount} Posts · {syncStatus.profileCount} Marken · {syncStatus.channelCount} Kanäle
              im Store
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            void checkStatus();
            toast.info("MCP-Store synchronisiert");
          }}
          disabled={syncStatus.loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.08]"
        >
          <RefreshCw className={`h-3 w-3 ${syncStatus.loading ? "animate-spin" : ""}`} />
          Sync
        </button>
      </div>

      <p className="text-zinc-400 leading-relaxed">
        Verbinde <strong>Claude Desktop</strong> oder <strong>Claude Code</strong> direkt mit SocialCraft. Claude
        kann dadurch selbstständig Prompts generieren, optimale Posting-Zeitslots ermitteln und fertige
        Beiträge automatisch in deine Warteschlange vorplanen.
      </p>

      {/* Claude Desktop Config */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Cpu className="h-3.5 w-3.5 text-orange-400" />
            Claude Desktop Konfiguration (%APPDATA%\Claude\claude_desktop_config.json)
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400 hover:bg-orange-500/20"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>

        <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-black/60 p-3.5 font-mono text-[11px] text-zinc-300">
          {configSnippet}
        </pre>
      </div>

      {/* Claude Tools Overview */}
      <div className="space-y-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-orange-400" />
          Verfügbare MCP Tools für Claude:
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-400 pt-1">
          <li>• <strong className="text-zinc-200">batch_preplan_posts:</strong> Mehr-Tage-Pläne automatisch einplanen</li>
          <li>• <strong className="text-zinc-200">get_posting_slots:</strong> Kollisionsfreie Postingzeiten ermitteln</li>
          <li>• <strong className="text-zinc-200">create_scheduled_post:</strong> Einzelne Posts vorplanen</li>
          <li>• <strong className="text-zinc-200">create_carousel_draft:</strong> Multi-Slide-Karussells generieren</li>
          <li>• <strong className="text-zinc-200">get_prompt_frameworks:</strong> Hook- & Bild-Prompt-Vorlagen</li>
          <li>• <strong className="text-zinc-200">get_brand_profiles:</strong> Markenidentitäten & Farben abfragen</li>
        </ul>
      </div>

      {/* Example Claude Prompt */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-3 text-[11px]">
        <div className="flex items-center gap-1.5 font-semibold text-orange-400 mb-1">
          <Sparkles className="h-3 w-3" />
          Beispiel-Prompt für Claude:
        </div>
        <p className="italic text-zinc-300">
          &quot;Nutze die SocialCraft MCP Tools. Plane mir für die nächste Woche 7 Beiträge zum Thema &apos;KI-Automatisierung für Agenturen&apos; für Instagram vor. Erstelle für jeden Post einen viralen Hook, eine hochwertige Caption ohne Gedankenstriche, 4 Hashtags und einen fotorealistischen Bildprompt. Weise die besten freien Zeitslots automatisch zu.&quot;
        </p>
      </div>
    </div>
  );
}

