import { useState } from "react";
import {
  ArrowRight,
  Check,
  Cpu,
  Download,
  Flame,
  HelpCircle,
  Layers,
  Lightbulb,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DESIGN_TEMPLATES } from "../defaults";
import type { AiCloneProfile, ApiSettings, BrandKit, BriefValues } from "../types";
import type { User } from "../auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudioCarouselWorkspaceProps {
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  activeClone?: AiCloneProfile | undefined;
  onOpenCloneStudio: () => void;
  onOpenPromptHub: () => void;
  onOpenBrandKit: () => void;
  onOpenSettings?: () => void;
  currentUser?: User | null;
}

// 4 Psychologische Hook-Typen mit echten Generierungs-Modifikatoren
const HOOK_ARCHETYPES = [
  {
    id: "provocative",
    label: "Provokant",
    icon: Flame,
    prefix: "Hör auf damit: Die meisten machen diesen fatalen Fehler bei ",
    desc: "Bricht mentale Muster & stoppt den Instagram-Feed-Scroll sofort.",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  {
    id: "storytelling",
    label: "Story / Case Study",
    icon: Lightbulb,
    prefix: "Wie wir in unter 90 Tagen das Problem gelöst haben: ",
    desc: "Erzeugt persönliche Identifikation und hohe Weiterleitungs-Raten.",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  {
    id: "data-driven",
    label: "Zahlen & Daten",
    icon: TrendingUp,
    prefix: "94% aller Marken übersehen diesen Wachstumshebel für ",
    desc: "Beweisbasierte Autorität für B2B- & Experten-Positionierung.",
    badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "step-by-step",
    label: "Schritt-für-Schritt",
    icon: Layers,
    prefix: "Die 5-Schritte-Formel für ",
    desc: "Hohe Speicher-Rate (Saves) durch mundgerechte Umsetzbarkeit.",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
] as const;

// 4 Echte Karussell-Format-Vorlagen
const CAROUSEL_PRESETS = [
  {
    title: "Mythen vs. Realität",
    tag: "Viraler Hook",
    topic: "5 gefährliche Mythen über organisches Instagram-Wachstum 2026",
    audience: "Content Creator, Social Media Manager & Agenturen",
    slides: 7,
    designId: "ember-ignite",
  },
  {
    title: "Die 5-Schritte-Formel",
    tag: "High Saves",
    topic: "In 5 Schritten vom anonymen Profil zur gebuchten Personenmarke",
    audience: "Solopreneure, Coaches & B2B Dienstleister",
    slides: 6,
    designId: "high-contrast",
  },
  {
    title: "Tool-Stack & Workflows",
    tag: "Technik & KI",
    topic: "Die 7 unverzichtbaren KI-Tools, die wir für 10x schnellere Content-Produktion nutzen",
    audience: "Tech-Enthusiasten & Marketing-Teams",
    slides: 8,
    designId: "neo-brutal",
  },
  {
    title: "Vorher vs. Nachher Transformation",
    tag: "Case Study",
    topic: "Warum dieser einfache Hook-Wechsel die Verweildauer um 94.8% steigerte",
    audience: "Wachstumsorientierte Gründer:innen",
    slides: 5,
    designId: "ember-ignite",
  },
];

export function StudioCarouselWorkspace({
  brief,
  onChangeBrief,
  onSubmit,
  isGenerating,
  settings,
  onChangeSettings,
  brandKit,
  onChangeBrandKit,
  activeClone,
  onOpenCloneStudio,
  onOpenPromptHub,
  onOpenBrandKit,
  onOpenSettings,
  currentUser,
}: StudioCarouselWorkspaceProps) {
  const [selectedHookType, setSelectedHookType] = useState<string | null>(null);

  const applyHookModifier = (hook: (typeof HOOK_ARCHETYPES)[number]) => {
    setSelectedHookType(hook.id);
    if (!brief.topic.trim()) {
      onChangeBrief({ topic: hook.prefix });
    } else if (!brief.topic.startsWith(hook.prefix.slice(0, 15))) {
      onChangeBrief({ topic: `${hook.prefix}${brief.topic.replace(/^.*?:\s*/, "")}` });
    }
    toast.success(`Hook-Typ „${hook.label}“ angewendet!`, {
      description: hook.desc,
    });
  };

  const applyPreset = (preset: (typeof CAROUSEL_PRESETS)[number]) => {
    onChangeBrief({
      topic: preset.topic,
      audience: preset.audience,
      slideCount: preset.slides,
      designId: preset.designId,
    });
    toast.success(`Vorlage „${preset.title}“ geladen!`, {
      description: `${preset.slides} Slides im Format 4:5 vorbereitet.`,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* ── 1. Top Studio Command Bar ──────────────────────────────── */}
      <div className="cryptox-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#FF3B00] to-[#FFA149] text-white shadow-[0_0_15px_#FF4D17]">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Karussell Studio
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bereit zur Erstellung
            </span>
          </div>
          <p className="mt-1 text-xs text-white/60">
            Erstelle psychologisch strukturierte Instagram-Karussells mit konsistenter Bildsprache im Format 4:5.
          </p>
        </div>

        {/* Live Engine & Format Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Engine indicator */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            title="KIE.AI Nano-Banana 2 API konfigurieren"
          >
            <Cpu className="h-3.5 w-3.5 text-[#FF6A1F]" />
            <span>Nano-Banana 2</span>
            {settings?.kieApiKey?.trim() ? (
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live API
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/20">
                Key einrichten
              </span>
            )}
          </button>

          {/* Aspect Ratio Badge */}
          <button
            type="button"
            onClick={onOpenBrandKit}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
            title="Seitenverhältnis anpassen"
          >
            <span className="font-mono font-bold text-primary-bright">4:5</span>
            <span>Instagram Portrait</span>
          </button>

          {/* KI Persona Status Pill */}
          <button
            type="button"
            onClick={() => {
              onChangeBrief({ useClone: !brief.useClone });
              toast.info(brief.useClone ? "KI-Persona deaktiviert" : "KI-Persona für Karussell aktiviert");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
              brief.useClone
                ? "border-[#FF4D17]/60 bg-[#FF4D17]/15 text-white shadow-[0_0_20px_-3px_#FF4D17]"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white",
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-primary-bright" />
            <span>{brief.useClone ? "KI-Klon: Aktiv" : "KI-Klon: Inaktiv"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Main Creator Console (Apple-Grade 2-Column Layout) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT/CENTER: Big Prompt & Hook Workspace (8 Cols) */}
        <div className="cryptox-card-elevated p-6 sm:p-8 space-y-6 lg:col-span-8">
          {/* Header Row with Reset */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                Thema, Hook & Kernaussage
              </span>
              <span className="text-xs text-white/40">
                (Strg + Enter zum Generieren)
              </span>
            </div>
            {brief.topic && (
              <button
                type="button"
                onClick={() => {
                  onChangeBrief({ topic: "" });
                  setSelectedHookType(null);
                }}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Feld leeren
              </button>
            )}
          </div>

          {/* Big Clean Prompt Textarea */}
          <div className="space-y-2">
            <textarea
              rows={4}
              value={brief.topic}
              onChange={(e) => onChangeBrief({ topic: e.target.value })}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (brief.topic.trim() && !isGenerating) onSubmit();
                }
              }}
              placeholder="Beschreibe das Thema deines Karussells, z. B. „7 psychologische Prinzipien, die jeden Pitch unwiderstehlich machen“… oder wähle unten einen Hook-Typ."
              className="w-full resize-none rounded-2xl border border-white/15 bg-black/40 p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-white placeholder:text-white/35 outline-none focus:border-[#FF4D17] focus:ring-1 focus:ring-[#FF4D17]/40 transition-all shadow-inner"
            />
          </div>

          {/* ── Hook Enhancer Engine (Echte Funktion) ──────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[#FF6A1F]" />
                Psychologischen Hook anwenden:
              </span>
              <span className="text-white/40 text-[11px]">
                Klicke für 1-Klick Optimierung
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HOOK_ARCHETYPES.map((hook) => {
                const Icon = hook.icon;
                const isSelected = selectedHookType === hook.id;
                return (
                  <button
                    key={hook.id}
                    type="button"
                    onClick={() => applyHookModifier(hook)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all group",
                      isSelected
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 shadow-[0_0_20px_-3px_#FF4D17]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-white group-hover:text-[#FFA149] transition-colors">
                        {hook.label}
                      </span>
                      <Icon className="h-3.5 w-3.5 text-white/40 group-hover:text-white" />
                    </div>
                    <span className="text-[10px] text-white/50 leading-tight">
                      {hook.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Audience / Zielgruppe ──────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                Zielgruppe & Tonalität:
              </span>
              <span className="text-white/40 text-[11px]">
                Definiert Sprache & Schmerzpunkte
              </span>
            </div>

            <input
              value={brief.audience}
              onChange={(e) => onChangeBrief({ audience: e.target.value })}
              placeholder="z. B. B2B Entscheider, Content Creator, Agenturinhaber, Fitness-Interessierte…"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/35 outline-none focus:border-[#FF4D17] transition-colors"
            />

            {/* Quick Audience Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "B2B Entscheider & Gründer",
                "Content Creator & Coaches",
                "Agenturinhaber & Marketer",
                "E-Commerce Brands",
              ].map((aud) => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => onChangeBrief({ audience: aud })}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/60 hover:text-white hover:border-[#FF4D17]/40 hover:bg-white/[0.06] transition-colors"
                >
                  {aud}
                </button>
              ))}
            </div>
          </div>

          {/* ── Big Primary Apple Generate CTA Button ──────────────── */}
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isGenerating || !brief.topic.trim()}
              className="cryptox-orange-btn w-full py-4 text-sm sm:text-base font-bold shadow-[0_0_35px_rgba(255,77,23,0.55)] hover:shadow-[0_0_50px_rgba(255,77,23,0.8)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-spin" />
                  <span>Karussell-Sequenz wird berechnet…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Karussell mit {brief.slideCount} Slides generieren</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings, Design Archetypes & Presets (4 Cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card A: Slide Umfang & Design Archetype */}
          <div className="cryptox-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Umfang & Format
              </span>
              <span className="text-[11px] text-primary-bright font-mono font-bold">
                {brief.slideCount} Folien
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Slide-Anzahl</span>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.max(3, brief.slideCount - 1) })}
                    disabled={brief.slideCount <= 3}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-white font-mono">
                    {brief.slideCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.min(10, brief.slideCount + 1) })}
                    disabled={brief.slideCount >= 10}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <Slider
                value={[brief.slideCount]}
                min={3}
                max={10}
                step={1}
                onValueChange={([v]) => v !== undefined && onChangeBrief({ slideCount: v })}
              />

              <p className="text-[10px] text-white/50 pt-1">
                {brief.slideCount <= 5
                  ? "⚡ Snack-Karussell: Schneller Konsum, hohe Vollendungsquote."
                  : brief.slideCount <= 7
                    ? "✨ Empfohlen: Perfekte Balance aus Dwell-Time und Speicher-Rate."
                    : "📚 Deep-Dive: Maximaler Mehrwert für Experten-Karussells."}
              </p>
            </div>

            {/* Design Templates */}
            <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
              <span className="text-xs font-semibold text-white block">
                Design-Archetyp
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DESIGN_TEMPLATES.slice(0, 4).map((tpl) => {
                  const isSelected = brief.designId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onChangeBrief({ designId: tpl.id })}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-left transition-all",
                        isSelected
                          ? "border-[#FF4D17] bg-[#FF4D17]/20 shadow-[0_0_15px_-4px_#FF4D17]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {tpl.swatch.slice(0, 2).map((c, i) => (
                          <span
                            key={i}
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-white truncate">
                        {tpl.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Handle & CTA Branding */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                  Social Handle
                </label>
                <input
                  value={brief.handle}
                  onChange={(e) => onChangeBrief({ handle: e.target.value })}
                  placeholder="@dein.profil"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FF4D17]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                  CTA Folie
                </label>
                <input
                  value={brief.ctaText}
                  onChange={(e) => onChangeBrief({ ctaText: e.target.value })}
                  placeholder="Speichern für später"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FF4D17]"
                />
              </div>
            </div>
          </div>

          {/* Card B: Echte Karussell-Format-Vorlagen (Statt toter Marketing-Karten) */}
          <div className="cryptox-card p-6 space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Bewährte Sequenz-Vorlagen
              </span>
              <span className="text-[10px] text-white/40">1-Klick Laden</span>
            </div>

            <div className="space-y-2">
              {CAROUSEL_PRESETS.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="group flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-[#FF4D17]/50 hover:bg-[#FF4D17]/10 transition-all cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-primary-bright transition-colors truncate">
                        {p.title}
                      </span>
                      <span className="rounded bg-white/[0.08] px-1.5 py-0.2 text-[9px] font-semibold text-white/70">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 truncate mt-0.5">
                      {p.topic}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono font-bold text-white/60 group-hover:text-white">
                      {p.slides} Slides →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
