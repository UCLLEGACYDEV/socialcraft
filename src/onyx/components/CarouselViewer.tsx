import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CloudUpload,
  Download,
  Grid3X3,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
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
      {/* ── Step 2 Guidance & Generation Banner ──────────────────────── */}
      <div
        className={cn(
          "rounded-3xl border p-5 sm:p-6 transition-all shadow-xl backdrop-blur-2xl relative overflow-hidden",
          isGeneratingImages
            ? "border-orange-500/50 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 shadow-[0_0_40px_rgba(255,77,23,0.15)]"
            : done === slides.length
              ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
              : "cryptox-card",
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-5 items-center rounded-md bg-orange-500/20 px-2 text-[11px] font-extrabold uppercase tracking-wider text-orange-400 border border-orange-500/30">
                Schritt 2 von 2
              </span>
              {done === slides.length ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Alle Visuals vollständig bereit!
                </span>
              ) : isGeneratingImages ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-orange-300 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />
                  Visuals werden gerendert…
                </span>
              ) : (
                <span className="text-xs font-semibold text-zinc-300">
                  Text-Konzept steht · Visuals bereit zur Generierung
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {done === slides.length ? (
                "Perfekt! Du kannst einzelne Slides über das Stift-Symbol bearbeiten, Bilder neu würfeln oder das Karussell als 1080×1350 ZIP exportieren."
              ) : isGeneratingImages ? (
                `Generiere Bild ${Math.min(slides.length, done + 1)} von ${slides.length} (ca. ${Math.max(1, (slides.length - done) * 4)} Sek. verbleibend). Bereits generierte Bilder bleiben beim Abbrechen erhalten.`
              ) : (
                <>
                  Überprüfe die Texte unten. Starte anschließend die KI-Bildgenerierung (<strong className="text-white">{slides.length - done} Credits</strong>, ca. {(slides.length - done) * 4} Sek.).
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isGeneratingImages ? (
              <button
                type="button"
                onClick={onCancelGeneration}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/50 bg-destructive/20 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/30 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Abbrechen (fertige Folien behalten)
              </button>
            ) : done < slides.length ? (
              <button
                type="button"
                onClick={onGenerateImages}
                className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold shadow-[0_0_20px_rgba(255,77,23,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {done === 0
                    ? `Alle ${slides.length} Visuals rendern (${slides.length} Credits)`
                    : `Restliche ${slides.length - done} Visuals rendern`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onExportZip(withOverlay)}
                className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold shadow-[0_0_20px_rgba(255,77,23,0.35)] flex items-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Als ZIP herunterladen</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar when generating or partially done */}
        {(isGeneratingImages || (done > 0 && done < slides.length)) && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-zinc-400 font-medium">
                Fortschritt: <strong className="text-orange-400">{done}</strong> von {slides.length} Bildern fertig
              </span>
              <span className="text-zinc-400 font-mono">
                {Math.round((done / slides.length) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(4, (done / slides.length) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

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

