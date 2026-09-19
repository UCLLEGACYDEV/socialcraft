import React, { useState } from "react";
import {
  Sparkles,
  Flame,
  MessageSquareQuote,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  Edit3,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  AiSkill,
  ApiSettings,
  BrandKit,
  BriefValues,
  ScheduledPost,
  SlideContent,
  SlideRole,
} from "@/onyx/types";
import { generateCarouselContent, rerollSlidePromptClient } from "@/onyx/ai-client";
import { GenerationProgress } from "../widgets/GenerationProgress";

interface ModernStudioDashboardProps {
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  skills: AiSkill[];
  activeSkillId?: string;
  onSelectSkill?: (id: string) => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  slides: SlideContent[];
  onSetSlides?: (slides: SlideContent[]) => void;
  onUpdateSlide: (id: string, patch: Partial<SlideContent>) => void;
  onRenderAllImages: () => Promise<void>;
  isRenderingImages: boolean;
  onRerollImage: (slideId: string) => Promise<void>;
  onReset: () => void;
  onExportZip: () => void;
  onSchedulePost: (postData: { title: string; imageUrls: string[]; caption: string; hashtags: string[] }) => void;
  onNavigateToSettings: () => void;
}

const INSPIRATION_PILLS = [
  "3 fatale Fehler beim B2B-Verkauf",
  "Warum 90% an Social Media scheitern",
  "5 KI-Workflows, die 10 Stunden sparen",
  "Wie man 2026 organisch Reichweite aufbaut",
];

const FORMAT_PRESETS = [
  { count: 4, label: "4 Slides", sub: "Snack-Content", badge: "Schnell" },
  { count: 7, label: "7 Slides", sub: "Instagram & LinkedIn Standard", badge: "Empfohlen" },
  { count: 10, label: "10 Slides", sub: "Tiefer Fachbeitrag", badge: "Masterclass" },
];

const ASPECT_RATIOS = [
  { id: "4:5", label: "4:5 Portrait (Instagram & LinkedIn)" },
  { id: "1:1", label: "1:1 Quadratisch (Feed-Post)" },
  { id: "9:16", label: "9:16 Hochformat (TikTok & Stories)" },
] as const;

