import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  Key,
  ShieldCheck,
  Send,
  Layers,
  Clock,
  ChevronRight,
  ArrowRight,
  Check,
  Copy,
  RefreshCw,
  X,
  Share2,
  Lock,
  Flame,
  Briefcase,
  Dumbbell,
  Coins,
  Brain,
  Bot,
  ShoppingBag,
  SlidersHorizontal,
  Video,
  Smartphone,
  Image as ImageIcon,
  Users,
  Target,
  MessageSquare,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { BATCH_NICHE_PRESETS, type NichePreset, type BatchDayTemplate } from "../data/batch-niche-presets";
import { ZernioApiClient } from "../zernio/client";
import { sanitizeNoGedankenstriche, generateViralCaption } from "../caption-generator";
import type { ApiSettings, ScheduledPost, SocialChannel } from "../types";
import { cn } from "@/lib/utils";
import { PostForMeApiClient } from "../postforme/client";
import { ANCHORED_POSTFORME_API_KEY } from "../defaults";
import { LS, readLS } from "../storage";
import { computeNextSlots, DEFAULT_POSTING_SLOTS, renderQuoteCard, type PostingSlotConfig } from "../scheduling";
import { PLATFORM_ICONS } from "./scheduler/scheduler-utils";

interface ThirtyDayBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  channels: SocialChannel[];
  onUpdatePosts: (posts: ScheduledPost[]) => void;
  existingPosts: ScheduledPost[];
}

// Content Formate mit standardmäßigen besten Uhrzeiten
export interface ContentFormatConfig {
  id: "carousel" | "reel" | "story" | "single";
  label: string;
  icon: typeof Layers;
  description: string;
  defaultTime: string;
  enabled: boolean;
  color: string;
  badgeBg: string;
}

