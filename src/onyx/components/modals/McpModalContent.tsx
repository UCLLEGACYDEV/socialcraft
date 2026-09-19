import React, { useState, useEffect } from "react";
import {
  Check,
  Cloud,
  Copy,
  Cpu,
  FolderGit2,
  RefreshCw,
  Sparkles,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

interface SyncStatus {
  active: boolean;
  postCount: number;
  channelCount: number;
  profileCount: number;
  seriesCount: number;
  loading: boolean;
}

interface RemoteTunnelInfo {
  online: boolean;
  sseUrl: string;
  updatedAt?: string;
  claudeCodeCommand?: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} kopiert! 📋`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</div>
        <div className="truncate font-mono text-[11px] text-zinc-200">{value}</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 text-[11px] font-medium text-orange-400 hover:bg-orange-500/20 transition-colors"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Kopiert" : "Kopieren"}
      </button>
    </div>
  );
}

export function McpModalContent() {
  const [copied, setCopied] = useState(false);
  const [remote, setRemote] = useState<RemoteTunnelInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    active: false,
    postCount: 0,
    channelCount: 0,
    profileCount: 0,
    seriesCount: 0,
    loading: true,
  });

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/mcp/status");
      if (res.ok) {
        const data = (await res.json()) as Partial<SyncStatus>;
        setSyncStatus({
          active: true,
          postCount: data.postCount ?? 0,
          channelCount: data.channelCount ?? 0,
          profileCount: data.profileCount ?? 0,
          seriesCount: data.seriesCount ?? 0,
          loading: false,
        });
      }
    } catch {
      setSyncStatus((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    void checkStatus();
    fetch("/api/mcp/tunnel")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.sseUrl) {
          setRemote({
            online: true,
            sseUrl: d.sseUrl,
            updatedAt: d.updatedAt,
            claudeCodeCommand: `claude mcp add --transport sse socialcraft ${d.sseUrl}`,
          });
        }
      })
      .catch(() => {});
  }, []);

  const desktopConfig = JSON.stringify(
    {
      mcpServers: {
        socialcraft: {
          command: "npx",
          args: ["-y", "tsx", "src/mcp/index.ts"],
          cwd: "DEIN_PROJEKT_PFAD",
        },
      },
    },
    null,
    2
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(desktopConfig);
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
              {syncStatus.active ? "Socialcraft MCP Server Bridge aktiv" : "MCP Bridge bereit"}
            </div>
            <div className="text-[11px] text-zinc-400">
              {syncStatus.postCount} Posts · {syncStatus.profileCount} Marken · {syncStatus.channelCount} Kanäle
              im Store
            </div>
          </div>
        </div>

        <button
          type="button"
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
        Verbinde <strong>Claude Code</strong> oder <strong>Claude Desktop</strong> direkt mit Socialcraft. Claude
        kann dadurch selbstständig Prompts generieren, optimale Posting-Zeitslots ermitteln und fertige
        Beiträge automatisch in deine Warteschlange vorplanen.
      </p>

      {/* Weg A: Claude Code lokal */}
      <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <FolderGit2 className="h-3.5 w-3.5 text-orange-400" />
          Weg A · Claude Code im geklonten Repo
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Das Repo enthält bereits eine <code className="text-zinc-200">.mcp.json</code>. Beim ersten Start von{" "}
          <code className="text-zinc-200">claude</code> im Projektordner fragt Claude Code einmalig nach Freigabe
          des Servers <code className="text-zinc-200">socialcraft</code>. Mit „Ja" ist alles verbunden.
        </p>
        <CopyRow label="Alternativ manuell hinzufügen" value="claude mcp add socialcraft -- npx -y tsx src/mcp/index.ts" />
        <CopyRow label="Verbindung prüfen" value="claude mcp list" />
      </div>

      {/* Weg B: Remote SSE */}
      <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Cloud className="h-3.5 w-3.5 text-orange-400" />
            Weg B · Remote-Server (ohne Repo)
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              remote?.online
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {remote?.online ? "Online" : "Offline"}
          </span>
        </div>
        {remote?.online && remote.claudeCodeCommand ? (
          <>
            <CopyRow label="Claude Code – ein Befehl" value={remote.claudeCodeCommand} />
            <CopyRow
              label="Claude Desktop (claude_desktop_config.json)"
              value={JSON.stringify(
                { mcpServers: { socialcraft: { type: "sse", url: remote.sseUrl } } },
                null,
                2
              )}
            />
          </>
        ) : (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Aktuell kein Remote-Server aktiv. Der Betreiber startet ihn mit{" "}
            <code className="text-zinc-200">npm run mcp:tunnel</code>; danach erscheint hier automatisch die
            fertige Verbindungs-URL zum Kopieren.
          </p>
        )}
      </div>

      {/* Weg C: Claude Desktop lokal */}
      <details className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
        <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-white">
          <Cpu className="h-3.5 w-3.5 text-orange-400" />
          Weg C · Claude Desktop lokal (%APPDATA%\Claude\claude_desktop_config.json)
        </summary>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            <code className="text-zinc-200">cwd</code> auf deinen lokalen Projektpfad setzen.
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400 hover:bg-orange-500/20"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/60 p-3.5 font-mono text-[11px] text-zinc-300">
          {desktopConfig}
        </pre>
      </details>

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
          &quot;Nutze die Socialcraft MCP Tools. Plane mir für die nächste Woche 7 Beiträge zum Thema &apos;KI-Automatisierung für Agenturen&apos; für Instagram vor.&quot;
        </p>
      </div>
    </div>
  );
}
