import { ArrowLeft, Download, RotateCcw, Sparkles, X } from "lucide-react";
import type { ApiSettings, BrandKit, SlideContent } from "../types";

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
  onReset: () => void;
  settings: ApiSettings;
  brandKit: BrandKit;
}

import { SlideCard } from "./SlideCard";
import { useState } from "react";

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
  const [withOverlay, setWithOverlay] = useState(true);
  const done = slides.filter((s) => s.imageUrl).length;
  const ratio = brandKit.aspectRatio === "1:1" ? "1 / 1" : "4 / 5";

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
              className="flex items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/15 px-3.5 py-2 text-xs font-semibold text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Generierung abbrechen
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerateImages}
              className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-4 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/25 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Alle {slides.length} Visuals laden
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {slides.map((slide) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            aspectRatio={ratio}
            modelName={settings.provider === "mock" ? "Studio Preset" : settings.kieModel}
            onReroll={() => onRerollImage(slide.id)}
            onEdit={() => onEditSlide(slide.id)}
            onDownload={() => onDownloadSingle(slide.id, withOverlay)}
            {...(isGeneratingImages ? { onCancel: onCancelGeneration } : {})}
          />
        ))}
      </div>
    </div>
  );
}
