import { Check, KeyRound, Minus, Plus, UserCheck, X } from "lucide-react";
import { DESIGN_TEMPLATES, LLM_PROVIDERS } from "../defaults";
import type { BriefValues, CarouselLlmProvider } from "../types";
import { cn } from "@/lib/utils";

interface CarouselBriefFormProps {
  values: BriefValues;
  onChange: (patch: Partial<BriefValues>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isGenerating: boolean;
  keySaved: boolean;
}

export function CarouselBriefForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isGenerating,
  keySaved,
}: CarouselBriefFormProps) {
  const providerMeta = LLM_PROVIDERS.find((p) => p.id === values.provider) ?? LLM_PROVIDERS[0];

  return (
    <div className="glass-card-hero space-y-5 p-5 sm:p-6">
      <section className="space-y-2">
        <h2 className="mono-label">Design Library</h2>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {DESIGN_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onChange({ designId: tpl.id })}
              className={cn(
                "w-52 shrink-0 rounded-xl border p-3 text-left transition-colors",
                values.designId === tpl.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-foreground/[0.02] hover:border-border",
              )}
            >
              <div className="flex gap-1">
                {tpl.swatch.map((c) => (
                  <span
                    key={c}
                    className="h-4 w-4 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 text-[13px] font-semibold">{tpl.name}</div>
              <div className="text-[11px] leading-snug text-muted-foreground">{tpl.mood}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Thema">
          <input
            className="field-input"
            value={values.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            placeholder="z. B. Disziplin schlägt Motivation"
          />
        </Field>
        <Field label="Zielgruppe">
          <input
            className="field-input"
            value={values.audience}
            onChange={(e) => onChange({ audience: e.target.value })}
            placeholder="z. B. Gründer:innen zwischen 25 und 40"
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_1fr]">
        <Field label="Slides">
          <div className="flex items-center gap-2">
            <StepBtn onClick={() => onChange({ slideCount: Math.max(1, values.slideCount - 1) })}>
              <Minus className="h-3.5 w-3.5" />
            </StepBtn>
            <span className="w-8 text-center font-mono text-sm">{values.slideCount}</span>
            <StepBtn onClick={() => onChange({ slideCount: Math.min(10, values.slideCount + 1) })}>
              <Plus className="h-3.5 w-3.5" />
            </StepBtn>
          </div>
        </Field>
        <Field label="CTA">
          <input
            className="field-input"
            value={values.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
          />
        </Field>
        <Field label="Handle">
          <input
            className="field-input"
            value={values.handle}
            onChange={(e) => onChange({ handle: e.target.value })}
          />
        </Field>
      </section>

      <section className="space-y-2">
        <h2 className="mono-label">Text-Engine</h2>
        <div className="flex flex-wrap gap-2">
          {LLM_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ provider: p.id as CarouselLlmProvider })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                values.provider === p.id
                  ? "border-primary bg-primary/20 text-primary-bright"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              className="field-input pl-9"
              value={values.apiKey}
              onChange={(e) => onChange({ apiKey: e.target.value })}
              placeholder="API-Key (optional — Demo läuft ohne)"
            />
          </div>
          {keySaved ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check className="h-3.5 w-3.5" /> gespeichert
            </span>
          ) : (
            <a
              href={providerMeta?.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary-bright hover:underline"
            >
              Key holen ↗
            </a>
          )}
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => onChange({ useClone: !values.useClone })}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
            values.useClone
              ? "border-primary bg-primary/15 shadow-[0_0_30px_-12px_var(--primary)]"
              : "border-border bg-foreground/[0.02]",
          )}
        >
          <UserCheck
            className={cn("h-4 w-4", values.useClone ? "text-primary-bright" : "text-muted-foreground")}
          />
          <span className="flex-1">
            <span className="block text-[13px] font-medium">AI Clone verwenden</span>
            <span className="block text-[11px] text-muted-foreground">
              Dein Gesicht/Stil als wiederkehrendes Motiv in allen Slides
            </span>
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px]",
              values.useClone ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-muted-foreground",
            )}
          >
            {values.useClone ? "AN" : "AUS"}
          </span>
        </button>
      </section>

      {isGenerating && (
        <button
          type="button"
          onClick={onCancel}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <X className="h-4 w-4" /> Generierung abbrechen
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="mono-label">{label}</span>
      {children}
    </label>
  );
}

function StepBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}
