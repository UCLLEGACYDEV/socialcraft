import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Key,
  Lock,
  RefreshCw,
  Share2,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "./SlideEditModal";
import { StudioSelect } from "@/onyx/components/widgets/StudioSelect";
import { fetchKieCredits, type KieCreditResult } from "@/onyx/kie-api";
import { testCloudConnection, ensureUserS4Folder } from "@/onyx/s4-storage";
import { getStoredCurrentUser } from "@/onyx/auth";
import { ZernioApiClient } from "@/onyx/zernio/client";
import { McpModalContent } from "./McpModalContent";
import type { ApiSettings, ImageProvider } from "@/onyx/types";
import { cn } from "@/lib/utils";

type SettingsSection = "access" | "quality" | "storage" | "advanced";

const QUALITY_OPTIONS: { id: ImageProvider; label: string; tag: string; desc: string }[] = [
  { id: "kie-ai", label: "Ausgewogen", tag: "Empfohlen", desc: "Optimale Balance aus natürlicher Bildschärfe und schneller Generierung." },
  { id: "ai33-pro", label: "Beste Qualität", tag: "Ultra HD", desc: "Höchste Detailschärfe für anspruchsvolle Visuals und Creatives." },
  { id: "gemini-imagen", label: "Schnell", tag: "Entwurf", desc: "Schnelle Vorschau-Bilder zum Ausprobieren von Motiven." },
];

interface SettingsModalProps {
  settings: ApiSettings;
  onChange: (patch: Partial<ApiSettings>) => void;
  onClose: () => void;
  motifCount: number;
  onClearMotifs: () => void;
  onCreditsUpdated?: () => void;
}

