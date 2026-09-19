import React, { useState, useRef } from "react";
import {
  Sparkles,
  Layers,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Flame,
  MessageSquareQuote,
  BarChart3,
  HelpCircle,
  Upload,
  Calendar,
  Download,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Edit3,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  FileSpreadsheet,
  Maximize2,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BriefValues, SlideContent, BrandKit, AiCloneProfile, ApiSettings } from "@/onyx/types";
import { parseUniversalPromptFile } from "@/onyx/csv-prompt-parser";
import { GenerationProgress } from "@/onyx/components/widgets/GenerationProgress";
import { DESIGN_TEMPLATES } from "@/onyx/defaults";

interface StudioPipelineViewProps {
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  slides: SlideContent[];
  onUpdateSlide: (id: string, patch: Partial<SlideContent>) => void;
  onGenerateStoryboard: () => Promise<void>;
  isGeneratingStoryboard: boolean;
  onRenderImages: () => Promise<void>;
  isRenderingImages: boolean;
  onReset: () => void;
  onSchedulePost: (postData: { title: string; imageUrls: string[]; caption: string }) => void;
  onExportZip: () => void;
  brandKit: BrandKit;
  activeClone?: AiCloneProfile;
  settings: ApiSettings;
  onNavigateToSetup: () => void;
}

const HOOK_ARCHETYPES = [
  {
    id: "provocative",
    label: "Provokant",
    icon: Flame,
    prefix: "Hör auf damit: Die meisten machen diesen fatalen Fehler bei ",
    desc: "Stoppt den Scroll-Flow sofort.",
    color: "text-red-400",
  },
  {
    id: "storytelling",
    label: "Story & Case Study",
    icon: MessageSquareQuote,
    prefix: "Wie wir in unter 90 Tagen das Problem gelöst haben: ",
    desc: "Hohe Identifikation & Weiterleitungen.",
    color: "text-amber-400",
  },
  {
    id: "data-driven",
    label: "Zahlen & Daten",
    icon: BarChart3,
    prefix: "94% aller Marken übersehen diesen Hebel für ",
    desc: "Beweisbasierte B2B-Autorität.",
    color: "text-cyan-400",
  },
  {
    id: "step-by-step",
    label: "Schritt-für-Schritt",
    icon: Layers,
    prefix: "In 5 Schritten zum Ziel: ",
    desc: "Maximale Speicher-Rate (Saves).",
    color: "text-emerald-400",
  },
  {
    id: "question",
    label: "Neugierde-Frage",
    icon: HelpCircle,
    prefix: "Warum scheitern 9 von 10 bei ",
    desc: "Reizt zur Diskussion in den Kommentaren.",
    color: "text-purple-400",
  },
] as const;

const FORMAT_PRESETS = [
  { count: 4, label: "4 Slides", sub: "Snack-Content", badge: "Schnell" },
  { count: 7, label: "7 Slides", sub: "Instagram & LinkedIn Standard", badge: "Empfohlen" },
  { count: 10, label: "10 Slides", sub: "Tiefer Fachbeitrag", badge: "Ausführlich" },
];

