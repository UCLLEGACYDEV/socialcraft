import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Send,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  MessageSquare,
  Hash,
  Wand2,
  ShieldCheck,
  HelpCircle,
  Eye,
  X,
  Plus,
} from "lucide-react";
import type {
  SocialChannel,
  ScheduledPost,
  SocialPlatform,
  SlideContent,
  HistoryEntry,
} from "@/onyx/types";
import { PLATFORM_ICONS } from "@/onyx/components/widgets/scheduler-utils";
import { generateViralCaption } from "@/onyx/caption-generator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostComposerProps {
  channels: SocialChannel[];
  currentSlides?: SlideContent[];
  historyEntries?: HistoryEntry[];
  editingPost?: ScheduledPost | null;
  initialScheduledItem?: { title: string; imageUrls: string[]; prompt?: string } | null;
  onSavePost: (post: Partial<ScheduledPost> & { id?: string }) => void;
  onPublishNow: (post: ScheduledPost) => void;
  onCancel: () => void;
  prefillDate?: string;
}

const PLATFORM_LIMITS: Record<string, { maxChars: number; maxHashtags: number }> = {
  instagram: { maxChars: 2200, maxHashtags: 30 },
  linkedin: { maxChars: 3000, maxHashtags: 10 },
  tiktok: { maxChars: 2200, maxHashtags: 15 },
  facebook: { maxChars: 63206, maxHashtags: 10 },
  x: { maxChars: 280, maxHashtags: 5 },
  youtube: { maxChars: 5000, maxHashtags: 15 },
};