export function SettingsModal({
  settings,
  onChange,
  onClose,
  motifCount,
  onClearMotifs,
  onCreditsUpdated,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("access");
  const [confirmClear, setConfirmClear] = useState(false);
  const [showAdminKeys, setShowAdminKeys] = useState(false);

  const [isTestingKie, setIsTestingKie] = useState(false);
  const [isTestingZernio, setIsTestingZernio] = useState(false);
  const [zernioStatus, setZernioStatus] = useState<string | null>(null);

  const currentUser = getStoredCurrentUser();
  const [cloudStatus, setCloudStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);

  const targetFolder = currentUser
    ? `USERCONTENT/${currentUser.role === "admin" ? "admins" : "users"}/${currentUser.id}`
    : "USERCONTENT/users/guest";

  const checkCloud = async () => {
    setIsTestingCloud(true);
    try {
      const res = await testCloudConnection();
      if (res.success) {
        const folder = await ensureUserS4Folder(currentUser);
        setCloudStatus("ok");
        setCloudMessage(
          folder.success
            ? `${res.message} — Ordner „${folder.folder}“ bereit.`
            : `${res.message} — Ordner konnte nicht angelegt werden: ${folder.error}`,
        );
        toast.success("Cloud-Speicher verbunden ☁️");
      } else {
        setCloudStatus("error");
        setCloudMessage(res.message);
        toast.error(res.message);
      }
    } catch (err) {
      setCloudStatus("error");
      setCloudMessage(err instanceof Error ? err.message : "Verbindungstest fehlgeschlagen");
    } finally {
      setIsTestingCloud(false);
    }
  };

  const testKieBalance = async () => {
    setIsTestingKie(true);
    try {
      const res = await fetchKieCredits(settings.kieApiKey || "");
      if (res.success) {
        toast.success(`Engine verbunden: Pipeline einsatzbereit!`);
        onChange({ provider: "kie-ai" });
        onCreditsUpdated?.();
      } else {
        toast.error(`Engine Status: ${res.error || "Verbindung fehlgeschlagen"}`);
      }
    } finally {
      setIsTestingKie(false);
    }
  };

  const testZernioConnection = async () => {
    if (!settings.zernioApiKey?.trim()) {
      toast.error("Bitte gib einen Publisher Engine Key ein.");
      return;
    }
    setIsTestingZernio(true);
    try {
      const client = new ZernioApiClient(settings.zernioApiKey);
      const res = await client.getProfiles();
      const accountsRes = await client.listAccounts().catch(() => ({ accounts: [] }));
      const count = accountsRes.accounts?.length || 0;
      setZernioStatus(`Aktiv (${res.profiles?.length || 1} Profile, ${count} Kanäle verbunden)`);
      toast.success(`Auto-Publisher Engine verbunden! (${count} Social-Kanäle aktiv) 🚀`);
    } catch (err: any) {
      setZernioStatus(`Fehler: ${err.message}`);
      toast.error(`Verbindungsfehler: ${err.message}`);
    } finally {
      setIsTestingZernio(false);
    }
  };

  const SECTIONS = [
    { id: "access" as const, label: "Zugang", icon: Key },
    { id: "quality" as const, label: "Qualität", icon: Sliders },
    { id: "storage" as const, label: "Speicher", icon: Cloud },
    { id: "advanced" as const, label: "Erweitert", icon: Zap },
  ];

  return (
    <ModalShell
      title="Studio Einstellungen"
      onClose={onClose}
      maxHeight="86vh"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Vorkonfiguriert & einsatzbereit
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cryptox-orange-btn !py-2 !px-5 text-xs font-semibold cursor-pointer"
          >
            Fertig & Schließen
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Section Navigation Tabs ─────────────────────────────────── */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isSel = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                  isSel
                    ? "bg-[#FF4D17] text-white shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 1. ZUGANG ──────────────────────────────────────────────── */}
        {activeSection === "access" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Socialcraft Publisher & Konten</h3>
              <p className="text-xs text-zinc-400">
                Verwalte deine Verbindung zum Multi-Kanal-Publisher für automatisches Posten auf Instagram, TikTok, LinkedIn & Co.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF4D1C] to-[#FF8038] flex items-center justify-center shadow-sm">
                    <Share2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Publisher Engine Key</span>
                </div>
                {zernioStatus && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {zernioStatus}
                  </span>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  className="field-input text-xs font-mono"
                  value={settings.zernioApiKey || ""}
                  onChange={(e) => onChange({ zernioApiKey: e.target.value })}
                  placeholder="sk_c8d8bef5559f3903f5848fa66f87185a..."
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={testZernioConnection}
                    disabled={isTestingZernio}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={cn("w-3 h-3", isTestingZernio && "animate-spin")} />
                    <span>{isTestingZernio ? "Prüfe..." : "Verbindung testen"}</span>
                  </button>
                  <span className="text-[11px] text-zinc-500">Multi-Kanal Direkt-Publishing</span>
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">{currentUser.name}</span>
                  <div className="text-[11px] text-zinc-400">{currentUser.email}</div>
                </div>
                <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 font-bold text-orange-300">
                  {currentUser.credits.toLocaleString()} Credits
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── 2. QUALITÄT ────────────────────────────────────────────── */}
        {activeSection === "quality" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Bildqualität & Auflösung</h3>
              <p className="text-xs text-zinc-400">
                Wähle die Standard-Qualität für deine visuellen Generierungen im Studio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {QUALITY_OPTIONS.map((p) => {
                const isSelected = settings.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChange({ provider: p.id })}
                    className={cn(
                      "flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-orange-500/80 bg-orange-500/15 text-white shadow-[0_0_20px_-5px_rgba(255,77,23,0.35)]"
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:text-white hover:border-white/[0.16]",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{p.label}</span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          isSelected
                            ? "border-orange-500/40 bg-orange-500/20 text-orange-400"
                            : "border-white/10 bg-white/5 text-zinc-400",
                        )}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-white">Bildauflösung</span>
                  <p className="text-[11px] text-zinc-400">Exportgröße der einzelnen Folien und Bilder</p>
                </div>
                <div className="w-full sm:w-60">
                  <StudioSelect
                    value={settings.kieResolution}
                    onChange={(v) => onChange({ kieResolution: v as ApiSettings["kieResolution"] })}
                    options={[
                      { value: "1K", label: "1K Standard (Schnell)" },
                      { value: "2K", label: "2K HD (Empfohlen)" },
                      { value: "4K", label: "4K Ultra HD (Maximal)" },
                    ]}
                    ariaLabel="Auflösung"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. SPEICHER ────────────────────────────────────────────── */}
        {activeSection === "storage" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Cloud-Speicher & Cache</h3>
              <p className="text-xs text-zinc-400">
                Alle deine Bilder und Karussells werden in deinem persönlichen Cloud-Ordner abgelegt.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Cloud-Synchronisation</span>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5",
                    cloudStatus === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : cloudStatus === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-white/5 text-zinc-400",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {cloudStatus === "ok" ? "Verbunden" : cloudStatus === "error" ? "Nicht verbunden" : "Bereit"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-zinc-500">Zielordner:</span>
                <code className="text-[11px] text-zinc-300 bg-white/[0.04] rounded px-2 py-0.5">{targetFolder}</code>
                <button
                  type="button"
                  disabled={isTestingCloud}
                  onClick={checkCloud}
                  className="ml-auto rounded-xl border border-white/[0.12] px-3 py-1.5 text-[11px] font-semibold text-zinc-200 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  {isTestingCloud ? "Prüfe…" : "Verbindung prüfen"}
                </button>
              </div>

              {cloudMessage && (
                <p className={cn("text-[11px]", cloudStatus === "error" ? "text-red-400" : "text-emerald-400")}>{cloudMessage}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-zinc-200">Automatische Sicherung</span>
                  <p className="text-[11px] text-zinc-500">
                    Neue Visuals sofort im persönlichen Cloud-Workspace ablegen
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ s4AutoSave: !settings.s4AutoSave })}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ml-3",
                    settings.s4AutoSave ? "bg-[#FF4D17]" : "bg-white/20",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      settings.s4AutoSave ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Cache leeren */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
              <span className="text-xs text-zinc-400">
                <strong className="text-white">{motifCount}</strong> zwischengespeicherte Bild-Motive
              </span>
              {confirmClear ? (
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearMotifs();
                      setConfirmClear(false);
                      toast.success("Cache geleert");
                    }}
                    className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    Wirklich löschen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="rounded-xl border border-white/[0.1] px-3 py-1.5 text-xs text-zinc-300 cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white hover:border-white/[0.2] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Cache leeren
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 4. ERWEITERT ───────────────────────────────────────────── */}
        {activeSection === "advanced" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Erweiterte Schnittstellen</h3>
              <p className="text-xs text-zinc-400">
                Integration für lokale KI-Assistenten (Claude MCP) und Entwickler-Einstellungen.
              </p>
            </div>

            {/* Claude MCP Integration */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold text-white">Claude MCP Desktop-Verbindung</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Verbinde Socialcraft direkt mit Claude Desktop, um Karussells und Posts per Chat auf Zuruf zu generieren.
              </p>
              <div className="pt-2">
                <McpModalContent />
              </div>
            </div>

            {/* Admin Platform Keys */}
            {currentUser?.role === "admin" && (
              <div className="pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAdminKeys((p) => !p)}
                  className="flex items-center justify-between w-full py-2 px-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Shield className="h-3.5 w-3.5 text-primary-bright" />
                    <span>Admin Master-API-Schlüssel</span>
                  </span>
                  {showAdminKeys ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </button>

                {showAdminKeys && (
                  <div className="mt-3 space-y-4 rounded-xl border border-white/[0.08] bg-black/40 p-4 animate-in fade-in-50 duration-200">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-zinc-300">Master Engine Key (KIE Pipeline)</span>
                      <input
                        type="password"
                        className="field-input text-xs font-mono"
                        value={settings.kieApiKey}
                        onChange={(e) => onChange({ kieApiKey: e.target.value })}
                        placeholder="Master Bearer Token..."
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={testKieBalance}
                          disabled={isTestingKie}
                          className="text-[11px] text-orange-400 hover:text-orange-300 cursor-pointer"
                        >
                          {isTestingKie ? "Prüfe..." : "Verbindung testen"}
                        </button>
                        <span className="text-[11px] text-zinc-500">Zentrale Render-Pipeline</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-zinc-600 text-center">Socialcraft Studio Engine · Zero-Setup</p>
      </div>
    </ModalShell>
  );
}
