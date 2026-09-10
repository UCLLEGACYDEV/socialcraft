import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Share2,
  X,
  Check,
  CheckCircle2,
  Layers,
  ChevronRight,
  Flame,
  Zap,
  ArrowRight,
  RefreshCw,
  Send,
  AlertCircle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import type { SocialChannel, ScheduledPost, SocialPlatform, BrandProfile, ApiSettings } from "../types";
import type { User } from "../auth";
import { LS, readLS, writeLS } from "../storage";
import { DEFAULT_SOCIAL_CHANNELS, DEFAULT_BRAND_PROFILES, ANCHORED_POSTFORME_API_KEY } from "../defaults";
import { PLATFORM_ICONS, toLocalDatetimeValue } from "./scheduler/scheduler-utils";
import { generateViralCaption } from "../caption-generator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GalleryScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    imageUrls: string[];
    prompt?: string;
  } | null;
  onNavigateToScheduler?: () => void;
  settings?: ApiSettings;
  currentUser?: User | null;
  onScheduled?: (post: ScheduledPost) => void;
}

const CAPTION_PLATFORMS = ["instagram", "tiktok", "facebook", "linkedin", "youtube"];

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  facebook: { bg: "bg-blue-600/15", border: "border-blue-500/40", text: "text-blue-400", badge: "bg-blue-600/20 text-blue-300 border-blue-500/30" },
  instagram: { bg: "bg-pink-600/15", border: "border-pink-500/40", text: "text-pink-400", badge: "bg-pink-600/20 text-pink-300 border-pink-500/30" },
  tiktok: { bg: "bg-cyan-600/15", border: "border-cyan-500/40", text: "text-cyan-400", badge: "bg-cyan-600/20 text-cyan-300 border-cyan-500/30" },
  youtube: { bg: "bg-red-600/15", border: "border-red-500/40", text: "text-red-400", badge: "bg-red-600/20 text-red-300 border-red-500/30" },
  linkedin: { bg: "bg-sky-600/15", border: "border-sky-500/40", text: "text-sky-400", badge: "bg-sky-600/20 text-sky-300 border-sky-500/30" },
  twitter: { bg: "bg-zinc-600/15", border: "border-zinc-500/40", text: "text-zinc-300", badge: "bg-zinc-600/20 text-zinc-300 border-zinc-500/30" },
  threads: { bg: "bg-zinc-700/15", border: "border-zinc-600/40", text: "text-zinc-200", badge: "bg-zinc-700/20 text-zinc-200 border-zinc-600/30" },
  pinterest: { bg: "bg-rose-600/15", border: "border-rose-500/40", text: "text-rose-400", badge: "bg-rose-600/20 text-rose-300 border-rose-500/30" },
  bluesky: { bg: "bg-indigo-600/15", border: "border-indigo-500/40", text: "text-indigo-400", badge: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30" },
};

export function GalleryScheduleModal(props: GalleryScheduleModalProps) {
  if (!props.isOpen || !props.item) return null;
  return <GalleryScheduleModalInner {...props} item={props.item} />;
}

