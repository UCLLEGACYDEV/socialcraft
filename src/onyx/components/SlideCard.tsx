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
      className="group relative overflow-hidden rounded-xl border border-border bg-foreground/[0.03] transition-all duration-200 hover:ember-glow"
      style={{ aspectRatio }}
    >
      {done && slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt={`Slide ${slide.slideNumber} — ${slide.roleLabel}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center">
          <span className="text-4xl font-extrabold tracking-tight text-foreground/25">
            {String(slide.slideNumber).padStart(2, "0")}
          </span>
          <span className="mono-label">{slide.roleLabel}</span>
          {!slide.isGeneratingImage && (
            <span className="text-xs text-muted-foreground">noch nicht gerendert</span>
          )}
        </div>
      )}

      {slide.isGeneratingImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary-bright" />
          <span className="text-xs font-medium text-muted-foreground">
            {modelName} generiert…
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-1 flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Abbrechen
            </button>
          )}
        </div>
      )}

      {done && (
        <>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/85 px-2.5 py-2 text-xs backdrop-blur-md">
            <span className="truncate font-medium text-foreground/90">
              {slide.slideNumber} · {slide.roleLabel}
            </span>
            <span className="flex shrink-0 gap-2.5 font-medium">
              <button type="button" onClick={onReroll} className="hover:text-primary-bright">
                Neu machen
              </button>
              <button type="button" onClick={onEdit} className="hover:text-primary-bright">
                Edit
              </button>
            </span>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-background/70 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
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
        "flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105",
        tone === "light" && "bg-foreground text-background",
        tone === "accent" && "bg-primary text-primary-foreground",
        tone === "glass" && "border border-border bg-foreground/10 text-foreground",
      )}
    >
      {children}
    </button>
  );
}
