import { Download, Loader2, Pencil, RefreshCw, X } from "lucide-react";
import type { SlideContent } from "../types";
import { cn } from "@/lib/utils";

interface SlideCardProps {
  slide: SlideContent;
  modelName?: string;
  aspectRatio?: string;
  onReroll: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onCancel?: () => void;
}

export function SlideCard({
  slide,
  modelName = "mock",
  aspectRatio = "4 / 5",
  onReroll,
  onEdit,
  onDownload,
  onCancel,
}: SlideCardProps) {
  const done = Boolean(slide.imageUrl) && !slide.isGeneratingImage;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-orange-500/40 hover:shadow-[0_20px_50px_-10px_rgba(255,77,23,0.2)]"
      style={{ aspectRatio }}
    >
      {done && slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt={`Slide ${slide.slideNumber} — ${slide.roleLabel}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center">
          <span className="text-4xl font-black tracking-tight text-white/15">
            {String(slide.slideNumber).padStart(2, "0")}
          </span>
          <span className="mono-label text-zinc-400">{slide.roleLabel}</span>
          {!slide.isGeneratingImage && (
            <span className="text-[11px] text-zinc-500">noch nicht gerendert</span>
          )}
        </div>
      )}

      {slide.isGeneratingImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/85 backdrop-blur-md">
          <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
          <span className="text-xs font-semibold text-zinc-300">
            {modelName} generiert…
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-1 flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" /> Abbrechen
            </button>
          )}
        </div>
      )}

      {done && (
        <>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[#0D0C12]/90 border-t border-white/[0.08] px-3 py-2 text-xs backdrop-blur-md">
            <span className="truncate font-semibold text-zinc-200">
              {slide.slideNumber} · {slide.roleLabel}
            </span>
            <span className="flex shrink-0 gap-2.5 font-medium">
              <button type="button" onClick={onReroll} className="text-zinc-400 hover:text-orange-400 transition-colors">
                Neu
              </button>
              <button type="button" onClick={onEdit} className="text-zinc-400 hover:text-white transition-colors">
                Edit
              </button>
            </span>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 bg-black/75 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
            <IconAction onClick={onDownload} label="Download" tone="light">
              <Download className="h-4 w-4" />
            </IconAction>
            <IconAction onClick={onReroll} label="Neu generieren" tone="accent">
              <RefreshCw className="h-4 w-4" />
            </IconAction>
            <IconAction onClick={onEdit} label="Bearbeiten" tone="glass">
              <Pencil className="h-4 w-4" />
            </IconAction>
          </div>
        </>
      )}
    </div>
  );
}

function IconAction({
  onClick,
  label,
  tone,
  children,
}: {
  onClick: () => void;
  label: string;
  tone: "light" | "accent" | "glass";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110",
        tone === "light" && "bg-white text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]",
        tone === "accent" && "bg-gradient-to-r from-[#FF5722] to-[#F4511E] text-white shadow-[0_0_20px_rgba(255,77,23,0.5)]",
        tone === "glass" && "border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
      )}
    >
      {children}
    </button>
  );
}