function GalleryScheduleModalInner({
  isOpen,
  onClose,
  item,
  onNavigateToScheduler,
  settings,
  currentUser,
  onScheduled,
}: GalleryScheduleModalProps & { item: NonNullable<GalleryScheduleModalProps["item"]> }) {
  // 1. Load Channels & Profiles
  const channels = readLS<SocialChannel[]>(LS.socialChannels, DEFAULT_SOCIAL_CHANNELS);
  const profiles = readLS<BrandProfile[]>(LS.brandProfiles, DEFAULT_BRAND_PROFILES);
  const activeProfileId = readLS<string>(LS.activeBrandProfileId, DEFAULT_BRAND_PROFILES[0]?.id || "profile-default");
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_BRAND_PROFILES[0];

  // Filter channels belonging to current profile
  const profileChannels = useMemo(() => {
    const list = channels.filter((c) => (c.profileId || DEFAULT_BRAND_PROFILES[0].id) === activeProfile.id);
    return list.length > 0 ? list : channels;
  }, [channels, activeProfile.id]);

  // Form State
  const [selectedChannelId, setSelectedChannelId] = useState<string>(profileChannels[0]?.id || channels[0]?.id || "");
  const [title, setTitle] = useState(item.title || "Social Media Beitrag");
  const [caption, setCaption] = useState(item.prompt || item.title || "");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Date & Time calculation default: Tomorrow 18:00
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d;
  }, []);

  const [dateStr, setDateStr] = useState(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}`;
  });

  const [timeStr, setTimeStr] = useState("18:00");

  // Selected Channel object
  const selectedChannel = useMemo(() => {
    return channels.find((c) => c.id === selectedChannelId) || profileChannels[0] || channels[0] || {
      id: "default-channel",
      platform: "instagram" as SocialPlatform,
      name: "Instagram Account",
      channelId: "ig-default",
    };
  }, [channels, profileChannels, selectedChannelId]);

  // Quick Time Slots Presets
  const setQuickSlot = (daysAhead: number, hours: number, minutes: number, label: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const pad = (n: number) => String(n).padStart(2, "0");
    setDateStr(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setTimeStr(`${pad(hours)}:${pad(minutes)}`);
    toast.info(`Slot gewählt: ${label} (${pad(hours)}:${pad(minutes)} Uhr)`);
  };

  // AI Viral Caption Generator
  const handleGenerateAiCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const apiKey = settings?.geminiApiKey || "";
      const res = await generateViralCaption({
        topic: title,
        platform: CAPTION_PLATFORMS.includes(selectedChannel.platform as string)
          ? (selectedChannel.platform as "instagram" | "tiktok" | "facebook" | "linkedin" | "youtube")
          : "general",
        apiKey,
        customInstructions: item.prompt ? `Kontext / Visuals: ${item.prompt}` : undefined,
      });

      if (res.caption) {
        setCaption(res.caption);
        toast.success("✨ Virale KI-Caption erfolgreich generiert!");
      }
    } catch (err) {
      toast.error("Konnte Caption nicht generieren.");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Submit Handler
  const handleScheduleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Bitte gib einen Titel für den Beitrag ein.");
      return;
    }

    const scheduledDateObj = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(scheduledDateObj.getTime())) {
      toast.error("Ungültiges Datum oder Uhrzeit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost: ScheduledPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        caption: caption.trim(),
        hashtags: [],
        mediaUrls: item.imageUrls,
        mediaType: item.imageUrls.length > 1 ? "carousel" : "image",
        channelId: selectedChannel.channelId || selectedChannel.id,
        platform: selectedChannel.platform,
        scheduledFor: scheduledDateObj.toISOString(),
        status: "scheduled",
        createdAt: new Date().toISOString(),
        profileId: activeProfile.id,
      };

      // Save to localStorage
      const existingPosts = readLS<ScheduledPost[]>(LS.scheduledPosts, []);
      const updatedPosts = [newPost, ...existingPosts];
      writeLS(LS.scheduledPosts, updatedPosts);

      // Trigger window storage event for instant live reactivity across components
      window.dispatchEvent(new Event("storage"));

      if (onScheduled) {
        onScheduled(newPost);
      }

      const formattedTime = scheduledDateObj.toLocaleString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      toast.success(
        `🎉 Beitrag erfolgreich für ${formattedTime} Uhr auf ${selectedChannel.name} eingeplant!`,
        {
          duration: 5000,
          action: onNavigateToScheduler
            ? {
                label: "Zum Planer ➔",
                onClick: () => {
                  onClose();
                  onNavigateToScheduler();
                },
              }
            : undefined,
        }
      );

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Einplanen des Beitrags.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Icon = PLATFORM_ICONS[selectedChannel.platform] || Share2;
  const activeStyle = PLATFORM_COLORS[selectedChannel.platform] || PLATFORM_COLORS["instagram"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0a0d] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] text-white custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff652e] to-[#ff4500] flex items-center justify-center text-white shadow-lg shadow-[#ff652e]/20">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Beitrag im Planer terminieren</span>
              </h2>
              <p className="text-sm text-zinc-400">
                Wähle Kanal, Veröffentlichungszeitpunkt & optimiere deine Caption.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Two-Column Structured Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Visual Media Preview & Caption (5 cols) */}
          <div className="lg:col-span-5 space-y-6 p-6 sm:p-8 lg:border-r border-white/10 bg-[#121118]/50">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                <span>Vorschau & Medien</span>
                <span className="text-[10px] font-bold text-[#ff652e] bg-[#ff652e]/10 border border-[#ff652e]/20 px-2 py-0.5 rounded">
                  {item.imageUrls.length} {item.imageUrls.length === 1 ? "Bild" : "Slides"}
                </span>
              </span>

              {/* Media Preview Box */}
              <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#1c1b22] shadow-inner group">
                {item.imageUrls[Math.min(activeSlide, item.imageUrls.length - 1)] ? (
                  <img
                    src={item.imageUrls[Math.min(activeSlide, item.imageUrls.length - 1)]}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    Kein Bild verfügbar
                  </div>
                )}
                {item.imageUrls.length > 1 && (
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    <span>
                      Slide {Math.min(activeSlide, item.imageUrls.length - 1) + 1} von {item.imageUrls.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Slide strip if multi-image */}
              {item.imageUrls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                  {item.imageUrls.slice(0, 8).map((url, idx) => {
                    const isActive = idx === Math.min(activeSlide, item.imageUrls.length - 1);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        aria-label={`Slide ${idx + 1} anzeigen`}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#1c1b22] transition-all cursor-pointer ${
                          isActive
                            ? "border-2 border-[#ff652e] opacity-100 shadow-[0_0_0_2px_rgba(255,101,46,0.15)]"
                            : "border border-white/10 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                  {item.imageUrls.length > 8 && (
                    <span className="shrink-0 px-2 text-[11px] font-semibold text-zinc-500">
                      +{item.imageUrls.length - 8}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Post Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">Titel des Beitrags:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. 5 Tipps für mehr Reichweite"
                className="w-full rounded-lg border border-white/10 bg-[#1c1b22] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff652e]/50 transition-all"
              />
            </div>

            {/* Post Caption / Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400">Caption / Beschreibung:</label>
                <button
                  type="button"
                  disabled={isGeneratingCaption}
                  onClick={handleGenerateAiCaption}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer disabled:opacity-50"
                  title="Erstelle automatisch einen virale Beschreibung für diesen Beitrag"
                >
                  <Sparkles className={cn("w-3 h-3", isGeneratingCaption && "animate-spin")} />
                  <span>{isGeneratingCaption ? "Schreibe KI-Text…" : "✨ KI-Caption"}</span>
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Schreibe deine Caption oder nutze den KI-Button oben..."
                className="w-full rounded-lg border border-white/10 bg-[#1c1b22] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#ff652e]/50 transition-all resize-none custom-scrollbar"
              />
              <div className="text-right text-[10px] text-zinc-500 font-mono">
                {caption.length} Zeichen
              </div>
            </div>
          </div>

          {/* Right Column: Channels & Sexy Time Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-8 p-6 sm:p-8">
            {/* 1. Kanal / Platform Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  1. Veröffentlichungs-Kanal:
                </span>
                <span className="text-[11px] text-zinc-400">
                  Profil: <strong className="text-white">{activeProfile.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {profileChannels.map((chan) => {
                  const ChanIcon = PLATFORM_ICONS[chan.platform] || Share2;
                  const isSel = chan.id === selectedChannelId;
                  const style = PLATFORM_COLORS[chan.platform] || PLATFORM_COLORS["instagram"];

                  return (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => setSelectedChannelId(chan.id)}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSel
                          ? "bg-[#ff652e]/5 border-[#ff652e] text-white"
                          : "bg-[#1c1b22] border-white/10 text-zinc-300 hover:border-white/20"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center shrink-0", style.bg, style.border)}>
                        <ChanIcon className={cn("w-5 h-5", style.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{chan.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate uppercase font-mono tracking-tighter">{chan.platform}</div>
                      </div>
                      {isSel && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ff652e] text-white flex items-center justify-center shrink-0 shadow-lg ring-2 ring-[#0b0a0d]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Datum & Uhrzeit (Sexy Smart Slots + Picker) */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                2. Veröffentlichungszeitpunkt:
              </span>

              {/* Quick Presets Chips */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#ffb800] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Smart Peak-Time Slots (1-Klick Auswahl):</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Heute Abend", days: 0, h: 18, m: 0, desc: "18:00 Uhr" },
                    { label: "Morgen Peak", days: 1, h: 10, m: 0, desc: "10:00 Uhr" },
                    { label: "Morgen Abend", days: 1, h: 19, m: 30, desc: "19:30 Uhr" },
                    { label: "Übermorgen", days: 2, h: 12, m: 0, desc: "12:00 Uhr" },
                    { label: "Samstag Weekend", days: (6 - new Date().getDay() + 7) % 7 || 7, h: 11, m: 0, desc: "11:00 Uhr" },
                    { label: "Sonntag Primetime", days: (7 - new Date().getDay() + 7) % 7 || 7, h: 18, m: 30, desc: "18:30 Uhr" },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuickSlot(preset.days, preset.h, preset.m, preset.label)}
                      className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-zinc-200 mb-1">{preset.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date & Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span>Datum auswählen:</span>
                  </label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-white/10 bg-[#1c1b22] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff652e]/50 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span>Uhrzeit festlegen:</span>
                  </label>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1c1b22] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff652e]/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Selected Summary Badge */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-4 text-xs">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", activeStyle.bg)}>
                <Icon className={cn("w-5 h-5", activeStyle.text)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 leading-relaxed">
                  Wird gepostet auf <strong className="text-white">{selectedChannel.name}</strong> am{" "}
                  <strong className="text-[#ffb800] font-mono">
                    {dateStr ? new Date(`${dateStr}T${timeStr}:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "–"} um {timeStr} Uhr
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 border-t border-white/10 bg-[#0b0a0d]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-white/5 hover:text-white transition cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleScheduleSubmit}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#ff652e] hover:bg-[#ff7b4d] text-white text-sm font-bold shadow-lg shadow-[#ff652e]/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarIcon className="w-4 h-4" />
            )}
            <span>Jetzt verbindlich einplanen</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