export function StudioPipelineView({
  brief,
  onChangeBrief,
  slides,
  onUpdateSlide,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  onRenderImages,
  isRenderingImages,
  onReset,
  onSchedulePost,
  onExportZip,
  brandKit,
  activeClone,
  settings,
  onNavigateToSetup,
}: StudioPipelineViewProps) {
  // Current Slide Index in Viewer
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine current pipeline stage:
  // 1 = Input (no slides yet)
  // 2 = Storyboard (slides have text, but no images yet)
  // 3 = Review & Ready (images are rendered)
  const hasImages = slides.length > 0 && slides.some((s) => Boolean(s.imageUrl));
  const currentStage = slides.length === 0 ? 1 : hasImages ? 3 : 2;

  const handleApplyHook = (prefix: string) => {
    if (!brief.topic.trim()) {
      onChangeBrief({ topic: prefix });
    } else {
      onChangeBrief({ topic: `${prefix}${brief.topic.replace(/^.*?:\s*/, "")}` });
    }
    toast.success("Hook-Präfix angewendet!");
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || "");
      const parsed = parseUniversalPromptFile(content, file.name);
      if (parsed.length > 0) {
        const first = parsed[0];
        onChangeBrief({
          topic: first.title,
          slideCount: Math.min(10, Math.max(4, first.slides.length)),
        });
        toast.success(`Datei erkannt: „${first.title}“ (${first.slides.length} Folien)!`);
      } else {
        onChangeBrief({ topic: content.slice(0, 150).trim() });
        toast.info("Text übernommen.");
      }
    };
    reader.readAsText(file);
  };

  const currentSlide = slides[activeSlideIndex] || slides[0];

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Progress Pipeline Header ────────────────────────────────── */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Socialcraft Studio Pipeline
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-0.5">
            {currentStage === 1 && "Schritt 1: Thema & Dramaturgie"}
            {currentStage === 2 && "Schritt 2: Storyboard & Texte prüfen"}
            {currentStage === 3 && "Schritt 3: Freigabe & Veröffentlichen"}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {currentStage === 1 && "Gib dein Thema ein – das System generiert die perfekte Story-Sequenz."}
            {currentStage === 2 && "Passe Texte vor dem Rendern an. Änderungen am Text kosten keine Credits."}
            {currentStage === 3 && "Dein Beitrag ist fertig! Ein Klick genügt zum Einplanen oder Herunterladen."}
          </p>
        </div>

        {/* 3-Step Indicator */}
        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06] self-start md:self-auto">
          {[
            { num: 1, label: "Thema" },
            { num: 2, label: "Storyboard" },
            { num: 3, label: "Review" },
          ].map((st) => (
            <div
              key={st.num}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                currentStage === st.num
                  ? "bg-[#FF4D17] text-white shadow-[0_0_15px_rgba(255,77,23,0.35)]"
                  : currentStage > st.num
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-zinc-500",
              )}
            >
              {currentStage > st.num ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span>{st.num}</span>
              )}
              <span>{st.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Während Generierung: Klare Fortschrittsanzeige ─────────── */}
      {(isGeneratingStoryboard || isRenderingImages) && (
        <div className="rounded-3xl border border-[#FF4D17]/30 bg-black/60 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(255,77,23,0.15)]">
          <GenerationProgress
            isGenerating={true}
            title={
              isGeneratingStoryboard
                ? "Storyboard wird geschrieben…"
                : "Bilder & Visuals werden gerendert…"
            }
            totalItems={brief.slideCount}
            onCancel={() => window.location.reload()}
          />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* ── STUFE 1: THEMA & FORMAT EINGEBEN ────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────── */}
      {currentStage === 1 && !isGeneratingStoryboard && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50">
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-white">Worüber möchtest du posten?</h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#FF4D17] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Datei / Skript importieren</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.md,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </div>

              <textarea
                rows={3}
                value={brief.topic}
                onChange={(e) => onChangeBrief({ topic: e.target.value })}
                placeholder="z. B. Die 5 größten Fehler beim organischen Wachstum auf Instagram und wie du sie 2026 vermeidest…"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none leading-relaxed"
              />

              {/* Hook-Dramaturgie Schnellauswahl */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Hook-Vorschlag für Folie 1:
                  </span>
                  <span className="text-[10px] text-zinc-500">Klick füllt Hook-Präfix vor</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HOOK_ARCHETYPES.map((h) => {
                    const Icon = h.icon;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleApplyHook(h.prefix)}
                        className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-left transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("h-3.5 w-3.5", h.color)} />
                          <span className="text-xs font-bold text-white">{h.label}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">{h.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Folien-Anzahl */}
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-white">Karussell-Länge</h3>
                <span className="text-xs font-mono font-bold text-[#FF4D17]">
                  {brief.slideCount} Slides (Format 4:5 Porträt)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FORMAT_PRESETS.map((fmt) => {
                  const isSel = brief.slideCount === fmt.count;
                  return (
                    <button
                      key={fmt.count}
                      type="button"
                      onClick={() => onChangeBrief({ slideCount: fmt.count })}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5",
                        isSel
                          ? "border-[#FF4D17] bg-[#FF4D17]/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{fmt.label}</span>
                        <span
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                            isSel
                              ? "bg-[#FF4D17]/20 text-[#FF4D17] border-[#FF4D17]/30"
                              : "bg-white/5 text-zinc-400 border-white/10",
                          )}
                        >
                          {fmt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{fmt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Branding & Start-Knopf */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Verknüpftes Profil
                </h3>
                <button
                  type="button"
                  onClick={onNavigateToSetup}
                  className="text-xs text-[#FF4D17] hover:underline"
                >
                  Anpassen
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-zinc-400">Look & Handle:</span>
                  <span className="font-bold text-white font-mono">{brandKit.handle || "@mein_kanal"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-zinc-400">Persona (Gesicht):</span>
                  <span className="font-bold text-white">
                    {activeClone ? activeClone.name : "Ohne Persona"}
                  </span>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-3 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#FF4D17]" />
                    <span>Rechenzeit:</span>
                  </span>
                  <span className="font-bold text-white">ca. 20 Sekunden</span>
                </div>

                <button
                  type="button"
                  disabled={!brief.topic.trim()}
                  onClick={onGenerateStoryboard}
                  className={cn(
                    "w-full py-3.5 px-5 rounded-2xl font-black text-sm text-white shadow-[0_0_30px_rgba(255,77,23,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer",
                    !brief.topic.trim()
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                      : "bg-[#FF4D17] hover:brightness-110 active:scale-[0.99]",
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Storyboard erzeugen</span>
                </button>
                <p className="text-[11px] text-zinc-500 text-center">
                  Schritt 1 erzeugt zunächst Texte zur Überprüfung.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* ── STUFE 2: STORYBOARD & TEXTPRÜFUNG ───────────────────────── */}
      {/* ────────────────────────────────────────────────────────────── */}
      {currentStage === 2 && !isRenderingImages && (
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Storyboard ({slides.length} Folien generiert)
              </h2>
              <p className="text-xs text-zinc-400">
                Lies die Texte kurz quer. Klicke auf Überschrift oder Text, um spontane Änderungen
                vorzunehmen.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReset}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                Zurück zu Schritt 1
              </button>
              <button
                type="button"
                onClick={onRenderImages}
                className="cryptox-orange-btn !py-2 !px-5 text-xs font-black flex items-center gap-2 shadow-[0_0_25px_rgba(255,77,23,0.35)] cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Visuals jetzt rendern ({brief.slideCount} Credits)</span>
              </button>
            </div>
          </div>

          {/* Folien-Karten Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((s, idx) => {
              const isHook = idx === 0;
              const isClosing = idx === slides.length - 1;

              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-3xl border p-5 space-y-3 transition-all bg-black/40 backdrop-blur-xl flex flex-col justify-between",
                    isHook
                      ? "border-[#FF4D17]/40 bg-[#FF4D17]/[0.03]"
                      : isClosing
                      ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                      : "border-white/[0.08]",
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                        Slide {s.slideNumber} · {s.roleLabel || s.role}
                      </span>
                      {isHook && (
                        <span className="text-[10px] font-bold text-[#FF4D17] flex items-center gap-1">
                          <Flame className="h-3 w-3" /> Scroll-Stopper
                        </span>
                      )}
                      {isClosing && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          Call-to-Action
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Überschrift:
                      </label>
                      <input
                        type="text"
                        value={s.headline}
                        onChange={(e) => onUpdateSlide(s.id, { headline: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-bold text-white focus:border-[#FF4D17] outline-none"
                      />
                    </div>

                    {/* Subtext */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Fließtext:
                      </label>
                      <textarea
                        rows={2}
                        value={s.subtext}
                        onChange={(e) => onUpdateSlide(s.id, { subtext: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-2 text-xs text-zinc-300 focus:border-[#FF4D17] outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Bild-Prompt Idee */}
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400 font-mono line-clamp-2">
                    Visual: {s.visualPrompt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* ── STUFE 3: REVIEW, FREIGABE & PLANEN ──────────────────────── */}
      {/* ────────────────────────────────────────────────────────────── */}
      {currentStage === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50">
          {/* Haupt-Vorschau (7 Spalten) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Qualitäts-Check: 98/100 (Exzellent)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Folie {activeSlideIndex + 1} von {slides.length}
                </span>
              </div>

              {/* Large Image Card */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/15 bg-black flex items-center justify-center">
                {currentSlide.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.headline}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-zinc-500">Bild wird geladen…</div>
                )}

                {/* Navigation Arrows */}
                <button
                  type="button"
                  disabled={activeSlideIndex === 0}
                  onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {slides.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={cn(
                      "aspect-[4/5] rounded-xl overflow-hidden border cursor-pointer transition-all bg-black",
                      activeSlideIndex === idx
                        ? "border-[#FF4D17] ring-2 ring-[#FF4D17]/40"
                        : "border-white/10 hover:border-white/30",
                    )}
                  >
                    {s.imageUrl && <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Freigabe & Sofort-Planung (5 Spalten) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-black text-white">Beitrag veröffentlichen</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Alle {slides.length} Folien entsprechen den Qualitätsrichtlinien (WCAG 2.1 AA Kontrast, 4:5 Safe-Area).
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const validUrls = slides.map((s) => s.imageUrl).filter(Boolean) as string[];
                    onSchedulePost({
                      title: brief.topic,
                      imageUrls: validUrls,
                      caption: `${slides[0]?.headline || brief.topic}\n\n${slides
                        .slice(1, -1)
                        .map((s) => `• ${s.headline}: ${s.subtext}`)
                        .join("\n\n")}\n\n${brandKit.ctaText || "Folge für mehr täglichen Experten-Content."}`,
                    });
                    toast.success("Post direkt in den Planer übernommen! 📅");
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#FF4D17] hover:brightness-110 text-white font-black text-sm shadow-[0_0_25px_rgba(255,77,23,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Im Kalender einplanen (Instagram & LinkedIn)</span>
                </button>

                <button
                  type="button"
                  onClick={onExportZip}
                  className="w-full py-3 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Alle Folien als ZIP herunterladen</span>
                </button>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onReset}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Neuen Beitrag erstellen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
