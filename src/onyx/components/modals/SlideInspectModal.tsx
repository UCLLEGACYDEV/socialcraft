import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import type { SlideContent } from "@/onyx/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SlideInspectModalProps {
  slides: SlideContent[];
  activeSlideId: string;
  topicTitle?: string;
  onClose: () => void;
  onSelectSlideId: (slideId: string) => void;
  onReroll: (slideId: string, customPrompt?: string) => Promise<void> | void;
  onSaveText: (slideId: string, patch: { headline: string; subtext: string; visualPrompt: string }) => void;
  onDownload?: (slideId: string) => void;
  selectedSlideIds?: string[];
  onToggleSelect?: (slideId: string) => void;
  aspectRatio?: string;
  modelName?: string;
}

export function SlideInspectModal({
  slides,
  activeSlideId,
  topicTitle,
  onClose,
  onSelectSlideId,
  onReroll,
  onSaveText,
  onDownload,
  selectedSlideIds,
  onToggleSelect,
  aspectRatio = "4 / 5",
  modelName = "ONYX Engine",
}: SlideInspectModalProps) {
  const currentIndex = Math.max(0, slides.findIndex((s) => s.id === activeSlideId));
  const currentSlide = slides[currentIndex] || slides[0];
  const filmstripRef = useRef<HTMLDivElement | null>(null);

  const [headline, setHeadline] = useState(currentSlide?.headline || "");
  const [subtext, setSubtext] = useState(currentSlide?.subtext || "");
  const [prompt, setPrompt] = useState(currentSlide?.visualPrompt || "");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (filmstripRef.current && currentSlide) {
      const activeEl = filmstripRef.current.querySelector(`[data-slide-id="${currentSlide.id}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentSlide?.id]);

  useEffect(() => {
    if (currentSlide) {
      setHeadline(currentSlide.headline || "");
      setSubtext(currentSlide.subtext || "");
      setPrompt(currentSlide.visualPrompt || "");
      setIsEditingPrompt(false);
    }
  }, [currentSlide?.id, currentSlide?.headline, currentSlide?.subtext, currentSlide?.visualPrompt]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onSelectSlideId(slides[currentIndex - 1]!.id);
      } else if (e.key === "ArrowRight" && currentIndex < slides.length - 1) {
        onSelectSlideId(slides[currentIndex + 1]!.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, slides, onClose, onSelectSlideId]);

  if (!currentSlide) return null;

  const isSelected = selectedSlideIds ? selectedSlideIds.includes(currentSlide.id) : true;
  const isGenerating = Boolean(currentSlide.isGeneratingImage);
  const hasImage = Boolean(currentSlide.imageUrl) && !isGenerating;

  const handleCopyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      toast.success("Visual-Prompt kopiert!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveAndReroll = async () => {
    setIsRerolling(true);
    onSaveText(currentSlide.id, { headline, subtext, visualPrompt: prompt });
    try {
      await onReroll(currentSlide.id, prompt);
    } finally {
      setIsRerolling(false);
    }
  };

  const handleQuickReroll = async () => {
    setIsRerolling(true);
    try {
      await onReroll(currentSlide.id);
    } finally {
      setIsRerolling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0C0A12] shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header ────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-3.5 sm:px-7 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF4D17] to-[#FFA043] font-mono text-xs font-black text-white shadow-[0_0_12px_#FF4D17]">
              #{currentSlide.slideNumber}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm sm:text-base font-bold text-white tracking-tight">
                  {topicTitle ? `${topicTitle} — ` : ""}Slide {currentSlide.slideNumber} von {slides.length}
                </h2>
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                  {currentSlide.roleLabel || "Slide Visual"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Tastatur: <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-zinc-300">←</kbd> Vorheriges / <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-zinc-300">→</kbd> Nächstes · <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-zinc-300">Esc</kbd> Schließen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <button
                type="button"
                onClick={() => onToggleSelect(currentSlide.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "border-[#FF4D17] bg-[#FF4D17]/15 text-[#FF6A1F]"
                    : "border-white/15 bg-white/5 text-zinc-400 hover:text-white",
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                    isSelected ? "border-[#FF4D17] bg-[#FF4D17] text-white" : "border-white/30 bg-black/40",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span>{isSelected ? "Ausgewählt" : "Abgewählt"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Main Stage Area (2-Column Grid) ────────────────────────── */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left / Center Visual Preview Stage (7 Cols) */}
          <div className="relative flex flex-col items-center justify-center bg-black/50 p-4 sm:p-8 lg:col-span-7 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
            {/* Previous Slide Button */}
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={() => onSelectSlideId(slides[currentIndex - 1]!.id)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-[#FF4D17] hover:border-[#FF4D17] cursor-pointer"
                title="Vorheriges Bild (Pfeil Links)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Next Slide Button */}
            {currentIndex < slides.length - 1 && (
              <button
                type="button"
                onClick={() => onSelectSlideId(slides[currentIndex + 1]!.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-[#FF4D17] hover:border-[#FF4D17] cursor-pointer"
                title="Nächstes Bild (Pfeil Rechts)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Image Container with Framing */}
            <div
              className="relative flex w-full max-w-[420px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#14121B] shadow-2xl transition-all"
              style={{ aspectRatio }}
            >
              {hasImage ? (
                <img
                  src={currentSlide.imageUrl}
                  alt={`Slide ${currentSlide.slideNumber}`}
                  className="h-full w-full object-cover"
                />
              ) : isGenerating || isRerolling ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-[#FF6A1F]" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Visual wird gerendert…</p>
                    <p className="text-xs text-zinc-400">{modelName} arbeitet</p>
                  </div>
                  {currentSlide.renderProgress !== undefined && currentSlide.renderProgress > 0 && (
                    <div className="w-40 space-y-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF4D17] to-[#FFA043] transition-all duration-300"
                          style={{ width: `${currentSlide.renderProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-orange-400">{currentSlide.renderProgress}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="text-5xl font-black text-white/15">
                    {String(currentSlide.slideNumber).padStart(2, "0")}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-300">Noch kein Bild generiert</p>
                    <p className="text-xs text-zinc-500">Klicke unten auf „Jetzt neu generieren“</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickReroll}
                    className="mt-2 cryptox-orange-btn !py-2 !px-4 text-xs font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Visual generieren
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Details, Text, Prompt & Actions (5 Cols) */}
          <div className="flex flex-col justify-between p-5 sm:p-7 lg:col-span-5 space-y-6">
            <div className="space-y-5">
              {/* Slide Headline & Text */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Slide-Inhalte</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPrompt((prev) => !prev)}
                    className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>{isEditingPrompt ? "Vorschau" : "Bearbeiten"}</span>
                  </button>
                </div>

                {isEditingPrompt ? (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Headline</label>
                      <input
                        className="field-input text-xs"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Headline..."
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Subtext</label>
                      <input
                        className="field-input text-xs"
                        value={subtext}
                        onChange={(e) => setSubtext(e.target.value)}
                        placeholder="Subtext..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                    <h3 className="text-base font-bold text-white">{headline || "Keine Headline"}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{subtext || "Kein Subtext"}</p>
                  </div>
                )}
              </div>

              {/* Visual Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Visual Prompt (KI)</span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{isCopied ? "Kopiert!" : "Prompt kopieren"}</span>
                  </button>
                </div>

                {isEditingPrompt ? (
                  <textarea
                    rows={5}
                    className="field-input text-xs leading-relaxed font-mono"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Bild-Prompt..."
                  />
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3.5 max-h-[140px] overflow-y-auto font-mono text-xs leading-relaxed text-zinc-300">
                    {prompt || "Kein Prompt definiert"}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-2">
                {isEditingPrompt ? (
                  <button
                    type="button"
                    onClick={handleSaveAndReroll}
                    disabled={isRerolling || isGenerating}
                    className="flex-1 cryptox-orange-btn !py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {isRerolling || isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span>Speichern & Neu rendern</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuickReroll}
                    disabled={isRerolling || isGenerating}
                    className="flex-1 cryptox-orange-btn !py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,23,0.35)]"
                  >
                    {isRerolling || isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span>Dieses Bild neu machen</span>
                  </button>
                )}

                {hasImage && onDownload && (
                  <button
                    type="button"
                    onClick={() => onDownload(currentSlide.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:text-white"
                    title="Slide in voller Auflösung herunterladen"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>

              {isEditingPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveText(currentSlide.id, { headline, subtext, visualPrompt: prompt });
                    setIsEditingPrompt(false);
                    toast.success("Änderungen gespeichert");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Nur Text speichern (ohne Rendern)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Filmstrip Dock (Ultra-clean Lightroom/Apple Studio Style) ─ */}
        <div className="shrink-0 border-t border-white/[0.08] bg-[#07060B]/95 px-4 py-3 backdrop-blur-2xl relative">
          {/* Subtle Top Glowing Rim */}
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-[#FF4D17]/40 to-transparent pointer-events-none" />

          <div className="relative mx-auto flex max-w-full items-center justify-between gap-2">
            {/* Scroll Left Button */}
            {slides.length > 5 && (
              <button
                type="button"
                onClick={() => filmstripRef.current?.scrollBy({ left: -220, behavior: "smooth" })}
                className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-[#FF4D17]/40 hover:bg-[#FF4D17]/10 transition-all cursor-pointer shadow-sm"
                title="Nach links scrollen"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Scrollable Filmstrip Track (Zero native scrollbars, smooth mouse wheel support) */}
            <div
              ref={filmstripRef}
              onWheel={(e) => {
                if (e.deltaY) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className="flex flex-1 items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar scrollbar-none py-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {slides.map((s, idx) => {
                const isActive = s.id === currentSlide.id;
                const sHasImg = Boolean(s.imageUrl);
                return (
                  <button
                    key={s.id}
                    data-slide-id={s.id}
                    type="button"
                    onClick={() => onSelectSlideId(s.id)}
                    title={`Slide ${s.slideNumber}: ${s.roleLabel || "Visual"}`}
                    className={cn(
                      "group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer shrink-0 select-none",
                      "w-16 sm:w-20 h-[76px] sm:h-[92px]",
                      isActive
                        ? "border-[#FF4D17] ring-2 ring-[#FF4D17]/80 shadow-[0_0_25px_rgba(255,77,23,0.55)] -translate-y-1 scale-105 bg-[#171422] z-10"
                        : "border-white/10 bg-black/40 opacity-60 hover:opacity-100 hover:border-white/30 hover:scale-102 hover:-translate-y-0.5",
                    )}
                  >
                    {/* Background Image / Placeholder */}
                    {sHasImg ? (
                      <img
                        src={s.imageUrl}
                        alt={`Slide ${s.slideNumber}`}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black font-mono text-xs font-black text-white/20">
                        {String(s.slideNumber).padStart(2, "0")}
                      </div>
                    )}

                    {/* Top Slide Number Pill */}
                    <div className="relative z-10 w-full flex items-center justify-between p-1.5 pointer-events-none">
                      <span
                        className={cn(
                          "flex h-4 min-w-4 items-center justify-center rounded px-1 font-mono text-[9px] font-black shadow-md backdrop-blur-sm",
                          isActive
                            ? "bg-[#FF4D17] text-white"
                            : "bg-black/80 text-zinc-300 border border-white/10",
                        )}
                      >
                        #{s.slideNumber}
                      </span>
                      {isActive && (
                        <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] shadow-[0_0_8px_#FF4D17] animate-pulse" />
                      )}
                    </div>

                    {/* Generating Spinner Overlay */}
                    {s.isGeneratingImage && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-[2px]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#FF6A1F]" />
                      </div>
                    )}

                    {/* Bottom Role Label Banner */}
                    <div className="relative z-10 w-full bg-black/90 px-1 py-1 text-center backdrop-blur-md border-t border-white/10">
                      <p
                        className={cn(
                          "truncate font-bold leading-tight text-[8px] sm:text-[9px] tracking-tight",
                          isActive ? "text-[#FFA043]" : "text-zinc-400 group-hover:text-zinc-200",
                        )}
                      >
                        {s.roleLabel || `Slide ${s.slideNumber}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            {slides.length > 5 && (
              <button
                type="button"
                onClick={() => filmstripRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
                className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-[#FF4D17]/40 hover:bg-[#FF4D17]/10 transition-all cursor-pointer shadow-sm"
                title="Nach rechts scrollen"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
