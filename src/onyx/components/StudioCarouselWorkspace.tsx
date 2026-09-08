import React, { useRef, useState } from "react";
import {
  Sparkles,
  Flame,
  Lightbulb,
  TrendingUp,
  Layers,
  HelpCircle,
  Users,
  Upload,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Minus,
  Plus,
  UserCheck,
  Zap,
  Check,
  ChevronRight,
  MessageSquareQuote,
  BarChart3,
  Bookmark,
  AtSign,
  SlidersHorizontal,
  X,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  FolderPlus,
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

// 5 Psychologische Hook-Typen mit echten Generierungs-Modifikatoren
const HOOK_ARCHETYPES = [
  {
    id: "provocative",
    label: "Provokant",
    icon: Flame,
    prefix: "Hör auf damit: Die meisten machen diesen fatalen Fehler bei ",
    desc: "Bricht mentale Muster & stoppt den Instagram-Feed-Scroll sofort.",
    color: "text-red-400 group-hover:text-red-300",
  },
  {
    id: "storytelling",
    label: "Story / Case Study",
    icon: MessageSquareQuote,
    prefix: "Wie wir in unter 90 Tagen das Problem gelöst haben: ",
    desc: "Erzeugt persönliche Identifikation und hohe Weiterleitungs-Raten.",
    color: "text-amber-400 group-hover:text-amber-300",
  },
  {
    id: "data-driven",
    label: "Zahlen & Daten",
    icon: BarChart3,
    prefix: "94% aller Marken übersehen diesen Wachstumshebel für ",
    desc: "Beweisbasierte Autorität für B2B- & Experten-Positionierung.",
    color: "text-cyan-400 group-hover:text-cyan-300",
  },
  {
    id: "step-by-step",
    label: "Schritt-für-Schritt",
    icon: Layers,
    prefix: "In 5 Schritten zum Ziel: ",
    desc: "Hohe Speicher-Rate (Saves) durch mundgerechte Umsetzbarkeit.",
    color: "text-emerald-400 group-hover:text-emerald-300",
  },
  {
    id: "question",
    label: "Frage",
    icon: HelpCircle,
    prefix: "Warum scheitern 9 von 10 bei ",
    desc: "Aktiviert sofortige Neugier und steigert die Interaktion in den Kommentaren.",
    color: "text-purple-400 group-hover:text-purple-300",
  },
] as const;

// 6 Echte Karussell-Format-Vorlagen für den Schnellstart mit edlen visuellen Hintergründen
const CAROUSEL_PRESETS = [
  {
    title: "Mythen vs. Realität",
    tag: "Viraler Hook",
    icon: Flame,
    bgGradient: "from-rose-950/60 via-slate-900 to-black",
    iconColor: "text-rose-400",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    topic: "5 gefährliche Mythen über organisches Instagram-Wachstum 2026",
    audience: "Content Creator & Agenturen",
    slides: 7,
    designId: "ember-ignite",
  },
  {
    title: "Die 5-Schritte-Formel",
    tag: "High Saves",
    icon: Layers,
    bgGradient: "from-amber-950/60 via-zinc-900 to-black",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    topic: "In 5 Schritten vom anonymen Profil zur gebuchten Personenmarke",
    audience: "Solopreneure & Coaches",
    slides: 6,
    designId: "ember-ignite",
  },
  {
    title: "Experten-Tippliste",
    tag: "Quick Value",
    icon: Lightbulb,
    bgGradient: "from-yellow-950/60 via-zinc-900 to-black",
    iconColor: "text-yellow-400",
    badgeBg: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    topic: "7 unverzeihliche Fehler bei der Kundengewinnung (und wie du sie vermeidest)",
    audience: "B2B & Gründer",
    slides: 7,
    designId: "ember-ignite",
  },
  {
    title: "Vorher / Nachher",
    tag: "Case Study",
    icon: TrendingUp,
    bgGradient: "from-blue-950/60 via-zinc-900 to-black",
    iconColor: "text-blue-400",
    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    topic: "Warum dieser einfache Hook-Wechsel die Verweildauer um 94.8% steigerte",
    audience: "E-Commerce Brands",
    slides: 5,
    designId: "ember-ignite",
  },
  {
    title: "Tool-Stack & KI",
    tag: "Produktivität",
    icon: Zap,
    bgGradient: "from-cyan-950/60 via-zinc-900 to-black",
    iconColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    topic: "Die 7 unverzichtbaren KI-Tools für 10x schnellere Content-Produktion",
    audience: "Agenturen & Marketing",
    slides: 8,
    designId: "swiss-mono",
  },
  {
    title: "Story & Zitat",
    tag: "Storytelling",
    icon: MessageSquareQuote,
    bgGradient: "from-orange-950/60 via-zinc-900 to-black",
    iconColor: "text-orange-400",
    badgeBg: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    topic: "Die eine Lektion, die mich 10.000 € Lehrgeld gekostet hat",
    audience: "B2B & Gründer",
    slides: 6,
    designId: "warm-clay",
  },
];

const AUDIENCES = [
  "B2B & Gründer",
  "Content Creator & Coaches",
  "Agenturen & Marketing",
  "E-Commerce Brands",
  "Dienstleister",
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
  const [showAllPresetsModal, setShowAllPresetsModal] = useState(false);
  const [showCustomAudienceInput, setShowCustomAudienceInput] = useState(false);
  const [customAudienceText, setCustomAudienceText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyHookModifier = (hook: (typeof HOOK_ARCHETYPES)[number]) => {
    setSelectedHookType(hook.id);
    if (!brief.topic.trim()) {
      onChangeBrief({ topic: hook.prefix });
    } else if (!brief.topic.startsWith(hook.prefix.slice(0, 12))) {
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
          description:
            parsedCarousels.length > 1
              ? `Hinweis: Es wurden ${parsedCarousels.length} Karussells in der Datei gefunden.`
              : "Prompts wurden automatisch aufbereitet.",
        });
      } else {
        onChangeBrief({ topic: content.slice(0, 400) });
        toast.info("Inhalt aus Datei ins Themenfeld übernommen.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddCustomAudience = () => {
    if (customAudienceText.trim()) {
      onChangeBrief({ audience: customAudienceText.trim() });
      setShowCustomAudienceInput(false);
      setCustomAudienceText("");
      toast.success("Individuelle Zielgruppe gesetzt!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── 1. Top Studio Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF4D17]/20 via-[#FF4D17]/10 to-transparent border border-[#FF4D17]/40 shadow-[0_0_20px_rgba(255,77,23,0.2)]">
            <Layers className="h-5 w-5 text-[#FF4D17]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Karussell <span className="text-[#FF4D17]">Studio</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Thema eingeben, Hook wählen oder CSV- / Prompt-Datei von Claude, Gemini & ChatGPT importieren.
            </p>
          </div>
        </div>

        {/* Action Pills & Slogan */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              onChangeBrief({ useClone: !brief.useClone });
              toast.info(brief.useClone ? "KI-Persona deaktiviert" : "KI-Persona aktiviert");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm",
              brief.useClone
                ? "border-[#FF4D17] bg-[#FF4D17]/20 text-orange-200 shadow-[0_0_15px_rgba(255,77,23,0.3)]"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-[#FF4D17]" />
            <span>{brief.useClone ? "KI-Klon aktiv" : "KI-Klon"}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 font-mono font-medium">
            <span className="h-2 w-2 rounded-sm border border-zinc-500" />
            4:5 Portrait
          </span>

          <span className="hidden lg:inline-flex items-center text-xs font-serif italic text-zinc-500 ml-2">
            Aus Ideen. Reichweite.
          </span>
        </div>
      </div>

      {/* ── 2. Two-Step Connected Pipeline ─────────────────────────────── */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-3 sm:p-4 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D17]/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          {/* Step 1: Active */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl border border-[#FF4D17]/50 bg-[#FF4D17]/10 shadow-[0_0_20px_rgba(255,77,23,0.15)] transition-all">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4D17] to-amber-500 text-black font-black text-sm shadow-[0_0_15px_rgba(255,77,23,0.5)]">
              1
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Thema & Hook festlegen
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  100% Kostenlos
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 truncate">
                Folientexte generieren – mit KI, auf Basis deines Themas.
              </p>
            </div>
          </div>

          {/* Step 2: Next */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-zinc-400 transition-all">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-300 font-black text-sm border border-white/10">
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Texte prüfen & Visuals rendern
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-white/10">
                  {brief.slideCount} Credits
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Texte optimieren und finale KI-Visuals erstellen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Schnellstart-Vorlagen (1 Klick) Cards ───────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF4D17]" />
            <span className="text-xs font-black text-zinc-200 uppercase tracking-wider">
              Schnellstart-Vorlagen (1 Klick)
            </span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              Übernimmt Thema, Struktur & ideale Slide-Anzahl
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAllPresetsModal(true)}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Alle Vorlagen anzeigen</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CAROUSEL_PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-white/[0.08] bg-black/40 hover:border-[#FF4D17]/60 hover:bg-[#FF4D17]/[0.08] hover:shadow-[0_0_25px_rgba(255,77,23,0.15)] transition-all duration-300 text-left cursor-pointer overflow-hidden backdrop-blur-md"
              >
                {/* Subtle Card Ambient Glow */}
                <div
                  className={cn(
                    "absolute -top-12 -right-12 h-24 w-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40",
                    preset.bgGradient,
                  )}
                />

                <div className="relative z-10">
                  {/* Top Row: Icon Thumbnail & Slide Count */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 group-hover:scale-110 transition-all duration-300 shadow-sm",
                        preset.iconColor,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold font-mono text-zinc-400 group-hover:text-orange-300 transition-colors">
                      {preset.slides} Folien
                    </span>
                  </div>

                  {/* Title & Topic Description */}
                  <div className="text-xs font-black text-white group-hover:text-orange-300 transition-colors line-clamp-1">
                    {preset.title}
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug group-hover:text-zinc-300 transition-colors">
                    {preset.topic}
                  </p>
                </div>

                {/* Bottom Tag & Arrow */}
                <div className="relative z-10 mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                  <span className={cn("px-2 py-0.5 rounded-md font-semibold border text-[10px]", preset.badgeBg)}>
                    {preset.tag}
                  </span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 group-hover:bg-[#FF4D17] group-hover:text-black transition-all">
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Creator Console (Split Grid) ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Prompt & Hook Workspace (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Radial Top Glow */}
          <div className="absolute top-0 left-1/4 h-48 w-96 -translate-y-1/2 bg-gradient-to-b from-[#FF4D17]/15 to-transparent blur-3xl pointer-events-none" />

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

          {/* Prompt Header & Quick Actions */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF4D17]/15 border border-[#FF4D17]/30 text-[#FF4D17]">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Thema & Kernbotschaft
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer transition-all shadow-sm"
                title="CSV, Markdown oder Prompt-Datei von Claude / ChatGPT hochladen"
              >
                <Upload className="h-3 w-3" />
                <span>CSV / Datei importieren</span>
              </button>

              {brief.topic && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeBrief({ topic: "" });
                    setSelectedHookType(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Zurücksetzen</span>
                </button>
              )}
            </div>
          </div>

          {/* Topic Subtitle */}
          <p className="text-xs text-zinc-400 relative z-10 -mt-2">
            Beschreibe dein Thema in wenigen Worten – wir erstellen daraus ein vollständiges Karussell.
          </p>

          {/* Big Clean Prompt Textarea */}
          <div className="relative z-10">
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
              placeholder="z. B. In 5 Schritten vom anonymen Profil zur gebuchten Personenmarke… oder wähle unten einen Hook."
              maxLength={500}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/60 p-4 text-sm leading-relaxed text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17] focus:ring-2 focus:ring-[#FF4D17]/20 transition-all shadow-inner"
            />
            <div className="absolute right-3.5 bottom-3.5 text-[10px] font-mono text-zinc-500">
              {brief.topic.length}/500
            </div>
          </div>

          {/* ── Hook Enhancer (5 Archetypes) ────────────────────────── */}
          <div className="space-y-2.5 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[#FF4D17]" />
                Hook-Typ anwenden:
              </span>
              <span className="text-[11px] text-zinc-500">Wähle aus, wie dein Karussell starten soll.</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {HOOK_ARCHETYPES.map((hook) => {
                const Icon = hook.icon;
                const isSelected = selectedHookType === hook.id;
                return (
                  <button
                    key={hook.id}
                    type="button"
                    onClick={() => applyHookModifier(hook)}
                    className={cn(
                      "group flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-white shadow-[0_0_15px_rgba(255,77,23,0.25)] ring-1 ring-[#FF4D17]/50"
                        : "border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", hook.color)} />
                      <span className="text-xs font-bold truncate">{hook.label}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#FF4D17] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Audience / Zielgruppe ──────────────────────────────── */}
          <div className="space-y-2.5 pt-4 border-t border-white/[0.06] relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#FF4D17]" />
                Zielgruppe (optional):
              </span>
              <span className="text-[11px] text-zinc-500">Für welche Zielgruppe soll der Inhalt optimiert werden?</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {AUDIENCES.map((aud) => {
                const isSelected = brief.audience === aud;
                return (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => onChangeBrief({ audience: isSelected ? "" : aud })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-white shadow-[0_0_12px_rgba(255,77,23,0.3)]"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    {aud}
                  </button>
                );
              })}

              {brief.audience && !AUDIENCES.includes(brief.audience) && (
                <span className="rounded-full border border-[#FF4D17] bg-[#FF4D17]/20 px-3 py-1 text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>{brief.audience}</span>
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ audience: "" })}
                    className="hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowCustomAudienceInput(true)}
                className="rounded-full border border-dashed border-white/20 bg-white/[0.01] px-3 py-1 text-xs text-zinc-400 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
              >
                + Weitere …
              </button>
            </div>

            {/* Inline Custom Audience Input */}
            {showCustomAudienceInput && (
              <div className="flex items-center gap-2 pt-2 animate-in fade-in-50">
                <input
                  type="text"
                  value={customAudienceText}
                  onChange={(e) => setCustomAudienceText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomAudience()}
                  placeholder="z. B. Fitness-Trainer, Handwerker, SaaS-Gründer…"
                  className="flex-1 rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCustomAudience}
                  className="px-3 py-1.5 rounded-xl bg-[#FF4D17] text-black font-bold text-xs hover:bg-[#FF4D17]/90 transition-colors cursor-pointer"
                >
                  Übernehmen
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomAudienceInput(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Credit-Schutz Box (Emerald Glass Banner) ───────────── */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md p-4 text-xs text-zinc-300 space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-emerald-400">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 border border-emerald-500/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span>Credit-Schutz aktiv</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/40 font-mono">
                0 Credits in Schritt 1
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed pl-7">
              In Schritt 1 generiert die KI das vollständige Text-Konzept (Hooks, Folientexte & Visual-Prompts). Du verbrauchst <strong className="text-white font-bold">keine Bild-Credits</strong>. Erst in Schritt 2 entscheidest du nach der Text-Prüfung, ob Visuals gerendert werden ({brief.slideCount} Credits, ~{brief.slideCount * 4}s).
            </p>
          </div>

          {/* ── Primary Action Button ───────────────────────────────── */}
          <div className="pt-2 border-t border-white/[0.08] relative z-10">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isGenerating || !brief.topic.trim()}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF4D17] via-[#FF6A1F] to-[#FF4D17] p-4 text-sm font-black text-white shadow-[0_0_35px_rgba(255,77,23,0.45)] hover:shadow-[0_0_50px_rgba(255,77,23,0.7)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
            >
              {/* Animated Light Sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out pointer-events-none" />

              <div className="relative flex items-center justify-between">
                {isGenerating ? (
                  <div className="w-full flex items-center justify-center gap-2.5">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Schritt 1: Text-Konzept wird generiert… (~3-5s)</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-200" />
                      <span>Schritt 1: Text-Konzept für {brief.slideCount} Slides erstellen (Kostenlos)</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-black/80 bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="h-3 w-3" />
                      Kein Credit-Verbrauch in Schritt 1
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings, Design Archetypes & Presets (4 Cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card A: Umfang & Format */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF4D17]" />
                <span className="text-xs font-black text-white tracking-wide uppercase">
                  Umfang & Format
                </span>
              </div>
              <span className="text-xs text-[#FF4D17] font-mono font-black">
                {brief.slideCount} Folien
              </span>
            </div>

            {/* Slider & Quick Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">Slide-Anzahl</span>
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.max(2, brief.slideCount - 1) })}
                    disabled={brief.slideCount <= 2}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-black text-white font-mono">
                    {brief.slideCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.min(35, brief.slideCount + 1) })}
                    disabled={brief.slideCount >= 35}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
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
                className="py-1 cursor-pointer"
              />

              {/* Quick Slide Selection Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[4, 6, 8, 10, 12, 15, 20, 25, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: num })}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer",
                      brief.slideCount === num
                        ? "border border-[#FF4D17] bg-[#FF4D17] text-black shadow-[0_0_10px_rgba(255,77,23,0.5)]"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white",
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-zinc-400 pt-1 leading-snug">
                {brief.slideCount <= 5
                  ? "⚡ Snack-Karussell: Schneller Konsum, hohe Vollendungsquote."
                  : brief.slideCount <= 10
                    ? "★ Standard: Perfekte Balance aus Dwell-Time und Speicher-Rate."
                    : brief.slideCount <= 20
                      ? "📚 Deep-Dive: Masterclass & umfangreiche Step-by-Step Guides."
                      : "🔥 Mega-Karussell: Maximales Format (bis zu 35 Folien für TikTok / LinkedIn)."}
              </p>
            </div>

            {/* Design Archetypes */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              <span className="text-xs font-bold text-zinc-200 block">
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
                        "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-[#FF4D17] bg-[#FF4D17]/15 shadow-[0_0_15px_rgba(255,77,23,0.25)] ring-1 ring-[#FF4D17]/50"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex gap-1 shrink-0">
                        {tpl.swatch.slice(0, 2).map((c, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-3.5 rounded-full border border-white/30 shadow-sm"
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

            {/* Social Handle & CTA Folie */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                  <AtSign className="h-3 w-3 text-zinc-500" /> Social Handle
                </label>
                <input
                  value={brief.handle}
                  onChange={(e) => onChangeBrief({ handle: e.target.value })}
                  placeholder="@dein.name"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#FF4D17] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                  <Bookmark className="h-3 w-3 text-zinc-500" /> CTA Folie
                </label>
                <input
                  value={brief.ctaText}
                  onChange={(e) => onChangeBrief({ ctaText: e.target.value })}
                  placeholder="Speichern für später"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#FF4D17] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card B: Bewährte Sequenz-Vorlagen */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-6 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-black text-white tracking-wide uppercase">
                Bewährte Sequenz-Vorlagen
              </span>
              <span className="text-[10px] text-zinc-400">1-Klick Laden</span>
            </div>

            <div className="space-y-2">
              {CAROUSEL_PRESETS.slice(0, 3).map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="group flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-[#FF4D17]/50 hover:bg-[#FF4D17]/10 transition-all cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors truncate">
                        {p.title}
                      </span>
                      <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {p.topic}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono font-bold text-zinc-400 group-hover:text-white">
                      {p.slides} Slides →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Alle Vorlagen ────────────────────────────────────────── */}
      {showAllPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in-50">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/[0.12] bg-[#0c0c0f] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[#FF4D17]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Alle Schnellstart-Vorlagen</h3>
                  <p className="text-xs text-zinc-400">Wähle eine erprobte Content-Struktur mit idealer Folien-Anzahl</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPresetsModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {CAROUSEL_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      applyPreset(preset);
                      setShowAllPresetsModal(false);
                    }}
                    className="flex flex-col justify-between p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-[#FF4D17]/60 hover:bg-[#FF4D17]/10 transition-all text-left cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-xl bg-white/[0.06]", preset.iconColor)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-black text-white">{preset.title}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-orange-400">
                          {preset.slides} Folien
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {preset.topic}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                      <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px]", preset.badgeBg)}>
                        {preset.tag}
                      </span>
                      <span className="text-white font-bold flex items-center gap-1 text-xs">
                        Anwenden <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
