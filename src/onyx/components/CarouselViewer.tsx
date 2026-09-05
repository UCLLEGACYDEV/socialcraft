import { Download, RotateCcw, Sparkles, X } from "lucide-react";
import type { ApiSettings, BrandKit, SlideContent } from "../types";

interface CarouselViewerProps {
  slides: SlideContent[];
  topic: string;
  isGeneratingImages: boolean;
  onGenerateImages: () => void;
  onCancelGeneration: () => void;
  onRerollImage: (slideId: string) => void;
  onEditSlide: (slideId: string) => void;
  onDownloadSingle: (slideId: string) => void;
  onExportZip: () => void;
  onReset: () => void;
  settings: ApiSettings;
  brandKit: BrandKit;
}

import { SlideCard } from "./SlideCard";

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
  onReset,
  settings,
  brandKit,
}: CarouselViewerProps) {
  const done = slides.filter((s) => s.imageUrl).length;
  const ratio = brandKit.aspectRatio === "1:1" ? "1 / 1" : "4 / 5";

  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{topic || "Karussell"}</h1>
          <p className="text-xs text-muted-foreground">
            {slides.length}-Slide Sequenz · {done} von {slides.length} Visuals bereit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Neues Karussell
          </button>
          {isGeneratingImages ? (
            <button
              type="button"
              onClick={onCancelGeneration}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-2 text-xs font-medium text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Generierung abbrechen
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerateImages}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-foreground/[0.06] px-3 py-2 text-xs font-medium hover:bg-foreground/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary-bright" /> Alle {slides.length} Visuals
              laden
            </button>
          )}
          <button
            type="button"
            onClick={onExportZip}
            disabled={done === 0}
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> 1080×1350 ZIP-Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {slides.map((slide) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            aspectRatio={ratio}
            modelName={settings.provider === "mock" ? "Studio Preset" : settings.kieModel}
            onReroll={() => onRerollImage(slide.id)}
            onEdit={() => onEditSlide(slide.id)}
            onDownload={() => onDownloadSingle(slide.id)}
            {...(isGeneratingImages ? { onCancel: onCancelGeneration } : {})}
          />
        ))}
      </div>
    </div>
  );
}
