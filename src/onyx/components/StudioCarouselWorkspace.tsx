import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cpu,
  Download,
  FileSpreadsheet,
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
  Upload,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DESIGN_TEMPLATES } from "../defaults";
import { parseUniversalPromptFile } from "../csv-prompt-parser";
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
  onNavigateLanding?: () => void;
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
  onNavigateLanding,
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || "");
      const parsedCarousels = parseUniversalPromptFile(content, file.name);
      if (parsedCarousels.length > 0) {
        const first = parsedCarousels[0];
        onChangeBrief({
          topic: first.title,
          slideCount: Math.min(35, Math.max(2, first.slides.length)),
        });
        toast.success(`Karussell „${first.title}“ (${first.slides.length} Slides) erkannt! 🚀`, {
          description: parsedCarousels.length > 1
            ? `Hinweis: Es wurden ${parsedCarousels.length} Karussells in der Datei gefunden. Wechsle zu „Serie“ für den Massen-Export.`
            : "Prompts von Claude / Gemini / ChatGPT wurden automatisch aufbereitet.",
        });
      } else {
        onChangeBrief({ topic: content.slice(0, 300) });
        toast.info("Inhalt aus Datei ins Themenfeld übernommen.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── 1. Clean Top Studio Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF6A1F]" />
            <span>Karussell Studio</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Thema eingeben, Hook wählen oder CSV- / Prompt-Datei von Claude, Gemini & ChatGPT importieren.
          </p>
        </div>

        {/* Subtle quick tags */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onChangeBrief({ useClone: !brief.useClone });
              toast.info(brief.useClone ? "KI-Persona deaktiviert" : "KI-Persona aktiviert");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer",
              brief.useClone
                ? "border-[#FF4D17]/60 bg-[#FF4D17]/15 text-orange-300"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white",
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-orange-400" />
            <span>{brief.useClone ? "KI-Klon aktiv" : "KI-Klon"}</span>
          </button>

          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400 font-mono">
            4:5 Portrait
          </span>
        </div>
      </div>

      {/* ── 2. Main Creator Console ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT/CENTER: Prompt & Hook Workspace (8 Cols) */}
        <div className="cryptox-card p-6 space-y-5 lg:col-span-8 border border-white/[0.08]">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.json,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
            className="hidden"
          />

          {/* Prompt Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Thema & Kernbotschaft
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="CSV, Markdown oder Prompt-Datei von Claude / ChatGPT hochladen"
              >
                <Upload className="h-3 w-3" /> CSV / Datei importieren
              </button>
              {brief.topic && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeBrief({ topic: "" });
                    setSelectedHookType(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Zurücksetzen
                </button>
              )}
            </div>
          </div>

          {/* Big Clean Prompt Textarea */}
          <div className="relative">
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
              placeholder="z. B. 5 fatale Fehler beim B2B-Sales Closing 2026… oder klicke unten auf einen Hook-Vorschlag."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17]/80 focus:ring-1 focus:ring-[#FF4D17]/30 transition-all"
            />
          </div>

          {/* ── Hook Enhancer (Clean Streamlined Row) ──────────────── */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-[#FF6A1F]" />
              Hook-Typ anwenden:
            </span>

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
                      "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-[#FF4D17]/80 bg-[#FF4D17]/15 text-white"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    <span className="text-xs font-semibold truncate">
                      {hook.label}
                    </span>
                    <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Audience / Zielgruppe ──────────────────────────────── */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-orange-400" />
                Zielgruppe (optional):
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "B2B & Gründer",
                "Content Creator & Coaches",
                "Agenturen & Marketing",
                "E-Commerce Brands",
              ].map((aud) => {
                const isSelected = brief.audience === aud;
                return (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => onChangeBrief({ audience: isSelected ? "" : aud })}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer",
                      isSelected
                        ? "border-[#FF4D17]/60 bg-[#FF4D17]/20 text-white font-medium"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20",
                    )}
                  >
                    {aud}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Primary Action Button ───────────────────────────────── */}
          <div className="pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isGenerating || !brief.topic.trim()}
              className="cryptox-orange-btn w-full py-3.5 text-sm font-bold shadow-[0_0_25px_rgba(255,77,23,0.4)] hover:shadow-[0_0_35px_rgba(255,77,23,0.6)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-spin" />
                  <span>Karussell wird generiert…</span>
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
                    onClick={() => onChangeBrief({ slideCount: Math.max(2, brief.slideCount - 1) })}
                    disabled={brief.slideCount <= 2}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white font-mono">
                    {brief.slideCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.min(35, brief.slideCount + 1) })}
                    disabled={brief.slideCount >= 35}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <Slider
                value={[brief.slideCount]}
                min={2}
                max={35}
                step={1}
                onValueChange={([v]) => v !== undefined && onChangeBrief({ slideCount: v })}
              />

              {/* Quick Slide Selection Buttons */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {[4, 6, 8, 10, 12, 15, 20, 25, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: num })}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold transition-all",
                      brief.slideCount === num
                        ? "border border-[#FF6A1F] bg-[#FF6A1F]/20 text-[#FF6A1F] shadow-[0_0_8px_-2px_#FF6A1F]"
                        : "border border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-white/50 pt-0.5">
                {brief.slideCount <= 5
                  ? "⚡ Snack-Karussell: Schneller Konsum, hohe Vollendungsquote."
                  : brief.slideCount <= 10
                    ? "✨ Standard: Perfekte Balance aus Dwell-Time und Speicher-Rate."
                    : brief.slideCount <= 20
                      ? "📚 Deep-Dive: Masterclass & umfangreiche Step-by-Step Guides."
                      : "🔥 Mega-Karussell: Maximales Format (bis zu 35 Folien für TikTok / LinkedIn)."}
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
