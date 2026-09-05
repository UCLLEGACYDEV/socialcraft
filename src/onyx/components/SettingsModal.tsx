import { useState } from "react";
import { Lock, Trash2 } from "lucide-react";
import { ModalShell } from "./SlideEditModal";
import { StudioSelect } from "./StudioSelect";
import type { ApiSettings, ImageProvider } from "../types";
import { cn } from "@/lib/utils";

const PROVIDERS: { id: ImageProvider; label: string }[] = [
  { id: "kie-ai", label: "KIE.AI" },
  { id: "ai33-pro", label: "ai33.pro" },
  { id: "gemini-imagen", label: "Google Imagen" },
  { id: "mock", label: "Studio Preset" },
];

const AI33_MODELS = ["flux-pro", "flux-dev", "sdxl-turbo", "midjourney-proxy", "imagen-3"];

interface SettingsModalProps {
  settings: ApiSettings;
  onChange: (patch: Partial<ApiSettings>) => void;
  onClose: () => void;
  motifCount: number;
  onClearMotifs: () => void;
}

export function SettingsModal({
  settings,
  onChange,
  onClose,
  motifCount,
  onClearMotifs,
}: SettingsModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);

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

        <Section title="KIE.AI (Banana Engine)">
          <Row label="API Key">
            <input
              type="password"
              className="field-input"
              value={settings.kieApiKey}
              onChange={(e) => onChange({ kieApiKey: e.target.value })}
              placeholder="kie_..."
            />
          </Row>
          <Row label="Webhook Key">
            <input
              type="password"
              className="field-input"
              value={settings.kieWebhookKey}
              onChange={(e) => onChange({ kieWebhookKey: e.target.value })}
              placeholder="Optionaler Webhook Key"
            />
          </Row>
          <Row label="Modell">
            <StudioSelect
              value={settings.kieModel}
              onChange={(v) => onChange({ kieModel: v as ApiSettings["kieModel"] })}
              options={["nano-banana-2", "nano-banana-2-lite", "nano-banana-pro"].map((m) => ({
                value: m,
                label: m,
              }))}
              ariaLabel="KIE.AI Modell"
            />
          </Row>
          <Row label="Auflösung">
            <StudioSelect
              value={settings.kieResolution}
              onChange={(v) => onChange({ kieResolution: v as ApiSettings["kieResolution"] })}
              options={[
                { value: "1K", label: "1K (Standard)" },
                { value: "2K", label: "2K HD" },
                { value: "4K", label: "4K Ultra" },
              ]}
              ariaLabel="Auflösung"
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

        <p className="text-[11px] text-zinc-500">ONYX Studio · Cryptox Dark Ember Edition v1.1.2</p>
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
