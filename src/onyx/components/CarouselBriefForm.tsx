import { useState } from "react";
import { ArrowRight, Check, KeyRound, Minus, Plus, Sparkles, UserCheck, Users, X } from "lucide-react";
import { DESIGN_TEMPLATES, LLM_PROVIDERS } from "../defaults";
import { getStoredCurrentUser } from "../auth";
import type { BriefValues, CarouselLlmProvider } from "../types";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const SUGGESTED_TOPICS = [
  "10 Zeichen für verdeckten Narzissmus",
  "7 Denkfehler kluger Köpfe",
  "Warum Disziplin Motivation schlägt",
  "5 Schritte zum profitablen B2B-Angebot",
];

const PRESET_SLIDE_COUNTS = [
  { count: 4, label: "4 Slides (Quick Tip)" },
  { count: 6, label: "6 Slides" },
  { count: 7, label: "7 Slides (Empfohlen)" },
  { count: 10, label: "10 Slides (Deep Dive)" },
];

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentUser = getStoredCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const providerMeta = LLM_PROVIDERS.find((p) => p.id === values.provider) ?? LLM_PROVIDERS[0];

  const slideTip =
    values.slideCount <= 4
      ? "Kurzer Snack-Content · Ideal für schnelle Tipps"
      : values.slideCount <= 7
        ? "Optimaler Instagram-Standard · Höchste Save- & Share-Rate"
        : "Ausführlicher Deep-Dive · Ideal für Step-by-Step Guides & Stories";

  return (
    <div className="cryptox-card-elevated relative overflow-hidden space-y-6 p-5 sm:p-7 border border-white/[0.12]">
      {/* ── Chat / Prompt Input Bar ───────────────────────────────── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="topic-chat-input" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Sparkles className="h-4 w-4 text-orange-400" />
            Karussell-Prompt & Thema
          </label>
          <span className="hidden text-[11px] text-zinc-500 sm:inline-block">
            Tipp: <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">Strg</kbd> + <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">Enter</kbd> zum Starten
          </span>
        </div>

        <div className="relative rounded-2xl border border-white/[0.1] bg-[#0E0C13]/90 p-4 transition-all duration-200 focus-within:border-orange-500/60 focus-within:shadow-[0_0_35px_-10px_rgba(255,77,23,0.3)]">
          <textarea
            id="topic-chat-input"
            rows={3}
            value={values.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (values.topic.trim() && !isGenerating) onSubmit();
              }
            }}
            placeholder="Worüber möchtest du ein Karussell erstellen? Beschreibe deine Idee, Stichpunkte oder füge deinen Entwurf ein…"
            className="w-full resize-none bg-transparent text-sm sm:text-base leading-relaxed text-white placeholder:text-zinc-500 outline-none"
          />

          {/* Quick suggestions if empty */}
          {!values.topic && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-white/[0.08]">
              <span className="text-[11px] font-medium text-zinc-400">Vorschläge:</span>
              {SUGGESTED_TOPICS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => onChange({ topic: sug })}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-xs text-zinc-400 transition-colors hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Chat input footer bar */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
            <div className="flex flex-1 items-center gap-2 min-w-56">
              <Users className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                value={values.audience}
                onChange={(e) => onChange({ audience: e.target.value })}
                placeholder="Zielgruppe (optional, z. B. Gründer:innen)"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isGenerating || !values.topic.trim()}
                className="cryptox-orange-btn !py-1.5 !pl-4 !pr-2 text-xs font-semibold disabled:opacity-40"
              >
                <span>{isGenerating ? "Erzeuge…" : `${values.slideCount} Slides generieren`}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Slide Count Slider Section ───────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Karussell-Umfang
              </span>
              <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-400">
                {values.slideCount} {values.slideCount === 1 ? "Slide" : "Slides"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/90">{slideTip}</p>
          </div>

          {/* Stepper buttons for precision fine-tuning */}
          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-foreground/[0.03] p-1">
            <button
              type="button"
              onClick={() => onChange({ slideCount: Math.max(2, values.slideCount - 1) })}
              disabled={values.slideCount <= 2}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-30"
              aria-label="Eine Slide weniger"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-foreground">
              {values.slideCount}
            </span>
            <button
              type="button"
              onClick={() => onChange({ slideCount: Math.min(10, values.slideCount + 1) })}
              disabled={values.slideCount >= 10}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-30"
              aria-label="Eine Slide mehr"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* The interactive range slider */}
        <div className="pt-2 px-1">
          <Slider
            value={[values.slideCount]}
            min={2}
            max={10}
            step={1}
            onValueChange={([val]) => val !== undefined && onChange({ slideCount: val })}
            aria-label="Anzahl der Slides"
          />

          {/* Slider scale markers */}
          <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground/70">
            <span>2 Slides</span>
            <span>4</span>
            <span className="font-semibold text-primary-bright">6 (Standard)</span>
            <span>8</span>
            <span>10 Slides</span>
          </div>
        </div>

        {/* Quick-select presets */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
          <span className="text-[11px] font-medium text-muted-foreground self-center">Schnellauswahl:</span>
          {PRESET_SLIDE_COUNTS.map((p) => (
            <button
              key={p.count}
              type="button"
              onClick={() => onChange({ slideCount: p.count })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                values.slideCount === p.count
                  ? "border-primary bg-primary/20 text-primary-bright font-semibold shadow-[0_0_15px_-4px_var(--primary)]"
                  : "border-border bg-foreground/[0.02] text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Design Templates ─────────────────────────────────────── */}
      <section className="space-y-2.5">
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
                  ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_var(--primary)]"
                  : "border-border bg-foreground/[0.02] hover:border-border hover:bg-foreground/[0.04]",
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
              <div className="text-xs leading-snug text-muted-foreground">{tpl.mood}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Secondary Brief Settings (CTA, Handle) ───────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="CTA Button-Text">
          <input
            className="field-input"
            value={values.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
            placeholder="z. B. folge für mehr"
          />
        </Field>
        <Field label="Social Handle">
          <input
            className="field-input"
            value={values.handle}
            onChange={(e) => onChange({ handle: e.target.value })}
            placeholder="@dein.profil"
          />
        </Field>
      </section>

      {/* ── AI Persona & Optional Engine Settings ─────────────── */}
      <section className="space-y-3 pt-2 border-t border-border/50">
        {/* AI Clone Toggle */}
        <button
          type="button"
          onClick={() => onChange({ useClone: !values.useClone })}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer",
            values.useClone
              ? "border-primary bg-primary/15 shadow-[0_0_30px_-12px_var(--primary)]"
              : "border-border bg-foreground/[0.02] hover:bg-foreground/[0.04]",
          )}
        >
          <UserCheck
            className={cn("h-4 w-4", values.useClone ? "text-primary-bright" : "text-muted-foreground")}
          />
          <span className="flex-1">
            <span className="block text-xs font-medium text-foreground">AI Clone / Persona verwenden</span>
            <span className="block text-xs text-muted-foreground">
              Dein Gesicht als wiederkehrendes Motiv in allen Slides
            </span>
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              values.useClone ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-muted-foreground",
            )}
          >
            {values.useClone ? "AN" : "AUS"}
          </span>
        </button>

        {/* Optional Collapsible for Advanced LLM Settings (Admin only) */}
        {isAdmin && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showAdvanced ? "▾ Weniger Optionen" : "▸ Eigene Text-Engine wählen (Admin)"}</span>
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-2.5 rounded-xl border border-border/60 bg-foreground/[0.02] p-3 animate-in fade-in duration-150">
                <span className="mono-label block text-[10px]">Text-Engine & Provider</span>
                <div className="flex flex-wrap gap-1.5">
                  {LLM_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChange({ provider: p.id as CarouselLlmProvider })}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                        values.provider === p.id
                          ? "border-primary bg-primary/20 text-primary-bright font-semibold shadow-[0_0_15px_-4px_var(--primary)]"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-border/80",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      className="field-input pl-9 text-xs"
                      value={values.apiKey}
                      onChange={(e) => onChange({ apiKey: e.target.value })}
                      placeholder="API-Key (optional — läuft auch ohne)"
                    />
                  </div>
                  {keySaved && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <Check className="h-3.5 w-3.5" /> gespeichert
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
