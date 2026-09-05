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
      title="Einstellungen"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Lokal im Browser gespeichert
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-bright"
          >
            Fertig
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <Section title="Bild-Anbieter">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ provider: p.id })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs transition-colors",
                  settings.provider === p.id
                    ? "border-primary bg-primary/15 text-primary-bright"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="KIE.AI">
          <Row label="API Key">
            <input
              type="password"
              className="field-input"
              value={settings.kieApiKey}
              onChange={(e) => onChange({ kieApiKey: e.target.value })}
            />
          </Row>
          <Row label="Webhook Key">
            <input
              type="password"
              className="field-input"
              value={settings.kieWebhookKey}
              onChange={(e) => onChange({ kieWebhookKey: e.target.value })}
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
                { value: "1K", label: "1K ★" },
                { value: "2K", label: "2K" },
                { value: "4K", label: "4K" },
              ]}
              ariaLabel="Auflösung"
            />
          </Row>
        </Section>

        <Section title="ai33.pro">
          <Row label="API Key">
            <input
              type="password"
              className="field-input"
              value={settings.ai33ApiKey}
              onChange={(e) => onChange({ ai33ApiKey: e.target.value })}
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
            />
          </Row>
          <p className="text-xs text-muted-foreground">
            Wird für Text-Prompts und Imagen 3 verwendet.
          </p>
        </Section>

        <Section title="Anti-Wiederholung">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {motifCount} gespeicherte Motive
            </span>
            {confirmClear ? (
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearMotifs();
                    setConfirmClear(false);
                  }}
                  className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground"
                >
                  Wirklich löschen
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  Abbrechen
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" /> Cache löschen
              </button>
            )}
          </div>
        </Section>

        <p className="text-xs text-muted-foreground">ONYX Studio v1.1.1 · Local Build</p>
      </div>
    </ModalShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="mono-label">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-3">
      <span className="text-xs font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}
