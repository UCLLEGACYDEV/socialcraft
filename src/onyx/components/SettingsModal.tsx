import { useState } from "react";
import { Lock, Trash2, RefreshCw, ChevronDown, ChevronUp, Cloud, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "./SlideEditModal";
import { StudioSelect } from "./StudioSelect";
import { fetchKieCredits, type KieCreditResult } from "../kie-api";
import { testCloudConnection, ensureUserS4Folder } from "../s4-storage";
import { getStoredCurrentUser } from "../auth";
import type { ApiSettings, ImageProvider } from "../types";
import { cn } from "@/lib/utils";

const PROVIDERS: { id: ImageProvider; label: string; tag: string }[] = [
  { id: "kie-ai", label: "ONYX Ultra Engine (HQ)", tag: "Empfohlen" },
  { id: "ai33-pro", label: "FLUX / SDXL Pro", tag: "HD" },
  { id: "gemini-imagen", label: "Google Imagen", tag: "Schnell" },
  { id: "mock", label: "Studio Preset", tag: "Demo" },
];

const AI33_MODELS = ["flux-pro", "flux-dev", "sdxl-turbo", "midjourney-proxy", "imagen-3"];

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
  const [confirmClear, setConfirmClear] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTestingKie, setIsTestingKie] = useState(false);
  const [kieStatus, setKieStatus] = useState<KieCreditResult | null>(null);

  const currentUser = getStoredCurrentUser();

  const testKieBalance = async () => {
    setIsTestingKie(true);
    try {
      const res = await fetchKieCredits(settings.kieApiKey || "");
      setKieStatus(res);
      if (res.success) {
        toast.success(`ONYX Engine verbunden: Pipeline einsatzbereit!`);
        onChange({ provider: "kie-ai" });
        onCreditsUpdated?.();
      } else {
        toast.error(`Engine Status: ${res.error || "Verbindung fehlgeschlagen"}`);
      }
    } finally {
      setIsTestingKie(false);
    }
  };

  return (
    <ModalShell
      title="Studio Einstellungen"
      onClose={onClose}
      maxHeight="86vh"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Alles vorkonfiguriert & einsatzbereit
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
      <div className="space-y-6">
        {/* ── 1. KI-Engine & Rendering ─────────────────────────────────── */}
        <Section title="KI-Engine & Bildqualität">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PROVIDERS.map((p) => {
              const isSelected = settings.provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ provider: p.id })}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-orange-500/80 bg-orange-500/15 text-white shadow-[0_0_20px_-5px_rgba(255,77,23,0.35)]"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:text-white hover:border-white/[0.16]",
                  )}
                >
                  <span className="text-xs font-semibold">{p.label}</span>
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
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Row label="Auflösung">
              <StudioSelect
                value={settings.kieResolution}
                onChange={(v) => onChange({ kieResolution: v as ApiSettings["kieResolution"] })}
                options={[
                  { value: "1K", label: "1K Standard (Schnellste Generierung)" },
                  { value: "2K", label: "2K HD (Empfohlen für Instagram)" },
                  { value: "4K", label: "4K Ultra HD (Maximale Schärfe)" },
                ]}
                ariaLabel="Auflösung"
              />
            </Row>
          </div>
        </Section>

        {/* ── 2. Integrierter Cloud-Speicher (Zero-Config) ─────────────── */}
        <Section title="Cloud-Speicher & Automatische Sicherung">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Integrierte Cloud-Synchronisation</span>
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
                {cloudStatus === "ok" ? "Verbunden" : cloudStatus === "error" ? "Nicht verbunden" : "Status unbekannt"}
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Deine generierten Visuals, Karussells und Serien werden vollautomatisch in deinem persönlichen Cloud-Ordner gespeichert. Du kannst deine Galerie jederzeit durchsuchen oder ganze Ordner als ZIP herunterladen.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-500">Zielordner:</span>
              <code className="text-[11px] text-zinc-300 bg-white/[0.04] rounded px-2 py-0.5">{targetFolder}</code>
              <button
                type="button"
                disabled={isTestingCloud}
                onClick={checkCloud}
                className="ml-auto rounded-xl border border-white/[0.12] px-3 py-1.5 text-[11px] font-semibold text-zinc-200 hover:text-white cursor-pointer disabled:opacity-50"
              >
                {isTestingCloud ? "Prüfe…" : "Verbindung prüfen & Ordner anlegen"}
              </button>
            </div>
            {cloudMessage && (
              <p className={cn("text-[11px]", cloudStatus === "error" ? "text-red-400" : "text-emerald-400")}>{cloudMessage}</p>
            )}


            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-zinc-200">Automatische Sicherung</span>
                <p className="text-[11px] text-zinc-500">
                  Neue Entwürfe sofort im persönlichen Cloud-Workspace ablegen
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
        </Section>

        {/* ── 3. Speicher & Cache ───────────────────────────────────────── */}
        <Section title="Entwürfe & Cache">
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
        </Section>

        {/* ── 4. Admin Plattform-Keys (Nur für Administratoren sichtbar) ── */}
        {currentUser?.role === "admin" ? (
          <div className="pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowAdvanced((p) => !p)}
              className="flex items-center justify-between w-full py-2 px-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2 font-medium">
                <Shield className="h-3.5 w-3.5 text-primary-bright" />
                <span>Admin Master-API-Schlüssel</span>
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-xl border border-white/[0.08] bg-black/40 p-4 animate-in fade-in-50 duration-200">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Administrator-Modus: Diese Master-Keys steuern die globale Render-Pipeline für alle Endnutzer.
                </p>

                {/* Master Engine Key */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-300">Master Engine Key (Nano-Banana Pipeline)</span>
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
                    <span className="text-[11px] text-zinc-500">Zentrale Pipeline</span>
                  </div>
                </div>

                {/* Gemini Custom Key */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-300">Master Google Gemini Key</span>
                  <input
                    type="password"
                    className="field-input text-xs font-mono"
                    value={settings.geminiApiKey}
                    onChange={(e) => onChange({ geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                  />
                </div>

                {/* AI33 Key */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-300">Master AI33 Engine Key</span>
                  <input
                    type="password"
                    className="field-input text-xs font-mono"
                    value={settings.ai33ApiKey}
                    onChange={(e) => onChange({ ai33ApiKey: e.target.value })}
                    placeholder="ai33_..."
                  />
                </div>

                {/* Custom Cloud Storage Keys */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-300">Cloud-Speicher Master Keys</span>
                  <input
                    type="text"
                    className="field-input text-xs font-mono"
                    value={settings.s4AccessKey || ""}
                    onChange={(e) => onChange({ s4AccessKey: e.target.value })}
                    placeholder="Access Key..."
                  />
                  <input
                    type="password"
                    className="field-input text-xs font-mono"
                    value={settings.s4SecretKey || ""}
                    onChange={(e) => onChange({ s4SecretKey: e.target.value })}
                    placeholder="Secret Key..."
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-xs text-zinc-400">
              ⚡ Alle KI-Engines und Render-Pipelines sind für deinen Account optimiert vorkonfiguriert.
            </p>
          </div>
        )}

        <p className="text-[10px] text-zinc-600 text-center">Socialcraft Studio Engine · Zero-Setup</p>
      </div>
    </ModalShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="mono-label text-zinc-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="w-full sm:w-64">{children}</div>
    </div>
  );
}