export function PostComposer({
  channels,
  currentSlides = [],
  historyEntries = [],
  editingPost,
  initialScheduledItem,
  onSavePost,
  onPublishNow,
  onCancel,
  prefillDate,
}: PostComposerProps) {
  // Post state
  const [title, setTitle] = useState(
    editingPost?.title || initialScheduledItem?.title || "Mein neuer Beitrag",
  );
  const [caption, setCaption] = useState(editingPost?.caption || "");
  const [hashtags, setHashtags] = useState<string[]>(
    editingPost?.hashtags || ["contentcreator", "marketing", "socialmedia"],
  );
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(() => {
    if (editingPost) return [editingPost.channelId];
    return channels.length > 0 && channels[0] ? [channels[0].id] : [];
  });

  // Media state
  const [mediaUrls, setMediaUrls] = useState<string[]>(() => {
    if (editingPost?.mediaUrls) return editingPost.mediaUrls;
    if (initialScheduledItem?.imageUrls) return initialScheduledItem.imageUrls;
    if (currentSlides.length > 0) {
      return currentSlides.filter((s) => s.imageUrl).map((s) => s.imageUrl as string);
    }
    return [];
  });

  // Scheduling date & time state
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    if (editingPost?.scheduledFor) return editingPost.scheduledFor.slice(0, 16);
    if (prefillDate) return `${prefillDate}T18:00`;
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });

  // Simulator Preview State
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>("instagram");
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Active channel
  const primaryChannel = channels.find((c) => selectedChannelIds.includes(c.id)) || channels[0];
  const activeLimits = PLATFORM_LIMITS[primaryChannel?.platform || "instagram"] || {
    maxChars: 2200,
    maxHashtags: 30,
  };

  const toggleChannel = (id: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id],
    );
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, "");
    if (trimmed && !hashtags.includes(trimmed)) {
      setHashtags((prev) => [...prev, trimmed]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (idx: number) => {
    setHashtags((prev) => prev.filter((_, i) => i !== idx));
  };

  // AI Viral Assistant
  const handleAIAssist = async () => {
    setIsGeneratingCaption(true);
    try {
      const generated = await generateViralCaption({
        topic: title,
        platform: primaryChannel?.platform === "tiktok" || primaryChannel?.platform === "linkedin" || primaryChannel?.platform === "facebook"
          ? primaryChannel.platform
          : "instagram",
      });
      if (generated?.caption) {
        setCaption(generated.caption);
      }
      if (generated?.hashtags && generated.hashtags.length > 0) {
        setHashtags(generated.hashtags);
      }
      toast.success("Viraler Text & Hashtags generiert! ✨");
    } catch {
      toast.error("Fehler beim Generieren der Bildunterschrift.");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleSave = (status: "draft" | "in_review" | "scheduled") => {
    if (!title.trim()) {
      toast.error("Bitte gib einen Titel für den Beitrag ein.");
      return;
    }
    if (selectedChannelIds.length === 0) {
      toast.error("Bitte wähle mindestens einen Zielkanal.");
      return;
    }

    const isoTime = new Date(scheduledDate).toISOString();

    onSavePost({
      ...(editingPost ? { id: editingPost.id } : {}),
      title,
      caption,
      hashtags,
      mediaUrls,
      mediaType: mediaUrls.length > 1 ? "carousel" : "image",
      channelId: primaryChannel?.id || "default",
      platform: primaryChannel?.platform || "instagram",
      scheduledFor: isoTime,
      status,
      qualityScore: 95,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── Top Bar: Title & Cancel ────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-lg font-black text-white">
            {editingPost ? "Beitrag bearbeiten" : "Neuen Beitrag verfassen"}
          </h2>
          <p className="text-xs text-zinc-400">
            Wähle Zielkanäle, formatiere deinen Text und prüfe die Live-Vorschau
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4" />
          <span>Abbrechen</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Editor & Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Channel Target Selection */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Zielkanäle wählen:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {channels.map((ch) => {
                const Icon = PLATFORM_ICONS[ch.platform] || Layers;
                const isSelected = selectedChannelIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#FF4D17]/20 border-[#FF4D17] text-white shadow-[0_0_15px_rgba(255,77,23,0.3)]"
                        : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:border-white/20",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{ch.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#FF4D17]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Post Title & Content */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Interner Titel (Thema):</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. 5 Schritte zur Personenmarke 2026"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17]"
              />
            </div>

            {/* Caption & Live Character Count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-300 flex items-center gap-2">
                  <span>Bildunterschrift (Caption):</span>
                  <button
                    type="button"
                    onClick={handleAIAssist}
                    disabled={isGeneratingCaption}
                    className="inline-flex items-center gap-1 text-[11px] text-[#FF4D17] hover:underline font-bold"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{isGeneratingCaption ? "Wird generiert…" : "Viralisieren ✨"}</span>
                  </button>
                </label>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold",
                    caption.length > activeLimits.maxChars ? "text-red-400" : "text-zinc-500",
                  )}
                >
                  {caption.length} / {activeLimits.maxChars} Zeichen
                </span>
              </div>
              <textarea
                rows={6}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Schreibe deinen Text hier oder nutze den KI-Assistenten…"
                className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs leading-relaxed text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17] font-sans"
              />
            </div>

            {/* Hashtags Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-[#FF4D17]" />
                  <span>Hashtags:</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {hashtags.length} / {activeLimits.maxHashtags}
                </span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-orange-300 font-mono"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Hashtag eingeben und Enter drücken…"
                  className="flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Media Gallery Selection */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-[#FF4D17]" />
                <span>Ausgewählte Medien ({mediaUrls.length} Folien):</span>
              </label>
              {currentSlides.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const urls = currentSlides
                      .filter((s) => s.imageUrl)
                      .map((s) => s.imageUrl as string);
                    setMediaUrls(urls);
                    toast.success("Karussell-Folien aus aktuellem Entwurf übernommen!");
                  }}
                  className="text-[11px] text-[#FF4D17] hover:underline font-bold"
                >
                  Aus Karussell-Studio übernehmen
                </button>
              )}
            </div>

            {mediaUrls.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {mediaUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/5] w-20 rounded-xl overflow-hidden border border-white/15 bg-zinc-900 shrink-0 group"
                  >
                    <img src={url} alt={`Folie ${i + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] font-mono text-white">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-red-600 text-white transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-zinc-500 text-xs">
                Keine Medien ausgewählt. Übernimm Folien aus dem Karussell oder lade Bilder hoch.
              </div>
            )}
          </div>

          {/* Card 4: Date & Time Scheduling */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#FF4D17]" />
              <span>Sendezeitpunkt & Veröffentlichung:</span>
            </label>

            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-[#FF4D17] font-mono"
            />

            {/* Quick time shortcuts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  today.setHours(18, 0, 0, 0);
                  setScheduledDate(today.toISOString().slice(0, 16));
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-zinc-300 hover:text-white"
              >
                Heute 18:00 (Beste Zeit)
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date(Date.now() + 86400000);
                  tomorrow.setHours(12, 0, 0, 0);
                  setScheduledDate(tomorrow.toISOString().slice(0, 16));
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-zinc-300 hover:text-white"
              >
                Morgen 12:00
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSave("scheduled")}
              className="cryptox-orange-btn !py-3 !px-6 text-xs font-black w-full sm:w-auto flex-1 shadow-[0_0_25px_rgba(255,77,23,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Verbindlich einplanen</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave("in_review")}
              className="cryptox-ghost-btn !py-3 !px-5 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Zur Freigabe (Inbox)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave("draft")}
              className="cryptox-ghost-btn !py-3 !px-4 text-xs font-semibold text-zinc-400 hover:text-white w-full sm:w-auto cursor-pointer"
            >
              Als Entwurf
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Simulator Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-white/[0.12] bg-[#0d0d11] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#FF4D17]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Live Kanal-Vorschau
                </span>
              </div>

              {/* Platform Switcher */}
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                {(["instagram", "linkedin", "tiktok"] as SocialPlatform[]).map((plat) => {
                  const Icon = PLATFORM_ICONS[plat];
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPreviewPlatform(plat)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        previewPlatform === plat
                          ? "bg-[#FF4D17] text-white"
                          : "text-zinc-400 hover:text-white",
                      )}
                      title={plat}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated Smartphone Card */}
            <div className="rounded-2xl border border-white/10 bg-black/80 overflow-hidden shadow-xl p-4 space-y-3">
              {/* Account Header */}
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#FF4D17] to-amber-400 flex items-center justify-center text-white text-xs font-bold">
                  {primaryChannel?.name?.charAt(0) || "S"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">
                    {primaryChannel?.handle || "@socialcraft"}
                  </h4>
                  <span className="text-[10px] text-zinc-500">Gesponsert · Socialcraft Feed</span>
                </div>
              </div>

              {/* Media Card */}
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-zinc-950 flex items-center justify-center">
                {mediaUrls[previewSlideIdx] ? (
                  <img
                    src={mediaUrls[previewSlideIdx]}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-zinc-600 space-y-2">
                    <ImageIcon className="h-8 w-8 mx-auto" />
                    <p className="text-[11px]">Wähle Bilder für die Vorschau</p>
                  </div>
                )}

                {mediaUrls.length > 1 && (
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
                    {mediaUrls.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewSlideIdx(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          previewSlideIdx === i ? "w-5 bg-[#FF4D17]" : "w-1.5 bg-white/40",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Caption Preview */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-white mr-1.5">
                  {primaryChannel?.handle || "creator"}
                </span>
                <span className="text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                  {caption || "Hier erscheint deine optimierte Bildunterschrift..."}
                </span>

                {hashtags.length > 0 && (
                  <p className="text-orange-400/90 font-mono text-[11px] pt-1">
                    {hashtags.map((t) => `#${t.replace(/^#/, "")}`).join(" ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
