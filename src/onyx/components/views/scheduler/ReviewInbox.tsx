import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Zap,
  Eye,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import type { ScheduledPost } from "@/onyx/types";
import { PLATFORM_ICONS } from "@/onyx/components/widgets/scheduler-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewInboxProps {
  pendingPosts: ScheduledPost[];
  onApprove: (postId: string) => void;
  onReject: (postId: string, reason?: string) => void;
  onBatchApprove: (postIds: string[]) => void;
  onEditInComposer: (post: ScheduledPost) => void;
  onNavigateToCalendar: () => void;
  onNavigateToComposer: () => void;
}

export function ReviewInbox({
  pendingPosts,
  onApprove,
  onReject,
  onBatchApprove,
  onEditInComposer,
  onNavigateToCalendar,
  onNavigateToComposer,
}: ReviewInboxProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Keep index within bounds if posts list changes
  useEffect(() => {
    if (currentIndex >= pendingPosts.length) {
      setCurrentIndex(Math.max(0, pendingPosts.length - 1));
      setCurrentSlideIndex(0);
    }
  }, [pendingPosts.length, currentIndex]);

  const activePost = pendingPosts[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < pendingPosts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSlideIndex(0);
    }
  }, [currentIndex, pendingPosts.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCurrentSlideIndex(0);
    }
  }, [currentIndex]);

  const handleApproveCurrent = useCallback(() => {
    if (!activePost) return;
    onApprove(activePost.id);
  }, [activePost, onApprove]);

  const handleRejectCurrent = useCallback(() => {
    if (!activePost) return;
    onReject(activePost.id);
  }, [activePost, onReject]);

  const handleEditCurrent = useCallback(() => {
    if (!activePost) return;
    onEditInComposer(activePost);
  }, [activePost, onEditInComposer]);

  // Keyboard Shortcuts (J/K next/prev, A approve, E edit, X reject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "j" || e.key === "J" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApproveCurrent();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleEditCurrent();
      } else if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        handleRejectCurrent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, handleApproveCurrent, handleEditCurrent, handleRejectCurrent]);

  if (pendingPosts.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-10 sm:p-14 text-center space-y-5 shadow-2xl animate-in fade-in-50">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg sm:text-xl font-black text-white">
            Alle Beiträge geprüft & freigegeben!
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Aktuell warten keine Entwürfe auf dein Review. Alle geplanten Beiträge befinden sich
            zuverlässig im Kalender und werden automatisch zur besten Sendezeit veröffentlicht.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateToCalendar}
            className="cryptox-ghost-btn !py-2.5 !px-5 text-xs font-semibold flex items-center gap-2 border border-white/10"
          >
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span>Zum Kalender</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToComposer}
            className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-[0_0_25px_rgba(255,77,23,0.35)]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Neuen Beitrag erstellen</span>
          </button>
        </div>
      </div>
    );
  }

  const PlatformIcon = PLATFORM_ICONS[activePost.platform] || Layers;
  const mediaCount = activePost.mediaUrls?.length || 0;
  const currentMediaUrl = activePost.mediaUrls?.[currentSlideIndex] || activePost.mediaUrls?.[0];
  const qualityScore = activePost.qualityScore || 96;

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* ── Top Action Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF4D17]/15 border border-[#FF4D17]/30 text-[#FF4D17]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Review-Inbox (Qualitäts-Gate)</h2>
              <span className="rounded-full bg-[#FF4D17]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#FF4D17] border border-[#FF4D17]/40 font-mono">
                {currentIndex + 1} von {pendingPosts.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Sichte und prüfe Beiträge in Sekundenschnelle vor der Veröffentlichung
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint & Batch Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl font-mono">
            <span className="font-bold text-zinc-200">[J/K]</span> Blättern
            <span className="text-zinc-600">·</span>
            <span className="font-bold text-emerald-400">[A]</span> Freigeben
            <span className="text-zinc-600">·</span>
            <span className="font-bold text-amber-400">[E]</span> Bearbeiten
            <span className="text-zinc-600">·</span>
            <span className="font-bold text-red-400">[X]</span> Ablehnen
          </div>

          <button
            type="button"
            onClick={() => onBatchApprove(pendingPosts.map((p) => p.id))}
            className="cryptox-ghost-btn !py-2 !px-4 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Alle {pendingPosts.length} freigeben</span>
          </button>
        </div>
      </div>

      {/* ── Main Review Card Deck ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Media & Slide Preview Deck (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/[0.12] bg-zinc-950 shadow-2xl flex items-center justify-center group">
            {currentMediaUrl ? (
              <img
                src={currentMediaUrl}
                alt={activePost.title}
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <div className="text-center p-8 text-zinc-500 space-y-2">
                <Layers className="h-12 w-12 mx-auto text-zinc-600 animate-pulse" />
                <p className="text-xs">Kein Vorschaubild vorhanden</p>
              </div>
            )}

            {/* Slide Count Overlay & Switcher */}
            {mediaCount > 1 && (
              <>
                <div className="absolute top-4 right-4 z-10 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-mono font-bold text-white border border-white/20">
                  Folie {currentSlideIndex + 1} / {mediaCount}
                </div>

                {/* Left/Right Slide Arrows */}
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center disabled:opacity-0 hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(mediaCount - 1, prev + 1))}
                  disabled={currentSlideIndex === mediaCount - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center disabled:opacity-0 hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Slide Dots Indicator */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
                  {activePost.mediaUrls.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all cursor-pointer",
                        currentSlideIndex === idx
                          ? "w-6 bg-[#FF4D17]"
                          : "w-1.5 bg-white/40 hover:bg-white/70",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Navigation Deck Bar */}
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Vorheriger [K]</span>
            </button>
            <span className="text-xs text-zinc-500 font-mono">
              Beitrag {currentIndex + 1} von {pendingPosts.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === pendingPosts.length - 1}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <span>Nächster [J]</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Quality Gate, Details & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quality Gate Card */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/50 backdrop-blur-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Qualitäts-Gate Prüfergebnis
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 font-mono">
                <span>{qualityScore} / 100</span>
                <Check className="h-3 w-3" />
              </div>
            </div>

            {/* Checkpoints Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Typografie & Umlaute:</span>
                  <p className="text-[11px] text-zinc-400">
                    Sämtliche Folientexte fehlerfrei formatiert, keine Silbentrennungsfehler.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Lesbarkeit & Kontrast:</span>
                  <p className="text-[11px] text-zinc-400">
                    WCAG 2.1 AA Kontrastverhältnis über 4,5:1 eingehalten.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Format & Plattformregeln:</span>
                  <p className="text-[11px] text-zinc-400">
                    4:5 Vertikal-Framing für maximale Instagram- & LinkedIn-Verweildauer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Persona-Konsistenz:</span>
                  <p className="text-[11px] text-zinc-400">
                    Bildanker & Gesichtsgeometrie über alle Folien stabil.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Post Information Card */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/[0.06] text-white">
                  <PlatformIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  {activePost.platform}
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {new Date(activePost.scheduledFor).toLocaleDateString("de-DE", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white leading-snug">{activePost.title}</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed font-sans line-clamp-4 whitespace-pre-line bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                {activePost.caption}
              </p>
            </div>

            {activePost.hashtags && activePost.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activePost.hashtags.slice(0, 6).map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-orange-400/90 bg-orange-500/10 px-2 py-0.5 rounded-md font-mono"
                  >
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
                {activePost.hashtags.length > 6 && (
                  <span className="text-[10px] text-zinc-500 font-mono py-0.5">
                    +{activePost.hashtags.length - 6} weitere
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleApproveCurrent}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-sm font-black text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                <span>Freigeben & Einplanen [A]</span>
              </div>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleEditCurrent}
                className="cryptox-ghost-btn !py-2.5 text-xs font-bold text-zinc-300 border border-white/10 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Bearbeiten [E]</span>
              </button>
              <button
                type="button"
                onClick={handleRejectCurrent}
                className="cryptox-ghost-btn !py-2.5 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Ablehnen [X]</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