export function ModernStudioDashboard({
  brief,
  onChangeBrief,
  brandKit,
  skills,
  activeSkillId,
  onSelectSkill,
  settings,
  slides,
  onSetSlides,
  onUpdateSlide,
  onRenderAllImages,
  isRenderingImages,
  onRerollImage,
  onReset,
  onExportZip,
  onSchedulePost,
  onNavigateToSettings,
}: ModernStudioDashboardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [rerollingSlideId, setRerollingSlideId] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const activeSkill = skills.find((s) => s.id === activeSkillId) || skills[0];
  const doneImages = slides.filter((s) => Boolean(s.imageUrl)).length;
  const hasSlides = slides.length > 0;

  // Generate structured carousel using server provider
  const handleGenerate = async () => {
    if (!brief.topic.trim()) {
      toast.error("Bitte gib zuerst ein Thema für dein Karussell ein.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateCarouselContent({
        topic: brief.topic.trim(),
        audience: brief.audience,
        slideCount: brief.slideCount || 7,
        aspectRatio: brandKit.aspectRatio || "4:5",
        brandKit,
        skill: activeSkill,
        customInstructions: brief.ctaText ? `CTA-Wunsch: ${brief.ctaText}` : undefined,
        apiKey: settings.geminiApiKey || brief.apiKey,
      });

      if (onSetSlides && res.slides) {
        onSetSlides(res.slides);
      }
      setCaptionText(res.caption || "");
      setHashtags(res.hashtags || []);
      toast.success(`${res.slides.length} Folien erfolgreich generiert! 🎉`, {
        description: `Strukturierte Daten via ${res.provider} bereitgestellt.`,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generierung fehlgeschlagen.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Single slide reroll
  const handleRerollSinglePrompt = async (slide: SlideContent) => {
    setRerollingSlideId(slide.id);
    try {
      const res = await rerollSlidePromptClient({
        topic: brief.topic,
        slideNumber: slide.slideNumber,
        slideCount: slides.length,
        currentHeadline: slide.headline,
        currentPrompt: slide.visualPrompt,
        role: slide.role,
        brandKit,
        skill: activeSkill,
        apiKey: settings.geminiApiKey,
      });

      onUpdateSlide(slide.id, {
        visualPrompt: res.visualPrompt,
        coreMetaphor: res.coreMetaphor,
      });
      toast.success(`Prompt für Folie ${slide.slideNumber} neu generiert! 🔄`);

      // If slide already had an image, reroll the image too
      if (slide.imageUrl) {
        void onRerollImage(slide.id);
      }
    } catch (err: unknown) {
      toast.error("Reroll fehlgeschlagen.");
    } finally {
      setRerollingSlideId(null);
    }
  };

  const handleCopyCaption = () => {
    const fullText = `${captionText}\n\n${hashtags.join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    toast.success("Caption & Hashtags in die Zwischenablage kopiert! 📋");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    if (!onSetSlides) return;
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    const temp = next[index]!;
    next[index] = next[target]!;
    next[target] = temp;
    const updated = next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onSetSlides(updated);
  };

  const handleDeleteSlide = (index: number) => {
    if (!onSetSlides) return;
    if (slides.length <= 2) {
      toast.error("Ein Karussell benötigt mindestens 2 Slides.");
      return;
    }
    const next = slides.filter((_, i) => i !== index);
    const updated = next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onSetSlides(updated);
    toast.success("Folie gelöscht.");
  };

  const handleAddSlide = () => {
    if (!onSetSlides) return;
    const newNumber = slides.length + 1;
    const newSlide: SlideContent = {
      id: `slide-${Date.now()}`,
      slideNumber: newNumber,
      role: "expansion",
      roleLabel: "Vertiefung",
      headline: `${brief.topic} : Teil ${newNumber}`,
      subtext: "Weiterführender Impuls für deine Zielgruppe.",
      coreMetaphor: "3D Monolith",
      primaryProps: ["Studiolicht"],
      visualPrompt: `Photorealistic 3D minimal monolith, aspect ratio 4:5, clean composition, zero text, slide ${newNumber}`,
      renderStatus: "idle",
    };
    onSetSlides([...slides, newSlide]);
    toast.success(`Folie ${newNumber} hinzugefügt.`);
  };

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Active Brand & Skill Quick-Banner ────────────────────────── */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#FF4D17] to-[#FF8C00] p-[1px] shadow-lg shadow-orange-500/20">
            <div className="h-full w-full rounded-[15px] bg-[#0A0710] flex items-center justify-center overflow-hidden">
              {brandKit.logoUrl ? (
                <img src={brandKit.logoUrl} alt="Brand" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#FF4D17]">SC</span>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-sans">
                {brandKit.name || "Brand-Kit aktiv"}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {brandKit.handle}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-zinc-400">Aktiver KI-Skill:</span>
              <span className="text-[11px] font-bold text-[#FF6A1F]">
                {activeSkill ? activeSkill.name : "Standard"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <Palette className="h-3.5 w-3.5 text-[#FF6A1F]" />
          <span>Brand-Kit & Skills bearbeiten</span>
        </button>
      </div>

      {/* ── STUFE 1: THEMA & FORMAT EINGEBEN ────────────────────────── */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D17] flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Schritt 1: Thema & Konfiguration
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Worüber möchtest du heute posten?
            </h2>
          </div>

          {/* KI-Skill Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 hidden sm:inline">KI-Skill:</span>
            <select
              value={activeSkillId || (skills[0] ? skills[0].id : "")}
              onChange={(e) => onSelectSkill?.(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#120F17] px-3 py-1.5 text-xs font-semibold text-white focus:border-[#FF4D17] outline-none cursor-pointer"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.tone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thema Input */}
        <div className="space-y-3">
          <textarea
            rows={3}
            value={brief.topic}
            onChange={(e) => onChangeBrief({ topic: e.target.value })}
            placeholder="z. B. Die 5 fatalsten Denkfehler bei der Neukundengewinnung und wie man sie sofort löst…"
            className="w-full rounded-2xl border border-white/15 bg-white/[0.02] p-4 text-sm text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none leading-relaxed transition-all"
          />

          {/* Quick Inspiration Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">
              Inspiration:
            </span>
            {INSPIRATION_PILLS.map((pill, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChangeBrief({ topic: pill })}
                className="shrink-0 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Format & Slide Count Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-white/[0.06] items-center">
          {/* Slide Count Presets (7 Spalten) */}
          <div className="md:col-span-8 flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-zinc-400 font-bold mr-1">Länge:</span>
            {FORMAT_PRESETS.map((fmt) => {
              const isSel = (brief.slideCount || 7) === fmt.count;
              return (
                <button
                  key={fmt.count}
                  type="button"
                  onClick={() => onChangeBrief({ slideCount: fmt.count })}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                    isSel
                      ? "border-[#FF4D17] bg-[#FF4D17]/15 text-[#FF6A1F] shadow-lg shadow-orange-500/10"
                      : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>{fmt.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                    {fmt.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Aspect Ratio (4 Spalten) */}
          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <span className="text-xs text-zinc-400 font-bold">Format:</span>
            <select
              value={brandKit.aspectRatio || "4:5"}
              onChange={(e) => onChangeBrief({ aspectRatio: e.target.value as any })}
              className="rounded-xl border border-white/15 bg-[#120F17] px-3 py-2 text-xs font-bold text-white focus:border-[#FF4D17] outline-none cursor-pointer"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !brief.topic.trim()}
            className={cn(
              "w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer",
              isGenerating || !brief.topic.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-[#FF4D17] hover:bg-[#FF6A1F] shadow-xl shadow-orange-500/30 hover:scale-[1.01]"
            )}
          >
            <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
            <span>{isGenerating ? "Erstelle Storyboard & Prompts..." : "Inhalte generieren"}</span>
          </button>
        </div>
      </div>

      {/* ── STUFE 2: KARUSSELL-VORSCHAU & LIVE BILD-FORTSCHRITT ──────── */}
      {hasSlides && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Action Header Bar */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Schritt 2: Karussell-Vorschau ({slides.length} Slides)
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {brief.topic || "Generiertes Karussell"}
              </h3>
              <p className="text-xs text-zinc-400">
                {doneImages === slides.length
                  ? "Alle Visuals vollständig gerendert! Bereit zur Veröffentlichung."
                  : `${doneImages} von ${slides.length} Bildern gerendert. Du kannst Texte anpassen oder Prompts einzeln neu generieren.`}
              </p>
            </div>

            {/* Actions: Render Images, Schedule, ZIP */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => void onRenderAllImages()}
                disabled={isRenderingImages}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-black text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={cn("h-3.5 w-3.5", isRenderingImages && "animate-spin")} />
                <span>{isRenderingImages ? "Rendere Visuals..." : "Alle Bilder rendern"}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSchedulePost({
                    title: brief.topic,
                    imageUrls: slides.map((s) => s.imageUrl).filter(Boolean) as string[],
                    caption: captionText || brief.topic,
                    hashtags,
                  })
                }
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-[#FF6A1F]" />
                <span>Im Kalender planen</span>
              </button>

              <button
                type="button"
                onClick={onExportZip}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>ZIP Export</span>
              </button>
            </div>
          </div>

          {/* Slides Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {slides.map((s, idx) => {
              const isHook = idx === 0;
              const isClosing = idx === slides.length - 1;
              const isRendering = s.isGeneratingImage;
              const isRerolling = rerollingSlideId === s.id;

              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-3xl border p-4 space-y-3 transition-all bg-black/50 backdrop-blur-xl flex flex-col justify-between group",
                    isHook
                      ? "border-[#FF4D17]/40 ring-1 ring-[#FF4D17]/30"
                      : isClosing
                      ? "border-emerald-500/30 ring-1 ring-emerald-500/20"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  {/* Card Top: Number & Role Badge */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                      Folie {s.slideNumber}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        isHook
                          ? "bg-[#FF4D17]/20 border-[#FF4D17]/40 text-[#FF6A1F]"
                          : isClosing
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 border-white/10 text-zinc-400"
                      )}
                    >
                      {s.roleLabel || s.role}
                    </span>
                  </div>

                  {/* Image Render Area with Progress Bar */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 flex items-center justify-center">
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.headline}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : isRendering ? (
                      <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center space-y-3 bg-black/80">
                        <RefreshCw className="h-6 w-6 text-[#FF4D17] animate-spin" />
                        <div className="w-full space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                            <span>Rendering</span>
                            <span>{s.renderProgress ?? 35}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF4D17] to-amber-500 transition-all duration-300"
                              style={{ width: `${s.renderProgress ?? 35}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col justify-between text-[11px] text-zinc-400 bg-gradient-to-br from-zinc-900/90 to-black">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#FF4D17]">
                          3D Konzept
                        </span>
                        <p className="line-clamp-4 italic text-zinc-300">
                          &quot;{s.visualPrompt}&quot;
                        </p>
                        <span className="text-[10px] text-zinc-500">Bereit zum Rendern</span>
                      </div>
                    )}

                    {/* Single Reroll Overlay Button */}
                    <button
                      type="button"
                      onClick={() => handleRerollSinglePrompt(s)}
                      disabled={isRerolling || isRendering}
                      className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/20 text-[10px] font-bold text-white backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer opacity-90 hover:opacity-100"
                      title="Prompt & Bild für diese Folie neu generieren"
                    >
                      <RotateCcw className={cn("h-3 w-3", isRerolling && "animate-spin text-[#FF4D17]")} />
                      <span>Reroll</span>
                    </button>
                  </div>

                  {/* Inline Editable Text */}
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Überschrift:
                      </label>
                      <input
                        type="text"
                        value={s.headline}
                        onChange={(e) => onUpdateSlide(s.id, { headline: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#FF4D17] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Fließtext:
                      </label>
                      <textarea
                        rows={2}
                        value={s.subtext}
                        onChange={(e) => onUpdateSlide(s.id, { subtext: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-2 text-[11px] text-zinc-300 focus:border-[#FF4D17] outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Card Bottom Controls (Move, Delete) */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSlide(idx, -1)}
                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                        title="Nach links verschieben"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slides.length - 1}
                        onClick={() => handleMoveSlide(idx, 1)}
                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                        title="Nach rechts verschieben"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(idx)}
                      className="p-1 rounded-lg hover:bg-white/10 hover:text-red-400 transition-colors cursor-pointer"
                      title="Folie löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Slide Tile */}
            <button
              type="button"
              onClick={handleAddSlide}
              className="rounded-3xl border border-dashed border-white/20 hover:border-[#FF4D17]/60 bg-white/[0.01] hover:bg-white/[0.03] p-6 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-all cursor-pointer min-h-[350px]"
            >
              <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF4D17]">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold">Folie hinzufügen</span>
              <span className="text-[10px] text-zinc-500">Maximal 10 Folien</span>
            </button>
          </div>

          {/* ── STUFE 3: SCHLANKER CAPTION & HASHTAG EDITOR ───────────── */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Post-Caption & Hashtags</h4>
                <p className="text-xs text-zinc-400">
                  Automatisch formatiert nach der Hook-Story-Offer Formel für maximale Interaktion.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyCaption}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
              >
                {copiedCaption ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCaption ? "Kopiert!" : "Caption kopieren"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 space-y-1.5">
                <textarea
                  rows={5}
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Caption eingeben oder anpassen..."
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.02] p-4 text-xs text-zinc-200 focus:border-[#FF4D17] outline-none leading-relaxed"
                />
              </div>

              <div className="lg:col-span-4 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Hashtags:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#FF6A1F]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
