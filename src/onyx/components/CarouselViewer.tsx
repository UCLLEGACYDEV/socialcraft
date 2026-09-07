import {
  ArrowLeft,
  Calendar,
  CloudUpload,
  Download,
  Grid3X3,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import type { ApiSettings, BrandKit, SlideContent } from "../types";
import { SlideCard } from "./SlideCard";
import { SlideInspectModal } from "./SlideInspectModal";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CarouselViewerProps {
  slides: SlideContent[];
  topic: string;
  isGeneratingImages: boolean;
  onGenerateImages: () => void;
  onCancelGeneration: () => void;
  onRerollImage: (slideId: string) => void;
  onEditSlide: (slideId: string) => void;
  onDownloadSingle: (slideId: string, withOverlay?: boolean) => void;
  onExportZip: (withOverlay?: boolean) => void;
  onSaveToCloud?: (() => void) | undefined;
  onSchedulePost?: (() => void) | undefined;
  onReset: () => void;
  settings: ApiSettings;
  brandKit: BrandKit;
  onUpdateSlides?: (slides: SlideContent[]) => void;
  onAddSlide?: () => void;
}

export function CarouselViewer({
  slides,
  topic,
  isGeneratingImages,
  onGenerateImages,
  onCancelGeneration,
  onRerollImage,
  onEditSlide,
  onDownloadSingle,
  onExportZip,
  onSaveToCloud,
  onSchedulePost,
  onReset,
  settings,
  brandKit,
  onUpdateSlides,
  onAddSlide,
}: CarouselViewerProps) {
  const [withOverlay, setWithOverlay] = useState(true);
  const [showSquareGuide, setShowSquareGuide] = useState(false);
  const [inspectingSlideId, setInspectingSlideId] = useState<string | null>(null);
  const done = slides.filter((s) => s.imageUrl).length;
  const ratio = brandKit.aspectRatio === "1:1" ? "1 / 1" : "4 / 5";

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    if (!onUpdateSlides) return;
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    const temp = next[index]!;
    next[index] = next[target]!;
    next[target] = temp;
    const updated = next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onUpdateSlides(updated);
  };

  const handleDeleteSlide = (index: number) => {
    if (!onUpdateSlides) return;
    if (slides.length <= 2) {
      toast.error("Ein Karussell benötigt mindestens 2 Slides.");
      return;
    }
    const next = slides.filter((_, i) => i !== index);
    const updated = next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onUpdateSlides(updated);
    toast.success("Slide gelöscht");
  };

  return (
    <div className="space-y-5">
      <div className="cryptox-card relative overflow-hidden flex flex-wrap items-center justify-between gap-3 p-5 border border-white/[0.08]">
        <div className="min-w-0">
          <h1 className="truncate text-lg sm:text-xl font-bold text-white tracking-tight">{topic || "Karussell"}</h1>
          <p className="text-xs text-zinc-400">
            {slides.length}-Slide Sequenz · <strong className="text-orange-400">{done}</strong> von {slides.length} Visuals bereit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1:1 Instagram Feed Cut Guide Toggle */}
          <button
            type="button"
            onClick={() => setShowSquareGuide((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer",
              showSquareGuide
                ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
            )}
            title="Instagram 1:1 Profilraster-Beschnitt einblenden"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>1:1 Feed-Vorschau</span>
          </button>

          {/* Toggle for typography overlay */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={withOverlay}
              onChange={(e) => setWithOverlay(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 text-[#FF4D17] accent-[#FF4D17] cursor-pointer"
            />
            <span className="font-medium">Text & Branding einbetten</span>
          </label>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 hover:text-white transition-colors shadow-sm cursor-pointer"
            title="Zurück zum Karussell-Generator / Thema ändern"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-orange-400" />
            <span>Zurück zum Generator</span>
          </button>
          {isGeneratingImages ? (
            <button
              type="button"
              onClick={onCancelGeneration}
              className="flex items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/15 px-3.5 py-2 text-xs font-semibold text-destructive cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Generierung abbrechen
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerateImages}
              className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-4 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/25 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Alle {slides.length} Visuals laden
            </button>
          )}
          {onSchedulePost && (
            <button
              type="button"
              onClick={onSchedulePost}
              className="flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/25 px-3.5 py-2 text-xs font-semibold text-orange-400 transition-all cursor-pointer"
              title="Dieses Karussell für Facebook/Socials planen"
            >
              <Calendar className="h-3.5 w-3.5 text-orange-400" /> Planen
            </button>
          )}
          {onSaveToCloud && (
            <button
              type="button"
              onClick={() => onSaveToCloud()}
              disabled={done === 0}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <CloudUpload className="h-3.5 w-3.5" /> In Cloud speichern
            </button>
          )}
          <button
            type="button"
            onClick={() => onExportZip(withOverlay)}
            disabled={done === 0}
            className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> 1080×1350 ZIP-Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
        {slides.map((slide, idx) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            aspectRatio={ratio}
            modelName={settings.provider === "mock" ? "Studio Preset" : settings.kieModel}
            onPreview={() => setInspectingSlideId(slide.id)}
            onReroll={() => onRerollImage(slide.id)}
            onEdit={() => setInspectingSlideId(slide.id)}
            onDownload={() => onDownloadSingle(slide.id, withOverlay)}
            canMoveLeft={idx > 0}
            canMoveRight={idx < slides.length - 1}
            onMoveLeft={() => handleMoveSlide(idx, -1)}
            onMoveRight={() => handleMoveSlide(idx, 1)}
            onDelete={() => handleDeleteSlide(idx)}
            showSquareGuide={showSquareGuide}
            {...(isGeneratingImages ? { onCancel: onCancelGeneration } : {})}
          />
        ))}

        {/* Append New Slide Button */}
        {onAddSlide && (
          <button
            type="button"
            onClick={onAddSlide}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-zinc-400 hover:text-white hover:border-orange-500/40 hover:bg-white/[0.04] transition-all cursor-pointer group min-h-[200px]"
            style={{ aspectRatio: ratio }}
            title="Weitere Slide anfügen"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-orange-500/30 group-hover:bg-orange-500/15 group-hover:text-orange-400 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-center">Folie anfügen</span>
          </button>
        )}
      </div>

      {/* ── Relaxed Inspection Lightbox Modal ────────────────────── */}
      {inspectingSlideId && (
        <SlideInspectModal
          slides={slides}
          activeSlideId={inspectingSlideId}
          topicTitle={topic}
          onClose={() => setInspectingSlideId(null)}
          onSelectSlideId={setInspectingSlideId}
          onReroll={(slideId) => onRerollImage(slideId)}
          onSaveText={(slideId, patch) => onEditSlide(slideId)}
          onDownload={(slideId) => onDownloadSingle(slideId, withOverlay)}
          aspectRatio={ratio}
          modelName={settings.provider === "mock" ? "Studio Preset" : settings.kieModel}
        />
      )}
    </div>
  );
}

