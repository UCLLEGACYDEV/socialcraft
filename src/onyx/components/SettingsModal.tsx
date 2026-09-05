import { useState } from "react";
import { Lock, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "./SlideEditModal";
import { StudioSelect } from "./StudioSelect";
import { fetchKieCredits, type KieCreditResult } from "../kie-api";
import type { ApiSettings, ImageProvider } from "../types";
import { cn } from "@/lib/utils";

const PROVIDERS: { id: ImageProvider; label: string }[] = [
  { id: "kie-ai", label: "KIE.AI (Nano-Banana 2)" },
  { id: "ai33-pro", label: "ai33.pro" },
  { id: "gemini-imagen", label: "Google Imagen" },
  { id: "mock", label: "Studio Preset (Demo)" },
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
  const [isTestingKie, setIsTestingKie] = useState(false);
  const [kieStatus, setKieStatus] = useState<KieCreditResult | null>(null);

  const testKieBalance = async () => {
    if (!settings.kieApiKey?.trim()) {
      toast.error("Bitte zuerst einen KIE.AI API-Key eingeben.");
      return;
    }
    setIsTestingKie(true);
    try {
      const res = await fetchKieCredits(settings.kieApiKey);
      setKieStatus(res);
      if (res.success) {
        toast.success(`KIE.AI verbunden: ${res.formatted} verfügbar!`, {
          description: "Nano-Banana 2 Engine ist jetzt scharf geschaltet.",
        });
        onChange({ provider: "kie-ai" });
        onCreditsUpdated?.();
      } else {
        toast.error(`KIE.AI Fehler: ${res.error || "Verbindung fehlgeschlagen"}`, {
          description: "Bitte API-Key auf kie.ai/api-key überprüfen.",
        });
      }
    } finally {
      setIsTestingKie(false);
    }
  };

  return (
    <ModalShell
      title="Studio Einstellungen & API-Keys"
      onClose={onClose}
      maxHeight="84vh"
      footer={
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-orange-400" /> Alle Keys lokal & verschlüsselt im Browser
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cryptox-orange-btn !py-2 !px-5 text-xs font-semibold"
          >
            Fertig & Schließen
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <Section title="Bild-Anbieter / Rendering Engine">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ provider: p.id })}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                  settings.provider === p.id
                    ? "border-orange-500/80 bg-orange-500/15 text-orange-400 shadow-[0_0_20px_-5px_rgba(255,77,23,0.4)]"
                    : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.16]",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="KIE.AI (Nano-Banana 2 Engine)">
          <Row label="API Key">
            <input
              type="password"
              className="field-input"
              value={settings.kieApiKey}
              onChange={(e) => onChange({ kieApiKey: e.target.value })}
              placeholder="Bearer Token von kie.ai/api-key"
            />
          </Row>

          {/* Live Credit Status & Test Action */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Live KIE.AI Plattform-Guthaben:</span>
              {kieStatus ? (
                <span
                  className={cn(
                    "text-xs font-mono font-semibold px-2 py-0.5 rounded-full border",
                    kieStatus.success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400",
                  )}
                >
                  {kieStatus.success ? `🟢 ${kieStatus.formatted}` : `🔴 ${kieStatus.error || "Fehler"}`}
                </span>
              ) : settings.kieApiKey ? (
                <span className="text-xs text-amber-400 font-mono">Key hinterlegt (ungeprüft)</span>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">Kein Key hinterlegt</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={testKieBalance}
                disabled={isTestingKie}
                className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/25 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isTestingKie && "animate-spin")} />
                {isTestingKie ? "Rufe Credits von api.kie.ai ab…" : "Guthaben von KIE.AI abrufen & testen"}
              </button>

              <a
                href="https://kie.ai/api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors underline underline-offset-2 ml-auto"
              >
                <span>API-Key bei kie.ai holen</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <Row label="Modell">
            <StudioSelect
              value={settings.kieModel}
              onChange={(v) => onChange({ kieModel: v as ApiSettings["kieModel"] })}
              options={[
                { value: "nano-banana-2", label: "nano-banana-2 (Empfohlen)" },
                { value: "nano-banana-2-lite", label: "nano-banana-2-lite (Schnell)" },
                { value: "nano-banana-pro", label: "nano-banana-pro (Premium Qualität)" },
                { value: "gpt-image-2-text-to-image", label: "gpt-image-2 (OpenAI via KIE.AI)" },
              ]}
              ariaLabel="KIE.AI Modell"
            />
          </Row>
          <Row label="Auflösung">
            <StudioSelect
              value={settings.kieResolution}
              onChange={(v) => onChange({ kieResolution: v as ApiSettings["kieResolution"] })}
              options={[
                { value: "1K", label: "1K (Standard & Schnell)" },
                { value: "2K", label: "2K HD" },
                { value: "4K", label: "4K Ultra" },
              ]}
              ariaLabel="Auflösung"
            />
          </Row>
          <Row label="Optionaler Webhook">
            <input
              type="text"
              className="field-input"
              value={settings.kieWebhookKey}
              onChange={(e) => onChange({ kieWebhookKey: e.target.value })}
              placeholder="https://deine-domain.de/api/callback"
            />
          </Row>
        </Section>

        <Section title="ai33.pro (FLUX / SDXL)">
          <Row label="API Key">
            <input
              type="password"
              className="field-input"
              value={settings.ai33ApiKey}
              onChange={(e) => onChange({ ai33ApiKey: e.target.value })}
              placeholder="ai33_..."
            />
          </Row>
          <Row label="Modell">
            <StudioSelect
              value={settings.ai33Model}
              onChange={(v) => onChange({ ai33Model: v })}
              options={AI33_MODELS.map((m) => ({ value: m, label: m }))}
              ariaLabel="ai33.pro Modell"
            />
          </Row>
        </Section>

        <Section title="Google Gemini">
          <Row label="Gemini API Key">
            <input
              type="password"
              className="field-input"
              value={settings.geminiApiKey}
              onChange={(e) => onChange({ geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
            />
          </Row>
          <p className="text-[11px] text-zinc-500">
            Wird für Text-Prompts, Serien-Generierung und Imagen 3 verwendet.
          </p>
        </Section>

        <Section title="Cloud-Synchronisation & Backup">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Cloud-Speicher:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                🟢 Verbunden & Aktiv
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-zinc-200">Automatische Cloud-Sicherung</span>
                <p className="text-[11px] text-zinc-400">
                  Alle generierten Bilder automatisch in deinem persönlichen Cloud-Ordner sichern, damit du jederzeit ganze Ordner oder einzelne Bilder als ZIP herunterladen kannst.
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

        <Section title="Anti-Wiederholung & Cache">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
            <span className="text-xs text-zinc-400">
              <strong className="text-white">{motifCount}</strong> gespeicherte Bild-Motive
            </span>
            {confirmClear ? (
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearMotifs();
                    setConfirmClear(false);
                  }}
                  className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Wirklich löschen
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-xl border border-white/[0.1] px-3 py-1.5 text-xs text-zinc-300"
                >
                  Abbrechen
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white hover:border-white/[0.2]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Cache leeren
              </button>
            )}
          </div>
        </Section>

        <p className="text-[11px] text-zinc-500">ONYX Studio · Nano Banana 2 Production v2.0</p>
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