const DEFAULT_CONTENT_FORMATS: ContentFormatConfig[] = [
  {
    id: "carousel",
    label: "Karussell (Multi-Slide)",
    icon: Layers,
    description: "4:5 Portrait-Folienserien für maximale Verweildauer & Saves",
    defaultTime: "12:00",
    enabled: true,
    color: "text-orange-400",
    badgeBg: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  {
    id: "reel",
    label: "Reels / Kurzvideos",
    icon: Video,
    description: "9:16 Video-Hooks für maximale Reichweite & Discovery",
    defaultTime: "20:00",
    enabled: true,
    color: "text-cyan-400",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "story",
    label: "Story (Einzelne Stories)",
    icon: Smartphone,
    description: "Tägliche Community-Updates, Umfragen & DMs",
    defaultTime: "09:30",
    enabled: true,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    id: "single",
    label: "Einzelbeitrag (1 Bild / Grafik)",
    icon: ImageIcon,
    description: "Starke Visuals, Zitate & Produkt-Fokus",
    defaultTime: "16:00",
    enabled: true,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
];

export function ThirtyDayBatchModal({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  channels,
  onUpdatePosts,
  existingPosts,
}: ThirtyDayBatchModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedNicheId, setSelectedNicheId] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [customAudience, setCustomAudience] = useState("");
  const [formatsConfig, setFormatsConfig] = useState<ContentFormatConfig[]>(DEFAULT_CONTENT_FORMATS);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isSchedulingBatch, setIsSchedulingBatch] = useState(false);

  // Selected schedule configuration
  const defaultChannel = channels.find((c) => c.isDefault) || channels[0];
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    defaultChannel ? [defaultChannel.id] : []
  );
  const [batchStartDate, setBatchStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [activeWeekFilter, setActiveWeekFilter] = useState<number>(1);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  const selectedPreset = BATCH_NICHE_PRESETS.find((p) => p.id === selectedNicheId) || null;

  // Helper to toggle format
  const toggleFormat = (id: string) => {
    setFormatsConfig((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  // Helper to change format time
  const updateFormatTime = (id: string, newTime: string) => {
    setFormatsConfig((prev) =>
      prev.map((f) => (f.id === id ? { ...f, defaultTime: newTime } : f))
    );
  };

  // Generate the 30-day schedule plan (supports free custom topic or preset)
  const generatedDays = useMemo(() => {
    const enabledFormats = formatsConfig.filter((f) => f.enabled);
    const activeFormats = enabledFormats.length > 0 ? enabledFormats : DEFAULT_CONTENT_FORMATS;

    const baseDays = selectedPreset?.days || BATCH_NICHE_PRESETS[0].days;
    const topicBase = customTopic.trim() || selectedPreset?.name || "B2B Wachstum & Personal Branding";
    const audienceBase = customAudience.trim() || selectedPreset?.targetAudience || "Zielgruppe";

    return baseDays.map((template, idx) => {
      const format = activeFormats[idx % activeFormats.length];
      const headline = customTopic.trim()
        ? `Tag ${template.day}: ${customTopic.trim()} — ${template.pillarLabel}`
        : template.headline;

      return {
        ...template,
        formatId: format.id,
        formatLabel: format.label,
        formatTime: format.defaultTime,
        formatBadge: format.badgeBg,
        headline,
        audience: audienceBase,
      };
    });
  }, [selectedPreset, customTopic, customAudience, formatsConfig]);

  if (!isOpen) return null;

  // 1-Click Toggle (An- oder Abwählen)
  const handleToggleNiche = (nicheId: string) => {
    if (selectedNicheId === nicheId) {
      setSelectedNicheId(null);
      toast.info("Branchen-Vorlage abgewählt (Freie Themen-Generierung aktiv)");
    } else {
      setSelectedNicheId(nicheId);
      const preset = BATCH_NICHE_PRESETS.find((p) => p.id === nicheId);
      if (preset && !customTopic) {
        setCustomAudience(preset.targetAudience);
      }
      toast.success(`Vorlage „${preset?.name}“ ausgewählt (Klick zum Abwählen)`);
    }
  };

  const toggleChannelSelection = (id: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleScheduleAll30Days = async () => {
    const targetChannels = selectedChannelIds.length
      ? channels.filter((c) => selectedChannelIds.includes(c.id))
      : [defaultChannel].filter(Boolean) as SocialChannel[];

    if (targetChannels.length === 0) {
      toast.error("Bitte wähle mindestens einen Ziel-Kanal.");
      return;
    }

    const enabledFormats = formatsConfig.filter((f) => f.enabled);
    if (enabledFormats.length === 0) {
      toast.error("Bitte aktiviere mindestens ein Content-Format (z. B. Karussell oder Reel).");
      return;
    }

    const days = generatedDays;
    const total = days.length * targetChannels.length;
    const pfmKey = settings.postForMeApiKey || ANCHORED_POSTFORME_API_KEY;
    const client = pfmKey ? new PostForMeApiClient(pfmKey) : null;

    setIsSchedulingBatch(true);
    setBatchProgress({ done: 0, total });

    const topicSeed = customTopic.trim();
    const audienceSeed = customAudience.trim() || selectedPreset?.targetAudience || "Allgemein";
    const results: ScheduledPost[] = [];
    let done = 0;

    const baseDate = new Date(batchStartDate);
    const jobs: Array<() => Promise<void>> = [];

    for (let i = 0; i < days.length; i++) {
      const template = days[i];
      const dayOffset = i;
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + dayOffset);

      // Extract time from format configuration
      const timeParts = (template.formatTime || "12:00").split(":");
      targetDate.setHours(parseInt(timeParts[0], 10) || 12, parseInt(timeParts[1], 10) || 0, 0, 0);
      const iso = targetDate.toISOString();

      for (const channel of targetChannels) {
        jobs.push(async () => {
          const headline = sanitizeNoGedankenstriche(template.headline);
          let caption = sanitizeNoGedankenstriche(template.universalCaption);
          let hashtags = template.hashtags;

          try {
            const res = await generateViralCaption({
              topic: topicSeed
                ? `${topicSeed} — ${template.theme}: ${headline} (Format: ${template.formatLabel}, Zielgruppe: ${audienceSeed})`
                : `${template.pillarLabel} · ${template.theme}: ${headline} (Zielgruppe: ${audienceSeed})`,
              platform: (["facebook", "general", "instagram", "linkedin", "tiktok", "youtube"] as const).includes(
                channel.platform as never
              )
                ? (channel.platform as "facebook" | "general" | "instagram" | "linkedin" | "tiktok" | "youtube")
                : "general",
              apiKey: settings.geminiApiKey,
            });
            if (res.success) {
              caption = res.caption;
              if (res.hashtags?.length) hashtags = res.hashtags;
            }
          } catch {
            /* keep fallback caption */
          }

          // Usable Visual representation
          const card = renderQuoteCard(headline, {
            kicker: `${template.pillarLabel} • ${template.formatLabel}`,
            handle: channel.handle || selectedPreset?.name?.replace(/^\S+\s/, "") || "socialcraft",
          });
          let mediaUrls: string[] = [];
          if (card && client) {
            try {
              const blob = await (await fetch(card)).blob();
              mediaUrls = [await client.uploadMedia(blob, "image/jpeg")];
            } catch {
              /* text-only fallback */
            }
          }

          let postForMePostId: string | undefined;
          let postForMeStatus: string | undefined;
          if (client) {
            try {
              const target = channel.postForMeAccountId || channel.channelId;
              const r = await client.createPost({
                caption: caption + (hashtags.length ? "\n\n" + hashtags.join(" ") : ""),
                scheduled_at: iso,
                social_accounts: [target],
                media: mediaUrls.map((url) => ({ url })),
              });
              postForMePostId = r.id;
              postForMeStatus = r.status;
            } catch (err: any) {
              console.warn("Batch schedule failed", template.day, channel.name, err?.message || err);
            }
          }

          results.push({
            id: `batch-${Date.now()}-${template.day}-${channel.id}`,
            title: `Tag ${template.day} [${template.formatLabel}]: ${headline}`,
            caption,
            hashtags,
            mediaUrls,
            mediaType: template.formatId === "carousel" ? "carousel" : template.formatId === "reel" ? "video" : "image",
            channelId: channel.channelId,
            platform: channel.platform,
            scheduledFor: iso,
            status: "scheduled",
            createdAt: new Date().toISOString(),
            postForMePostId,
            postForMeStatus,
          });
          done++;
          setBatchProgress({ done, total });
        });
      }
    }

    try {
      for (let i = 0; i < jobs.length; i += 4) {
        await Promise.all(jobs.slice(i, i + 4).map((j) => j()));
      }
      onUpdatePosts([...results, ...existingPosts]);
      const live = results.filter((r) => r.postForMePostId).length;
      toast.success(`🎉 30 Tage erfolgreich eingeplant (${results.length} Beiträge)!`, {
        description: `Formate & Uhrzeiten: ${enabledFormats.map((f) => `${f.label} (${f.defaultTime})`).join(", ")}`,
        duration: 9000,
      });
      onClose();
    } catch (err: any) {
      toast.error(`Fehler bei der Batch-Planung: ${err?.message || err}`);
    } finally {
      setIsSchedulingBatch(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in-50">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/[0.12] bg-[#0C0A12] shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
        {/* Subtle Ambient Glowing Header Rim */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-[#FF4D17]/50 to-transparent pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF4D17]/25 to-amber-500/10 border border-[#FF4D17]/40 text-[#FF4D17] shadow-[0_0_15px_rgba(255,77,23,0.3)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  30-Tage Monats-Batch & Auto-Scheduler
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FF4D17]/20 text-[#FFA043] border border-[#FF4D17]/40">
                  Mass Content Engine v2.5
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Thema & Zielgruppe eingeben, Formate & feste Uhrzeiten wählen und 30 Tage vollautomatisch planen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Navigation Pipeline */}
        <div className="flex items-center border-b border-white/[0.08] bg-black/40 px-6">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={cn(
              "py-3.5 px-4 text-xs font-black border-b-2 flex items-center gap-2 transition cursor-pointer",
              activeStep === 1
                ? "border-[#FF4D17] text-white bg-[#FF4D17]/10"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>1. Thema & Zielgruppe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={cn(
              "py-3.5 px-4 text-xs font-black border-b-2 flex items-center gap-2 transition cursor-pointer",
              activeStep === 2
                ? "border-[#FF4D17] text-white bg-[#FF4D17]/10"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>2. Formate & Feste Uhrzeiten</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={cn(
              "py-3.5 px-4 text-xs font-black border-b-2 flex items-center gap-2 transition cursor-pointer",
              activeStep === 3
                ? "border-[#FF4D17] text-white bg-[#FF4D17]/10"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>3. 30-Tage Kalender & Auto-Schedule</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── STEP 1: TOPIC, AUDIENCE & NICHE ────────────────────────── */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              {/* Main Topic & Target Audience Input Console */}
              <div className="cryptox-card p-6 space-y-4 border border-[#FF4D17]/30 bg-gradient-to-b from-[#FF4D17]/10 via-black/50 to-black/60 shadow-[0_0_30px_rgba(255,77,23,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#FF4D17]" />
                    Dein 30-Tage Haupt-Thema & Zielgruppe
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">30 Tage maßgeschneidert</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-[#FF4D17]" />
                      Haupt-Thema / Nische:
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="z. B. B2B High-Ticket Kundengewinnung & Sales Closing"
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#FF4D17] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-amber-400" />
                      Zielgruppe (Audience):
                    </label>
                    <input
                      type="text"
                      value={customAudience}
                      onChange={(e) => setCustomAudience(e.target.value)}
                      placeholder="z. B. Agenturinhaber, B2B Dienstleister, Coaches & Berater"
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#FF4D17] transition-all"
                    />
                  </div>
                </div>

                {/* Quick Topic Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-zinc-500 font-semibold mr-1">Inspiration:</span>
                  {[
                    "Organisches Social-Media-Wachstum 2026",
                    "KI-Automatisierung für Agenturen",
                    "Fitness & Muskelaufbau für vielbeschäftigte Männer",
                    "Immobilien & Vermögensaufbau",
                    "E-Commerce Skalierung & Werbeanzeigen",
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setCustomTopic(sugg)}
                      className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium text-zinc-400 hover:text-white hover:border-[#FF4D17]/50 hover:bg-[#FF4D17]/10 transition-colors cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Niche Presets Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-zinc-200 uppercase tracking-wider">
                      Branchen-Vorlagen (Optional):
                    </span>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">
                      Per Klick an- oder abwählen
                    </span>
                  </div>

                  {selectedNicheId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNicheId(null);
                        toast.info("Vorlage abgewählt. Freie Themen-Generierung aktiv.");
                      }}
                      className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Auswahl aufheben</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BATCH_NICHE_PRESETS.map((preset) => {
                    const isSelected = selectedNicheId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleToggleNiche(preset.id)}
                        className={cn(
                          "group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 select-none",
                          isSelected
                            ? "bg-[#FF4D17]/15 border-[#FF4D17] shadow-[0_0_20px_rgba(255,77,23,0.3)] ring-1 ring-[#FF4D17]"
                            : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{preset.icon}</span>
                            <div className="flex items-center gap-1.5">
                              {isSelected ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF4D17] text-black text-[10px] font-black shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Aktiv
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  + Wählen
                                </span>
                              )}
                            </div>
                          </div>
                          <h5 className="text-xs font-black text-white group-hover:text-orange-300 transition-colors">
                            {preset.name}
                          </h5>
                          <p className="text-[11px] text-zinc-400 line-clamp-2">{preset.description}</p>
                        </div>

                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Zielgruppe: <strong className="text-zinc-200">{preset.targetAudience}</strong></span>
                          <span className="text-orange-400 font-bold font-mono">30 Tage</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="cryptox-orange-btn !py-3 !px-7 text-xs font-black flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(255,77,23,0.4)]"
                >
                  <span>Weiter zu Formaten & Uhrzeiten</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: CONTENT FORMATS & DEDICATED POSTING TIMES ───────── */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h4 className="text-sm font-black text-white mb-1">
                  2. Content-Formate & Feste Uhrzeiten konfigurieren
                </h4>
                <p className="text-xs text-zinc-400">
                  Wähle aus, welche Formate im 30-Tage Mix enthalten sein sollen (Karussells, Reels, Stories, Einzelbeiträge) und bestimme exakte Uhrzeiten.
                </p>
              </div>

              {/* Format Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formatsConfig.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div
                      key={format.id}
                      className={cn(
                        "p-5 rounded-2xl border transition-all space-y-4 relative overflow-hidden",
                        format.enabled
                          ? "bg-[#FF4D17]/[0.08] border-[#FF4D17]/50 shadow-[0_0_20px_rgba(255,77,23,0.15)]"
                          : "bg-black/40 border-white/10 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10", format.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-white">{format.label}</h5>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{format.description}</p>
                          </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleFormat(format.id)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer",
                            format.enabled
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-white/5 text-zinc-500 border-white/10"
                          )}
                        >
                          {format.enabled ? "Aktiviert ✓" : "Deaktiviert"}
                        </button>
                      </div>

                      {/* Fixed Time Configuration */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#FF4D17]" />
                          Feste Posting-Uhrzeit:
                        </span>

                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={format.defaultTime}
                            onChange={(e) => updateFormatTime(format.id, e.target.value)}
                            disabled={!format.enabled}
                            className="rounded-xl border border-white/15 bg-black/70 px-3 py-1.5 font-mono text-xs font-bold text-white outline-none focus:border-[#FF4D17] disabled:opacity-30"
                          />
                          <span className="text-[10px] text-zinc-400">Uhr</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Start Date & Channels */}
              <div className="cryptox-card p-5 space-y-4 border border-white/10">
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  Start-Datum & Ziel-Kanäle
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Start-Datum des 30-Tage Batches:
                    </label>
                    <input
                      type="date"
                      value={batchStartDate}
                      onChange={(e) => setBatchStartDate(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-[#FF4D17]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Auf folgenden Accounts posten:
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {channels.map((ch) => {
                        const Icon = PLATFORM_ICONS[ch.platform] || Share2;
                        const isSelected = selectedChannelIds.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => toggleChannelSelection(ch.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                              isSelected
                                ? "border-[#FF4D17] bg-[#FF4D17]/20 text-white shadow-sm"
                                : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{ch.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  ← Zurück zu Thema
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="cryptox-orange-btn !py-3 !px-7 text-xs font-black flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(255,77,23,0.4)]"
                >
                  <span>30-Tage Kalender prüfen & planen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: 30-DAY SCHEDULE PREVIEW & AUTO-SCHEDULE ────────── */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-in fade-in-50">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">
                      30 Tage Content fertig generiert
                    </h5>
                    <p className="text-[11px] text-zinc-400">
                      Thema: <strong className="text-zinc-200">{customTopic || selectedPreset?.name || "Allgemein"}</strong> · Zielgruppe: <strong className="text-zinc-200">{customAudience || selectedPreset?.targetAudience || "Allgemein"}</strong>
                    </p>
                  </div>
                </div>

                {/* Week Filter Pills */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {[1, 2, 3, 4].map((week) => (
                    <button
                      key={week}
                      type="button"
                      onClick={() => setActiveWeekFilter(week)}
                      className={cn(
                        "px-3 py-1 rounded-xl text-xs font-mono font-black transition-all cursor-pointer",
                        activeWeekFilter === week
                          ? "bg-[#FF4D17] text-black shadow-[0_0_10px_rgba(255,77,23,0.5)]"
                          : "border border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                      )}
                    >
                      Woche {week}
                    </button>
                  ))}
                </div>
              </div>

              {/* 30 Days Grid (Filtered by Active Week) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {generatedDays
                  .filter((_, idx) => Math.floor(idx / 7) + 1 === activeWeekFilter)
                  .map((dayItem) => {
                    const postDate = new Date(batchStartDate);
                    postDate.setDate(postDate.getDate() + (dayItem.day - 1));
                    const formattedDate = `${postDate.toLocaleDateString("de-DE", { weekday: "short" })}, ${postDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`;

                    return (
                      <div
                        key={dayItem.day}
                        className="p-4 rounded-2xl border border-white/[0.08] bg-black/50 space-y-2.5 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FF4D17]/20 text-[#FFA043] font-mono text-[10px] font-black border border-[#FF4D17]/30">
                              #{dayItem.day}
                            </span>
                            <span className="text-[11px] font-bold text-white font-mono">
                              {formattedDate} um {dayItem.formatTime} Uhr
                            </span>
                          </div>

                          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border", dayItem.formatBadge)}>
                            {dayItem.formatLabel}
                          </span>
                        </div>

                        <h6 className="text-xs font-black text-white line-clamp-1">
                          {dayItem.headline}
                        </h6>

                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-mono">
                          {dayItem.universalCaption}
                        </p>
                      </div>
                    );
                  })}
              </div>

              {/* Final Execution Bar */}
              <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer self-start"
                >
                  ← Zurück zu Formaten
                </button>

                <button
                  type="button"
                  onClick={handleScheduleAll30Days}
                  disabled={isSchedulingBatch}
                  className="cryptox-orange-btn !py-3.5 !px-8 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_35px_rgba(255,77,23,0.5)] disabled:opacity-50"
                >
                  {isSchedulingBatch ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>
                        {batchProgress
                          ? `Plane 30 Tage… ${batchProgress.done}/${batchProgress.total} Beiträge`
                          : "Generiere & plane Batch…"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>30 Tage komplett vorplanen & aktivieren 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
