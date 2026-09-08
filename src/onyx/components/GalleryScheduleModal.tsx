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
import type { SocialChannel, ScheduledPost, SocialPlatform, BrandProfile, ApiSettings, User } from "../types";
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

export function GalleryScheduleModal({
  isOpen,
  onClose,
  item,
  onNavigateToScheduler,
  settings,
  currentUser,
  onScheduled,
}: GalleryScheduleModalProps) {
  if (!isOpen || !item) return null;

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
        platform: selectedChannel.platform,
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
  const activeStyle = PLATFORM_COLORS[selectedChannel.platform] || PLATFORM_COLORS.instagram;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0e0c16]/95 p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 space-y-6 text-white custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#FF4D17]/15 blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#FF3D00] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,87,34,0.4)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Beitrag im Planer terminieren</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Wähle Kanal, Veröffentlichungszeitpunkt & optimiere deine Caption.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Column Structured Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Media Preview & Caption (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Vorschau & Medien</span>
                <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  {item.imageUrls.length} {item.imageUrls.length === 1 ? "Bild" : "Slides"}
                </span>
              </span>

              {/* Media Preview Box */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner group">
                {item.imageUrls[0] ? (
                  <img
                    src={item.imageUrls[0]}
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
                    <span>+{item.imageUrls.length - 1} weitere Slides</span>
                  </div>
                )}
              </div>

              {/* Slide strip if multi-image */}
              {item.imageUrls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                  {item.imageUrls.slice(0, 6).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/15 shrink-0 bg-black/40"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono px-1 py-0.2 rounded-tl text-zinc-300">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">Titel des Beitrags:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. 5 Tipps für mehr Reichweite"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition"
              />
            </div>

            {/* Post Caption / Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Caption / Beschreibung:</label>
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition resize-none custom-scrollbar"
              />
              <div className="text-right text-[10px] text-zinc-500 font-mono">
                {caption.length} Zeichen
              </div>
            </div>
          </div>

          {/* Right Column: Channels & Sexy Time Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Kanal / Platform Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
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
                  const style = PLATFORM_COLORS[chan.platform] || PLATFORM_COLORS.instagram;

                  return (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => setSelectedChannelId(chan.id)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm relative overflow-hidden group",
                        isSel
                          ? "bg-[#FF4D17]/15 border-[#FF4D17] ring-1 ring-[#FF4D17]/50 text-white shadow-[0_0_20px_-3px_rgba(255,77,23,0.3)]"
                          : "bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.06] hover:border-white/20"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-xl border shrink-0", style.bg, style.border)}>
                        <ChanIcon className={cn("w-4 h-4", style.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{chan.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate capitalize">{chan.platform}</div>
                      </div>
                      {isSel && (
                        <div className="w-4 h-4 rounded-full bg-[#FF4D17] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Datum & Uhrzeit (Sexy Smart Slots + Picker) */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                2. Veröffentlichungszeitpunkt:
              </span>

              {/* Quick Presets Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-orange-400" />
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
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-orange-500/10 hover:border-orange-500/40 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{preset.desc}</div>
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
                    className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition font-mono"
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
                    className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Selected Summary Badge */}
            <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", activeStyle.text)} />
                <span className="text-zinc-300">
                  Wird gepostet auf <strong className="text-white">{selectedChannel.name}</strong> am{" "}
                  <strong className="text-orange-400 font-mono">
                    {dateStr ? new Date(`${dateStr}T${timeStr}:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "–"} um {timeStr} Uhr
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleScheduleSubmit}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF5722] to-[#FF3D00] hover:from-[#FF6E40] hover:to-[#FF5722] text-white text-xs font-bold shadow-[0_0_25px_rgba(255,87,34,0.45)] hover:shadow-[0_0_35px_rgba(255,87,34,0.6)] transition-all cursor-pointer disabled:opacity-50"
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
