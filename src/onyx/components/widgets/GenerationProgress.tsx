import React from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GenerationProgressProps {
  isGenerating: boolean;
  title?: string;
  currentStep?: string;
  completedItems?: number;
  totalItems?: number;
  estimatedSecondsRemaining?: number;
  onCancel?: () => void;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function GenerationProgress({
  isGenerating,
  title = "Inhalte werden generiert",
  currentStep,
  completedItems = 0,
  totalItems = 0,
  estimatedSecondsRemaining,
  onCancel,
  error,
  onRetry,
  className,
}: GenerationProgressProps) {
  if (!isGenerating && !error) return null;

  const percentage =
    totalItems > 0
      ? Math.min(100, Math.round((completedItems / totalItems) * 100))
      : isGenerating
      ? 45
      : 0;

  const formatTime = (secs?: number) => {
    if (!secs || secs <= 0) return null;
    if (secs < 60) return `ca. ${secs} Sek.`;
    const mins = Math.ceil(secs / 60);
    return `ca. ${mins} Min.`;
  };

  const formattedTime = formatTime(estimatedSecondsRemaining);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in-50 duration-300",
        error
          ? "border-red-500/40 bg-red-950/20 text-red-200"
          : "border-orange-500/30 bg-[#140F19]/95 text-white",
        className,
      )}
    >
      {/* Background radial glow */}
      {!error && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,77,23,0.15)_0%,transparent_70%)] blur-2xl" />
      )}

      <div className="relative z-10 space-y-3.5">
        {/* Header: Status Title & Cancel / Close */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {error ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-[#FF5E28]" />
              </div>
            )}

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {error ? "Generierung unterbrochen" : title}
              </h4>
              <p className="text-xs text-zinc-400 truncate">
                {error
                  ? "Ein Problem ist aufgetreten"
                  : currentStep || "Visuals und Texte werden zusammengestellt..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!error && formattedTime && (
              <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                <Clock className="h-3 w-3 text-orange-400" />
                <span>{formattedTime}</span>
              </div>
            )}

            {onCancel && isGenerating && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Vorgang abbrechen"
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>

        {/* Progress bar (when active and not in error) */}
        {!error && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span>
                {totalItems > 0
                  ? `${completedItems} von ${totalItems} Bildern fertig`
                  : "Generierung läuft..."}
              </span>
              <span className="font-mono text-orange-400">{percentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF4D17] to-[#FF8038] transition-all duration-500 ease-out shadow-[0_0_12px_rgba(255,77,23,0.5)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Friendly Error Resolution Message */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 space-y-2 text-xs">
            <p className="text-red-300 leading-relaxed">{error}</p>
            <div className="flex items-center gap-2 pt-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Erneut versuchen</span>
                </button>
              )}
              <span className="text-[11px] text-zinc-400">
                Tipp: Prüfe deine Internetverbindung oder wähle die Stufe „Ausgewogen“.
              </span>
            </div>
          </div>
        )}

        {/* Reassurance text */}
        {!error && (
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
            <span>💾 Deine Ergebnisse werden sicher in deinem Cloud-Ordner gespeichert.</span>
            <span className="hidden md:inline">Du kannst dieses Tab geöffnet lassen.</span>
          </div>
        )}
      </div>
    </div>
  );
}
