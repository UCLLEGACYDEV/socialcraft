import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { SlideContent } from "../types";
import { cn } from "@/lib/utils";

interface SlideCardProps {
  slide: SlideContent;
  modelName?: string | undefined;
  aspectRatio?: string | undefined;
  selectable?: boolean | undefined;
  isSelected?: boolean | undefined;
  onToggleSelect?: (() => void) | undefined;
  onStartSingle?: (() => void) | undefined;
  onReroll: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onCancel?: (() => void) | undefined;
  canMoveLeft?: boolean | undefined;
  canMoveRight?: boolean | undefined;
  onMoveLeft?: (() => void) | undefined;
  onMoveRight?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  showSquareGuide?: boolean | undefined;
}

export function SlideCard({
  slide,
  modelName = "mock",
  aspectRatio = "4 / 5",
  selectable,
  isSelected,
  onToggleSelect,
  onStartSingle,
  onReroll,
  onEdit,
  onDownload,
  onCancel,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onDelete,
  showSquareGuide,
}: SlideCardProps) {
  const done = Boolean(slide.imageUrl) && !slide.isGeneratingImage;
  const progress = Math.min(100, Math.max(0, slide.renderProgress ?? 0));
  const isCancelled = slide.renderStatus === "cancelled";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-[#110F17]/85 backdrop-blur-xl transition-all duration-300",
        isSelected
          ? "border-[#FF4D17] ring-2 ring-[#FF4D17]/60 shadow-[0_0_25px_rgba(255,77,23,0.35)]"
          : "border-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.5)] hover:border-orange-500/40 hover:shadow-[0_20px_50px_-10px_rgba(255,77,23,0.2)]",
      )}
      style={{ aspectRatio }}
    >
      {/* ── Top-Left Select Checkbox ─────────────────────────────────── */}
      {selectable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          className={cn(
            "absolute left-2.5 top-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-200",
            isSelected
              ? "border-[#FF4D17] bg-[#FF4D17] text-white shadow-[0_0_10px_#FF4D17]"
              : "border-white/30 bg-black/60 text-transparent hover:border-white/60 hover:bg-black/80",
          )}
          aria-label={isSelected ? "Slide abwählen" : "Slide auswählen"}
        >
          <Check className={cn("h-3.5 w-3.5 stroke-[3]", isSelected ? "text-white" : "opacity-0")} />
        </button>
      )}

      {/* ── Top-Right Slide Reordering & Delete Controls ────────────── */}
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canMoveLeft && onMoveLeft && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft();
            }}
            title="Nach links verschieben"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/20 bg-black/70 text-zinc-300 hover:text-white hover:bg-black/90 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {canMoveRight && onMoveRight && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight();
            }}
            title="Nach rechts verschieben"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/20 bg-black/70 text-zinc-300 hover:text-white hover:bg-black/90 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Slide löschen"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/20 bg-black/70 text-zinc-400 hover:text-rose-400 hover:bg-black/90 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── 1:1 Instagram Feed Grid Overlay Guide ─────────────────────── */}
      {showSquareGuide && aspectRatio !== "1 / 1" && (
        <div className="pointer-events-none absolute inset-0 z-15 flex flex-col justify-between">
          <div className="h-[10%] w-full bg-black/50 border-b border-dashed border-orange-500/60 flex items-center justify-center">
            <span className="text-[8px] font-mono text-orange-400 uppercase tracking-widest">Feed Crop</span>
          </div>
          <div className="h-[10%] w-full bg-black/50 border-t border-dashed border-orange-500/60 flex items-center justify-center">
            <span className="text-[8px] font-mono text-orange-400 uppercase tracking-widest">Feed Crop</span>
          </div>
        </div>
      )}

      {/* ── Slide Visual or Placeholder ─────────────────────────────── */}
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

          {isCancelled && (
            <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
              Abgebrochen
            </span>
          )}

          {!slide.isGeneratingImage && !isCancelled && (
            <span className="text-[11px] text-zinc-500">noch nicht gerendert</span>
          )}

          {/* Quick Start Single Slide Button */}
          {!slide.isGeneratingImage && onStartSingle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartSingle();
              }}
              className="mt-2 flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400 transition-all hover:bg-orange-500/30 hover:text-white"
            >
              <Play className="h-3 w-3 fill-current" />
              {isCancelled ? "Wiederholen" : "Starten"}
            </button>
          )}
        </div>
      )}

      {/* ── Active Generating Overlay with Percentage ─────────────────── */}
      {slide.isGeneratingImage && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 bg-black/85 backdrop-blur-md p-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#FF6A1F]" />

          {/* Percent Badge */}
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-black tracking-tight text-white">{progress}</span>
            <span className="text-xs font-bold text-[#FF6A1F]">%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-[130px] space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#FF4D17] to-[#FFA043] transition-all duration-300 shadow-[0_0_8px_#FF4D17]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="truncate text-[10px] text-zinc-400">{modelName} rendert…</p>
          </div>

          {/* Individual Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="mt-1 flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold text-rose-300 transition-all hover:bg-rose-500/30 hover:text-white shadow-[0_0_10px_rgba(244,63,94,0.2)]"
            >
              <X className="h-3 w-3" /> Abbrechen
            </button>
          )}
        </div>
      )}

      {/* ── Completed Actions Bar & Hover Overlay ─────────────────────── */}
      {done && (
        <>
          {/* Bottom info bar with slide number, role label, and compact quick actions */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1.5 bg-[#0D0C12]/92 border-t border-white/[0.08] px-2.5 py-1.5 backdrop-blur-md">
            <span className="min-w-0 truncate text-[11px] font-semibold text-zinc-200">
              <span className="text-orange-400 font-mono mr-1">#{slide.slideNumber}</span>
              <span className="truncate">{slide.roleLabel}</span>
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReroll();
                }}
                title="Neu generieren"
                className="flex h-5.5 w-5.5 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-orange-400 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Slide bearbeiten"
                className="flex h-5.5 w-5.5 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Centered Hover Actions Overlay */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/70 opacity-0 backdrop-blur-[3px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 p-2">
            <IconAction onClick={onDownload} label="Download" tone="light">
              <Download className="h-3.5 w-3.5" />
            </IconAction>
            <IconAction onClick={onReroll} label="Neu generieren" tone="accent">
              <RefreshCw className="h-3.5 w-3.5" />
            </IconAction>
            <IconAction onClick={onEdit} label="Bearbeiten" tone="glass">
              <Pencil className="h-3.5 w-3.5" />
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
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md cursor-pointer",
        tone === "light" && "bg-white text-zinc-900 hover:bg-zinc-100 shadow-[0_0_12px_rgba(255,255,255,0.3)]",
        tone === "accent" && "bg-gradient-to-r from-[#FF5722] to-[#F4511E] text-white shadow-[0_0_15px_rgba(255,77,23,0.5)]",
        tone === "glass" && "border border-white/25 bg-black/60 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/40",
      )}
    >
      {children}
    </button>
  );
}
