import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Share2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Facebook,
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Send,
  Eye,
  Images,
  BookOpen,
  ArrowRight,
  FolderOpen,
  Globe,
  MessageSquare,
  Twitter,
  RefreshCw,
  Key,
  ShieldCheck,
  AlertTriangle,
  Music,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Edit3,
  X,
} from "lucide-react";
import type { SocialChannel, ScheduledPost, SocialPlatform, SlideContent, HistoryEntry, ApiSettings } from "../types";
import { DEFAULT_SOCIAL_CHANNELS } from "../defaults";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ZernioApiClient, createZernioClient } from "../zernio/client";
import { buildZernioPayload } from "../zernio/formatter";
import { TikTokMusicLibraryModal } from "./TikTokMusicLibraryModal";
import { TIKTOK_MUSIC_LIBRARY, type TikTokSoundItem } from "../data/tiktok-sounds";

interface PostSchedulerViewProps {
  channels: SocialChannel[];
  onUpdateChannels: (channels: SocialChannel[]) => void;
  posts: ScheduledPost[];
  onUpdatePosts: (posts: ScheduledPost[]) => void;
  currentSlides?: SlideContent[];
  historyEntries?: HistoryEntry[];
  initialScheduledItem?: { title: string; imageUrls: string[]; prompt?: string } | null;
  onNavigateToCarousel?: () => void;
  settings?: ApiSettings;
  onOpenZernioSetup?: () => void;
}

const PLATFORM_ICONS: Record<SocialPlatform, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Video,
  youtube: Youtube,
  linkedin: Linkedin,
  bluesky: Globe,
  discord: MessageSquare,
  twitter: Twitter,
  pinterest: Images,
  threads: MessageSquare,
  whatsapp: MessageSquare,
  telegram: Send,
};

const PLATFORM_COLORS: Record<SocialPlatform, { bg: string; border: string; text: string; badge: string }> = {
  facebook: {
    bg: "bg-blue-600/15",
    border: "border-blue-500/40",
    text: "text-blue-400",
    badge: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  },
  instagram: {
    bg: "bg-pink-600/15",
    border: "border-pink-500/40",
    text: "text-pink-400",
    badge: "bg-pink-600/20 text-pink-300 border-pink-500/30",
  },
  tiktok: {
    bg: "bg-cyan-600/15",
    border: "border-cyan-500/40",
    text: "text-cyan-400",
    badge: "bg-cyan-600/20 text-cyan-300 border-cyan-500/30",
  },
  youtube: {
    bg: "bg-red-600/15",
    border: "border-red-500/40",
    text: "text-red-400",
    badge: "bg-red-600/20 text-red-300 border-red-500/30",
  },
  linkedin: {
    bg: "bg-sky-600/15",
    border: "border-sky-500/40",
    text: "text-sky-400",
    badge: "bg-sky-600/20 text-sky-300 border-sky-500/30",
  },
  bluesky: {
    bg: "bg-indigo-600/15",
    border: "border-indigo-500/40",
    text: "text-indigo-400",
    badge: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30",
  },
  discord: {
    bg: "bg-purple-600/15",
    border: "border-purple-500/40",
    text: "text-purple-400",
    badge: "bg-purple-600/20 text-purple-300 border-purple-500/30",
  },
  twitter: {
    bg: "bg-zinc-600/15",
    border: "border-zinc-500/40",
    text: "text-zinc-300",
    badge: "bg-zinc-600/20 text-zinc-300 border-zinc-500/30",
  },
  pinterest: {
    bg: "bg-rose-600/15",
    border: "border-rose-500/40",
    text: "text-rose-400",
    badge: "bg-rose-600/20 text-rose-300 border-rose-500/30",
  },
  threads: {
    bg: "bg-zinc-700/15",
    border: "border-zinc-600/40",
    text: "text-zinc-200",
    badge: "bg-zinc-700/20 text-zinc-200 border-zinc-600/30",
  },
  whatsapp: {
    bg: "bg-emerald-600/15",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    badge: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
  },
  telegram: {
    bg: "bg-sky-500/15",
    border: "border-sky-400/40",
    text: "text-sky-300",
    badge: "bg-sky-500/20 text-sky-200 border-sky-400/30",
  },
};

export function PostSchedulerView({
  channels = DEFAULT_SOCIAL_CHANNELS,
  onUpdateChannels,
  posts = [],
  onUpdatePosts,
  currentSlides = [],
  historyEntries = [],
  initialScheduledItem = null,
  onNavigateToCarousel,
  settings,
  onOpenZernioSetup,
}: PostSchedulerViewProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "composer" | "channels">(
    initialScheduledItem ? "composer" : "queue"
  );
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

  // Composer Form State
  const defaultChannel = channels.find((c) => c.isDefault) || channels[0] || DEFAULT_SOCIAL_CHANNELS[0];
  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannel?.id || "fb-main-page");
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
  const [postTitle, setPostTitle] = useState<string>(initialScheduledItem?.title || "");
  const [postCaption, setPostCaption] = useState<string>(
    initialScheduledItem?.prompt ? `${initialScheduledItem.title}\n\n${initialScheduledItem.prompt}` : ""
  );
  const [postHashtags, setPostHashtags] = useState<string>("#marketing #business #growth #socialcraft");
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>(() => {
    if (initialScheduledItem?.imageUrls && initialScheduledItem.imageUrls.length > 0) {
      return initialScheduledItem.imageUrls;
    }
    const validSlideImages = currentSlides.map((s) => s.imageUrl).filter(Boolean) as string[];
    return validSlideImages.length > 0 ? validSlideImages : [];
  });
  const [customMediaUrl, setCustomMediaUrl] = useState("");

  // Update when initialScheduledItem changes
  useEffect(() => {
    if (initialScheduledItem) {
      setPostTitle(initialScheduledItem.title || "");
      if (initialScheduledItem.imageUrls && initialScheduledItem.imageUrls.length > 0) {
        setSelectedMediaUrls(initialScheduledItem.imageUrls);
      }
      if (initialScheduledItem.prompt) {
        setPostCaption(`${initialScheduledItem.title}\n\n${initialScheduledItem.prompt}`);
      }
      setActiveTab("composer");
    }
  }, [initialScheduledItem]);

  // New Channel Dialog State
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("facebook");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelId, setNewChannelId] = useState("");
  const [newHandle, setNewHandle] = useState("");

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("In Zwischenablage kopiert! 📋");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    const imgs = entry.slides.map((s) => s.imageUrl).filter(Boolean) as string[];
    setSelectedMediaUrls(imgs);
    setPostTitle(entry.topic);

    // Build intelligent caption from slides
    const keyPoints = entry.slides
      .filter((s) => s.headline && s.role !== "hook" && s.role !== "closing")
      .slice(0, 4)
      .map((s, i) => `🔹 ${s.headline}${s.subtext ? `: ${s.subtext}` : ""}`)
      .join("\n");

    const closingSlide = entry.slides.find((s) => s.role === "closing");
    const cta = closingSlide?.headline || "Speichere dir diesen Post für später ab. 🚀";

    const composedCaption = `${entry.topic}\n\n${keyPoints ? `${keyPoints}\n\n` : ""}${cta}`;
    setPostCaption(composedCaption);

    // Auto-generate hashtags from title
    const titleWords = entry.topic
      .replace(/[^a-zA-ZäöüÄÖÜ0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .map((w) => `#${w.toLowerCase()}`);
    const tags = Array.from(new Set([...titleWords, "#socialcraft", "#growth"])).slice(0, 5);
    setPostHashtags(tags.join(" "));

    setShowHistoryPicker(false);
    setActiveTab("composer");
    toast.success(`Beitrag „${entry.topic}“ mit ${imgs.length} Folien geladen! ✨`);
  };

  // Platform-Specific Composer Options
  const [tiktokPrivacy, setTiktokPrivacy] = useState<"PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY">("PUBLIC_TO_EVERYONE");
  const [tiktokAllowComments, setTiktokAllowComments] = useState(true);
  const [tiktokAllowDuet, setTiktokAllowDuet] = useState(true);
  const [tiktokAllowStitch, setTiktokAllowStitch] = useState(true);
  const [tiktokAiDisclosure, setTiktokAiDisclosure] = useState(false);
  const [tiktokAutoMusic, setTiktokAutoMusic] = useState(true);
  const [selectedSound, setSelectedSound] = useState<TikTokSoundItem | null>(null);
  const [showMusicLibraryModal, setShowMusicLibraryModal] = useState(false);

  const [instagramShareToFeed, setInstagramShareToFeed] = useState(true);
  const [instagramAiDisclosure, setInstagramAiDisclosure] = useState(false);
  const [instagramFirstComment, setInstagramFirstComment] = useState("");

  const [facebookDraft, setFacebookDraft] = useState(false);
  const [facebookFirstComment, setFacebookFirstComment] = useState("");

  const [isPublishingZernio, setIsPublishingZernio] = useState(false);
  const [isSyncingChannels, setIsSyncingChannels] = useState(false);

  // Edit / Reschedule state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [quickReschedulePost, setQuickReschedulePost] = useState<ScheduledPost | null>(null);
  const [quickRescheduleDate, setQuickRescheduleDate] = useState<string>("");

  const handleSyncZernioAccounts = async () => {
    if (!settings?.zernioApiKey) {
      toast.info("Bitte hinterlege zuerst deinen Publisher Engine Key.", {
        action: onOpenZernioSetup ? { label: "Setup öffnen", onClick: onOpenZernioSetup } : undefined,
      });
      return;
    }

    setIsSyncingChannels(true);
    try {
      const client = new ZernioApiClient(settings.zernioApiKey);
      const res = await client.listAccounts(settings.zernioProfileId);

      if (!res.accounts || res.accounts.length === 0) {
        toast.info("Keine verbundenen Social-Media-Accounts gefunden. Verbinde Kanäle im Setup.");
        return;
      }

      const imported: SocialChannel[] = res.accounts.map((acc) => ({
        id: `direct-${acc._id}`,
        platform: (acc.platform as SocialPlatform) || "facebook",
        name: acc.displayName || acc.username || `${acc.platform} Account`,
        channelId: acc._id,
        zernioAccountId: acc._id,
        handle: acc.username ? (acc.username.startsWith("@") ? acc.username : `@${acc.username}`) : undefined,
        avatarUrl: acc.avatarUrl || "/images/socialcraft-logo.png",
        isDefault: false,
      }));

      // Merge with current channels, deduplicating by channelId
      const existingIds = new Set(channels.map((c) => c.channelId));
      const newChannels = imported.filter((c) => !existingIds.has(c.channelId));

      if (newChannels.length > 0) {
        onUpdateChannels([...channels, ...newChannels]);
        toast.success(`${newChannels.length} Social-Media-Kanäle erfolgreich synchronisiert! 🎉`);
      } else {
        toast.info("Alle verknüpften Accounts sind bereits in deiner Kanalliste.");
      }
    } catch (err: any) {
      toast.error(`Sync-Fehler: ${err.message}`);
    } finally {
      setIsSyncingChannels(false);
    }
  };

  const handleCancelPost = async (post: ScheduledPost) => {
    if (post.zernioPostId && settings?.zernioApiKey) {
      try {
        const client = new ZernioApiClient(settings.zernioApiKey);
        await client.deletePost(post.zernioPostId).catch(() => {});
      } catch (e) {
        console.warn("Konnte Remote-Post nicht löschen", e);
      }
    }
    const updated = posts.map((p) =>
      p.id === post.id ? { ...p, status: "cancelled" as const } : p
    );
    onUpdatePosts(updated);
    toast.info(`Planung für „${post.title}“ abgebrochen. ❌`, {
      action: {
        label: "Neu planen",
        onClick: () => handleReschedulePost(post),
      },
    });
  };

  const handleReschedulePost = (post: ScheduledPost) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostCaption(post.caption);
    setPostHashtags(post.hashtags.join(" "));
    setSelectedMediaUrls(post.mediaUrls);
    const targetChan = channels.find((c) => c.channelId === post.channelId);
    if (targetChan) setSelectedChannelId(targetChan.id);

    if (post.musicTitle) {
      const match = TIKTOK_MUSIC_LIBRARY.find((s) => s.title === post.musicTitle);
      if (match) setSelectedSound(match);
    } else {
      setSelectedSound(null);
    }

    const postDate = new Date(post.scheduledFor);
    if (postDate.getTime() < Date.now()) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      setScheduledDate(d.toISOString().slice(0, 16));
    } else {
      setScheduledDate(new Date(post.scheduledFor).toISOString().slice(0, 16));
    }

    setActiveTab("composer");
    toast.success(`Beitrag „${post.title}“ zur Neuplanung in den Editor geladen! 📅`);
  };

  const handleQuickRescheduleOpen = (post: ScheduledPost) => {
    setQuickReschedulePost(post);
    setQuickRescheduleDate(new Date(post.scheduledFor).toISOString().slice(0, 16));
  };

  const handleQuickRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReschedulePost || !quickRescheduleDate) return;
    const updated = posts.map((p) =>
      p.id === quickReschedulePost.id
        ? {
            ...p,
            scheduledFor: new Date(quickRescheduleDate).toISOString(),
            status: p.status === "cancelled" ? ("scheduled" as const) : p.status,
          }
        : p
    );
    onUpdatePosts(updated);
    toast.success(`Termin erfolgreich aktualisiert: ${new Date(quickRescheduleDate).toLocaleString("de-DE")} 🕒`);
    setQuickReschedulePost(null);
  };

  const handlePublishViaZernio = async (publishNow = true) => {
    if (!postCaption.trim() && !postTitle.trim()) {
      toast.error("Bitte gib einen Titel oder einen Beitragstext ein.");
      return;
    }

    const channel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
    const allHashtags = postHashtags
      .split(/[\s,]+/)
      .filter((t) => t.startsWith("#") || t.length > 1)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    const mediaList = selectedMediaUrls.length > 0 ? selectedMediaUrls : customMediaUrl ? [customMediaUrl] : [];

    if (!settings?.zernioApiKey) {
      toast.error("Kein Publisher Engine Key hinterlegt. Öffne das Direct Hub Setup!", {
        action: onOpenZernioSetup ? { label: "Setup", onClick: onOpenZernioSetup } : undefined,
      });
      return;
    }

    setIsPublishingZernio(true);
    try {
      const client = new ZernioApiClient(settings.zernioApiKey);
      const postResult = await client.publishOrSchedulePost({
        title: postTitle.trim() || "Socialcraft Post",
        caption: postCaption.trim(),
        hashtags: allHashtags,
        mediaUrls: mediaList,
        mediaType: mediaList.length > 1 ? "carousel" : "image",
        platform: channel.platform as any,
        accountId: channel.zernioAccountId || channel.channelId,
        publishNow,
        scheduledFor: !publishNow ? new Date(scheduledDate).toISOString() : undefined,
        tiktokOptions: {
          privacyLevel: tiktokPrivacy,
          allowComments: tiktokAllowComments,
          allowDuet: tiktokAllowDuet,
          allowStitch: tiktokAllowStitch,
          videoMadeWithAi: tiktokAiDisclosure,
          autoAddMusic: tiktokAutoMusic,
        },
        instagramOptions: {
          shareToFeed: instagramShareToFeed,
          isAiGenerated: instagramAiDisclosure,
          firstComment: instagramFirstComment || undefined,
        },
        facebookOptions: {
          draft: facebookDraft,
          firstComment: facebookFirstComment || undefined,
        },
      });

      const newPost: ScheduledPost = {
        id: editingPostId || `post-${Date.now()}`,
        title: postTitle.trim() || "Socialcraft Beitrag",
        caption: postCaption.trim(),
        hashtags: allHashtags,
        mediaUrls: mediaList,
        mediaType: mediaList.length > 1 ? "carousel" : "image",
        channelId: channel.channelId,
        platform: channel.platform,
        scheduledFor: new Date(scheduledDate).toISOString(),
        status: publishNow ? "published" : "scheduled",
        createdAt: new Date().toISOString(),
        publishedAt: publishNow ? new Date().toISOString() : undefined,
        zernioPostId: postResult._id,
        zernioStatus: postResult.status,
        externalPostUrl: postResult.platforms?.[0]?.platformPostUrl,
        musicTitle: selectedSound?.title,
        musicArtist: selectedSound?.artist,
      };

      if (editingPostId) {
        onUpdatePosts(posts.map((p) => (p.id === editingPostId ? newPost : p)));
        setEditingPostId(null);
      } else {
        onUpdatePosts([newPost, ...posts]);
      }
      
      if (publishNow) {
        toast.success("🚀 Erfolgreich live veröffentlicht!", {
          description: `Status: ${postResult.status} (ID: ${postResult._id})`,
        });
      } else {
        toast.success("📅 Erfolgreich im Direct Hub terminiert!", {
          description: `Geplant für ${new Date(scheduledDate).toLocaleString("de-DE")}`,
        });
      }

      setPostTitle("");
      setPostCaption("");
      setSelectedSound(null);
      setActiveTab("queue");
    } catch (err: any) {
      toast.error(`Veröffentlichung fehlgeschlagen: ${err.message}`);
    } finally {
      setIsPublishingZernio(false);
    }
  };

  const handleSchedulePost = () => {
    if (!postCaption.trim() && !postTitle.trim()) {
      toast.error("Bitte gib einen Titel oder einen Beitragstext ein.");
      return;
    }

    const channel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
    const allHashtags = postHashtags
      .split(/[\s,]+/)
      .filter((t) => t.startsWith("#") || t.length > 1)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    const newPost: ScheduledPost = {
      id: editingPostId || `post-${Date.now()}`,
      title: postTitle.trim() || "Socialcraft Beitrag",
      caption: postCaption.trim(),
      hashtags: allHashtags,
      mediaUrls: selectedMediaUrls.length > 0 ? selectedMediaUrls : customMediaUrl ? [customMediaUrl] : [],
      mediaType: selectedMediaUrls.length > 1 ? "carousel" : "image",
      channelId: channel.channelId,
      platform: channel.platform,
      scheduledFor: new Date(scheduledDate).toISOString(),
      status: "scheduled",
      createdAt: new Date().toISOString(),
      musicTitle: selectedSound?.title,
      musicArtist: selectedSound?.artist,
    };

    if (editingPostId) {
      onUpdatePosts(posts.map((p) => (p.id === editingPostId ? newPost : p)));
      setEditingPostId(null);
      toast.success("Beitrag erfolgreich aktualisiert & neu geplant! 🚀", {
        description: `Geplant für ${new Date(scheduledDate).toLocaleString("de-DE")} auf ${channel.name}`,
      });
    } else {
      onUpdatePosts([newPost, ...posts]);
      toast.success("Beitrag erfolgreich lokal geplant! 🚀", {
        description: `Geplant für ${new Date(scheduledDate).toLocaleString("de-DE")} auf ${channel.name} (ID: ${channel.channelId})`,
      });
    }

    // Reset composer
    setPostTitle("");
    setPostCaption("");
    setSelectedSound(null);
    setActiveTab("queue");
  };

  const handleDeletePost = (id: string) => {
    onUpdatePosts(posts.filter((p) => p.id !== id));
    toast.info("Geplanter Beitrag entfernt.");
  };

  const handleMarkPublished = (post: ScheduledPost) => {
    const updated = posts.map((p) =>
      p.id === post.id
        ? { ...p, status: "published" as const, publishedAt: new Date().toISOString() }
        : p
    );
    onUpdatePosts(updated);
    toast.success("Beitrag als veröffentlicht markiert! 🎉");
  };

  const handleOpenDirectPublisher = (post: ScheduledPost) => {
    const targetChannel = channels.find((c) => c.channelId === post.channelId);
    if (post.platform === "facebook") {
      const pageId = post.channelId || "337570872768998";
      const businessId = targetChannel?.businessId || "25861095310170488";
      const url = `https://business.facebook.com/latest/composer?business_id=${businessId}&selected_asset_id=${pageId}`;
      window.open(url, "_blank");
      toast.info("Meta Business Suite geöffnet!", {
        description: `Text & Bilder können jetzt mit 1 Klick auf Seite ${pageId} veröffentlicht werden.`,
      });
    } else if (post.platform === "instagram") {
      window.open("https://instagram.com", "_blank");
    } else if (post.platform === "tiktok") {
      window.open("https://www.tiktok.com/creator-center/upload", "_blank");
    } else if (post.platform === "youtube") {
      window.open("https://studio.youtube.com", "_blank");
    } else if (post.platform === "linkedin") {
      window.open("https://www.linkedin.com/feed/", "_blank");
    }
  };

  const handleAddChannelSubmit = () => {
    if (!newChannelName.trim() || !newChannelId.trim()) {
      toast.error("Bitte Name und Kanal-ID angeben.");
      return;
    }
    const channel: SocialChannel = {
      id: `chan-${Date.now()}`,
      platform: newPlatform,
      name: newChannelName.trim(),
      channelId: newChannelId.trim(),
      handle: newHandle.trim() ? (newHandle.startsWith("@") ? newHandle : `@${newHandle}`) : undefined,
      avatarUrl: "/images/socialcraft-logo.png",
      isDefault: channels.length === 0,
    };
    onUpdateChannels([...channels, channel]);
    setShowAddChannel(false);
    setNewChannelName("");
    setNewChannelId("");
    setNewHandle("");
    toast.success("Kanal erfolgreich hinzugefügt!");
  };

  const handleDeleteChannel = (id: string) => {
    if (channels.length <= 1) {
      toast.error("Du musst mindestens einen Haupt-Kanal behalten.");
      return;
    }
    onUpdateChannels(channels.filter((c) => c.id !== id));
    toast.info("Kanal entfernt.");
  };

  const filteredPosts = posts.filter((p) => {
    if (filterPlatform === "all") return true;
    return p.platform === filterPlatform;
  });

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto pb-16">
      {/* ── Top Hero & Channel Banner ───────────────────────────────── */}
      <div className="cryptox-card relative overflow-hidden p-6 sm:p-8 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(255,77,23,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400">
                Socialcraft Direct Hub • Multi-Channel Scheduler
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Beitrags-Planer & Kanal-Zentrale
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Plane Beiträge direkt über deine <strong className="text-white">Kanal- & Seiten-IDs</strong> (z. B. Facebook Seite <span className="font-mono text-orange-300">337570872768998</span>) oder übernehme bestehende Projekte aus deiner Galerie.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenZernioSetup && (
              <button
                type="button"
                onClick={onOpenZernioSetup}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                  settings?.zernioApiKey
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-[#FF4D17]/10 text-orange-400 border-orange-500/40 hover:bg-[#FF4D17]/20"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <Share2 className="h-3.5 w-3.5" />
                <span>{settings?.zernioApiKey ? "Direct Hub aktiv" : "Direct Hub verbinden"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "queue"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                  : "bg-white/[0.04] text-zinc-300 border border-white/10 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Geplante Beiträge ({posts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("composer")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "composer"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                  : "bg-white/[0.04] text-zinc-300 border border-white/10 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Neuen Beitrag planen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("channels")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "channels"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                  : "bg-white/[0.04] text-zinc-300 border border-white/10 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Kanäle & IDs ({channels.length})</span>
            </button>
          </div>
        </div>

        {/* ── Active Channel Ribbon ───────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400">Aktive Kanäle:</span>
            {channels.map((chan) => {
              const Icon = PLATFORM_ICONS[chan.platform] || Share2;
              const style = PLATFORM_COLORS[chan.platform] || PLATFORM_COLORS.facebook;
              return (
                <div
                  key={chan.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all",
                    style.bg,
                    style.border
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", style.text)} />
                  <span className="text-white font-semibold">{chan.name}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300">
                    ID: {chan.channelId}
                  </span>
                  {chan.isDefault && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/20 px-1 rounded">
                      Standard
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {settings?.zernioApiKey && (
            <button
              type="button"
              disabled={isSyncingChannels}
              onClick={handleSyncZernioAccounts}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncingChannels && "animate-spin text-orange-400")} />
              <span>Accounts syncen</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: QUEUE / GEPLANTE BEITRÄGE ────────────────────────── */}
      {activeTab === "queue" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterPlatform("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  filterPlatform === "all" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                Alle ({posts.length})
              </button>
              {(["facebook", "instagram", "tiktok", "youtube", "linkedin"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPlatform(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer",
                    filterPlatform === p ? "bg-[#FF4D17]/20 text-orange-400 border border-orange-500/40" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {historyEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryPicker(true);
                    setActiveTab("composer");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                  <span>Aus Historie wählen ({historyEntries.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("composer")}
                className="cryptox-orange-btn !py-2 !px-4 text-xs font-bold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Beitrag hinzufügen
              </button>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="cryptox-card p-12 text-center border border-white/[0.08] space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-[#FF4D17]/10 border border-[#FF4D17]/30 flex items-center justify-center text-orange-400">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Noch keine Beiträge in der Warteschlange</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Plane jetzt deinen ersten Beitrag für deine Facebook-Seite (ID: 337570872768998) oder wähle ein fertiges Projekt aus der Galerie.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("composer")}
                  className="cryptox-orange-btn !py-2.5 !px-6 text-xs font-bold"
                >
                  Jetzt Beitrag planen
                </button>
                {historyEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryPicker(true);
                      setActiveTab("composer");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-all"
                  >
                    Aus Historie / Galerie laden ({historyEntries.length})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.map((post) => {
                const Icon = PLATFORM_ICONS[post.platform] || Share2;
                const style = PLATFORM_COLORS[post.platform] || PLATFORM_COLORS.facebook;
                const targetChannel = channels.find((c) => c.channelId === post.channelId);
                const isCopied = copiedId === post.id;
                const isPublished = post.status === "published";
                const isCancelled = post.status === "cancelled";

                return (
                  <div
                    key={post.id}
                    className={cn(
                      "cryptox-card p-5 border flex flex-col justify-between space-y-4 transition-all hover:border-white/20",
                      isPublished
                        ? "border-emerald-500/30 bg-emerald-950/10"
                        : isCancelled
                        ? "border-red-500/20 bg-red-950/5 opacity-80"
                        : "border-white/[0.08]"
                    )}
                  >
                    <div>
                      {/* Card Header: Platform, Target ID & Status */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg border", style.bg, style.border)}>
                            <Icon className={cn("h-4 w-4", style.text)} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {targetChannel?.name || post.platform}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              ID: {post.channelId}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            isPublished
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : isCancelled
                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                              : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                          )}
                        >
                          {isPublished ? "✅ Veröffentlicht" : isCancelled ? "❌ Abgebrochen" : "🕒 Geplant"}
                        </span>
                      </div>

                      {/* Scheduled Time Banner */}
                      <div className="flex items-center justify-between gap-1.5 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                          <span className="font-semibold">
                            {new Date(post.scheduledFor).toLocaleString("de-DE", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {!isPublished && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleQuickRescheduleOpen(post)}
                            className="text-[10px] font-semibold text-orange-400 hover:text-white underline cursor-pointer"
                            title="Uhrzeit schnell ändern"
                          >
                            Uhrzeit ändern
                          </button>
                        )}
                      </div>

                      {/* TikTok Music Indicator */}
                      {post.musicTitle && (
                        <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-1 mt-2">
                          <Music className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span className="font-semibold truncate">
                            Sound: {post.musicTitle} {post.musicArtist ? `(${post.musicArtist})` : ""}
                          </span>
                        </div>
                      )}

                      {/* Title & Caption */}
                      <h4 className="font-bold text-white text-sm mt-3 line-clamp-1">{post.title}</h4>
                      <p className="text-xs text-zinc-300 mt-1 line-clamp-3 bg-black/30 p-2 rounded-lg border border-white/[0.04] font-sans">
                        {post.caption}
                      </p>

                      {/* Media Preview Thumbnails */}
                      {post.mediaUrls.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                          {post.mediaUrls.slice(0, 4).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Media ${i}`}
                              className="h-14 w-12 object-cover rounded-lg border border-white/10 shrink-0 shadow-sm"
                            />
                          ))}
                          {post.mediaUrls.length > 4 && (
                            <div className="h-14 w-12 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                              +{post.mediaUrls.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hashtags */}
                      {post.hashtags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 4).map((h, i) => (
                            <span key={i} className="text-[10px] text-zinc-400 font-mono">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(`${post.caption}\n\n${post.hashtags.join(" ")}`, post.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                          title="Text & Hashtags in Zwischenablage kopieren"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Kopiert!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Text kopieren</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDirectPublisher(post)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white shadow-[0_0_12px_rgba(255,77,23,0.3)] transition-all cursor-pointer"
                          title="Direkt auf Kanal öffnen / veröffentlichen"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Jetzt posten</span>
                        </button>
                      </div>

                      {/* Secondary Actions: Reschedule / Cancel / Delete */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReschedulePost(post)}
                            className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Diesen Beitrag bearbeiten & neu planen"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Neu planen</span>
                          </button>

                          {!isPublished && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelPost(post)}
                              className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition"
                              title="Geplanten Post abbrechen"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Abbrechen</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isPublished && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleMarkPublished(post)}
                              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Erledigt
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Planung endgültig löschen"
                          >
                            <Trash2 className="h-3 w-3" /> Löschen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: COMPOSER / NEUEN BEITRAG PLANEN ───────────────────── */}
      {activeTab === "composer" && (
        <div className="space-y-6">
          {/* ── HISTORIE & GALERIE PICKER (DRAWER / SELECTOR) ─────────── */}
          {historyEntries.length > 0 && (
            <div className="cryptox-card p-5 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-white">
                    Bestehendes Projekt aus Galerie / Historie wählen
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                    {historyEntries.length} bereit
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryPicker((prev) => !prev)}
                  className="text-xs font-semibold text-orange-400 hover:underline cursor-pointer"
                >
                  {showHistoryPicker ? "Einklappen" : "Alle Projekte anzeigen"}
                </button>
              </div>

              {showHistoryPicker && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2 border-t border-white/[0.06]">
                  {historyEntries.map((entry) => {
                    const cover = entry.slides[0]?.imageUrl;
                    const validCount = entry.slides.filter((s) => s.imageUrl).length;
                    return (
                      <div
                        key={entry.id}
                        onClick={() => handleSelectHistoryEntry(entry)}
                        className="group relative flex flex-col p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-orange-500/50 transition-all cursor-pointer shadow-sm"
                      >
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/50 mb-2.5">
                          {cover ? (
                            <img
                              src={cover}
                              alt={entry.topic}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-zinc-600">
                              <Images className="h-6 w-6" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                            {validCount} Slides
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                          {entry.topic}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                        </p>

                        <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-orange-400 font-semibold">
                          <span>In Planer laden</span>
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Main Composer Grid ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form: Planungsdetails & Content */}
            <div className="cryptox-card p-6 border border-white/[0.08] lg:col-span-7 space-y-5">
              {/* Edit Mode Banner */}
              {editingPostId && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-xs text-orange-300 animate-in fade-in">
                  <div className="flex items-center gap-2 font-semibold">
                    <Edit3 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Neuplanung aktiv: Du bearbeitest gerade den ausgewählten Beitrag.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(null);
                      toast.info("Wird als neuer separater Beitrag gespeichert.");
                    }}
                    className="text-xs text-zinc-300 hover:text-white underline cursor-pointer"
                  >
                    Als neue Kopie anlegen
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Beitrag konfigurieren</h3>
                  <p className="text-xs text-zinc-400">Verknüpft mit deiner Kanal-ID für nahtlose Veröffentlichung</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPostTitle("Warum Systeme Motivation schlagen");
                    setPostCaption("Disziplin ist nicht das, was du fühlst – sondern das System, auf das du dich verlässt, wenn Motivation verschwindet.\n\nSpeichere dir diesen Post für dein nächstes Business-Level ab. 🚀");
                    setPostHashtags("#business #systeme #disziplin #growth #mindset");
                  }}
                  className="text-xs font-semibold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Beispiel laden
                </button>
              </div>

              {/* 1. Target Channel Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <span>1. Ziel-Kanal & Seiten-ID wählen:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {channels.map((chan) => {
                    const Icon = PLATFORM_ICONS[chan.platform] || Share2;
                    const isSelected = selectedChannelId === chan.id;
                    const style = PLATFORM_COLORS[chan.platform] || PLATFORM_COLORS.facebook;
                    return (
                      <button
                        key={chan.id}
                        type="button"
                        onClick={() => setSelectedChannelId(chan.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                          isSelected
                            ? "bg-[#FF4D17]/15 border-[#FF4D17] shadow-[0_0_15px_rgba(255,77,23,0.3)] ring-1 ring-[#FF4D17]"
                            : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("p-1.5 rounded-lg border", style.bg, style.border)}>
                            <Icon className={cn("h-4 w-4", style.text)} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{chan.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400">ID: {chan.channelId}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-orange-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Date & Time Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-400" />
                  <span>2. Datum & Uhrzeit der Veröffentlichung:</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#120F17] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* 3. Title & Caption */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Titel / Thema des Beitrags:
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="z. B. 5 Schritte zur perfekten Social-Media-Strategie"
                    className="w-full bg-[#120F17] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Beitragstext / Caption:
                    </label>
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded",
                      selectedChannel.platform === "bluesky" && (postCaption.length + postHashtags.length > 300)
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 font-bold"
                        : "text-zinc-400 bg-black/40"
                    )}>
                      {postCaption.length + (postHashtags ? postHashtags.length + 2 : 0)} Zeichen
                      {selectedChannel.platform === "bluesky" && " / max. 300"}
                      {selectedChannel.platform === "tiktok" && " (TikTok: bis 4.000 Zeichen)"}
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Schreibe hier deinen Beitragstext, Bulletpoints und Call-to-Action..."
                    className="w-full bg-[#120F17] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-orange-500 resize-none font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Hashtags:
                  </label>
                  <input
                    type="text"
                    value={postHashtags}
                    onChange={(e) => setPostHashtags(e.target.value)}
                    placeholder="#socialcraft #growth #content #marketing"
                    className="w-full bg-[#120F17] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* 4. PLATFORM-SPECIFIC SETTINGS ACCORDION */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-orange-400" />
                      <span>Plattform-Einstellungen für {selectedChannel.platform.toUpperCase()}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Socialcraft Direct Engine</span>
                  </div>

                  {/* TIKTOK SPECIFIC SETTINGS */}
                  {selectedChannel.platform === "tiktok" && (
                    <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                      {/* TIKTOK MUSIC SELECTION CARD */}
                      <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-white">TikTok Commercial Music</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowMusicLibraryModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>{selectedSound ? "Sound wechseln" : "Music Library öffnen"}</span>
                          </button>
                        </div>

                        {selectedSound ? (
                          <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-cyan-500/30 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                                🎵
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white text-xs leading-tight truncate">{selectedSound.title}</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{selectedSound.artist} • {selectedSound.duration}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSound(null);
                                toast.info("Sound entfernt.");
                              }}
                              className="text-zinc-400 hover:text-red-400 p-1 cursor-pointer transition"
                              title="Sound entfernen"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-400">
                            Wähle lizenzierte TikTok-Sounds aus der integrierten Bibliothek oder nutze die TikTok Auto-Music Option.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-zinc-400 block mb-1">Sichtbarkeit (Privacy):</label>
                          <select
                            value={tiktokPrivacy}
                            onChange={(e) => setTiktokPrivacy(e.target.value as any)}
                            className="w-full bg-[#120F17] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="PUBLIC_TO_EVERYONE">Öffentlich für alle</option>
                            <option value="MUTUAL_FOLLOW_FRIENDS">Nur Freunde</option>
                            <option value="FOLLOWER_OF_CREATOR">Nur Follower</option>
                            <option value="SELF_ONLY">Nur ich (Privat)</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-center gap-1.5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                            <input
                              type="checkbox"
                              checked={tiktokAiDisclosure}
                              onChange={(e) => setTiktokAiDisclosure(e.target.checked)}
                              className="accent-orange-500 rounded"
                            />
                            <span>Mit KI erstellt (AI Disclosure)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                            <input
                              type="checkbox"
                              checked={tiktokAutoMusic}
                              onChange={(e) => setTiktokAutoMusic(e.target.checked)}
                              className="accent-orange-500 rounded"
                            />
                            <span>Automatische Trend-Musik (TikTok)</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tiktokAllowComments}
                            onChange={(e) => setTiktokAllowComments(e.target.checked)}
                            className="accent-orange-500 rounded"
                          />
                          <span>Kommentare erlauben</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tiktokAllowDuet}
                            onChange={(e) => setTiktokAllowDuet(e.target.checked)}
                            className="accent-orange-500 rounded"
                          />
                          <span>Duette erlauben</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tiktokAllowStitch}
                            onChange={(e) => setTiktokAllowStitch(e.target.checked)}
                            className="accent-orange-500 rounded"
                          />
                          <span>Stitch erlauben</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* INSTAGRAM SPECIFIC SETTINGS */}
                  {selectedChannel.platform === "instagram" && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={instagramShareToFeed}
                            onChange={(e) => setInstagramShareToFeed(e.target.checked)}
                            className="accent-orange-500 rounded"
                          />
                          <span>Im Hauptfeed teilen</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={instagramAiDisclosure}
                            onChange={(e) => setInstagramAiDisclosure(e.target.checked)}
                            className="accent-orange-500 rounded"
                          />
                          <span>KI-Label anzeigen</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Erster Kommentar (First Comment für Links):</label>
                        <input
                          type="text"
                          value={instagramFirstComment}
                          onChange={(e) => setInstagramFirstComment(e.target.value)}
                          placeholder="z. B. Link zum Angebot: https://meine-website.de"
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* FACEBOOK SPECIFIC SETTINGS */}
                  {selectedChannel.platform === "facebook" && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={facebookDraft}
                          onChange={(e) => setFacebookDraft(e.target.checked)}
                          className="accent-orange-500 rounded"
                        />
                        <span>Als Entwurf in den Facebook Publishing Tools anlegen</span>
                      </label>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Erster Kommentar:</label>
                        <input
                          type="text"
                          value={facebookFirstComment}
                          onChange={(e) => setFacebookFirstComment(e.target.value)}
                          placeholder="z. B. Weitere Infos im Link..."
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Abbrechen
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSchedulePost}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all"
                    title="Beitrag in lokaler Socialcraft-Queue speichern"
                  >
                    Lokal vormerken
                  </button>

                  <button
                    type="button"
                    disabled={isPublishingZernio}
                    onClick={() => handlePublishViaZernio(false)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>📅 Automatisch terminieren</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPublishingZernio}
                    onClick={() => handlePublishViaZernio(true)}
                    className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPublishingZernio ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Veröffentliche...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Jetzt live veröffentlichen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Media Preview & Karussell-Übernahme */}
            <div className="space-y-5 lg:col-span-5">
              {/* Media Selector Card */}
              <div className="cryptox-card p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-orange-400" />
                    <span>Visuals / Medien ({selectedMediaUrls.length})</span>
                  </h4>
                  {currentSlides.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const imgs = currentSlides.map((s) => s.imageUrl).filter(Boolean) as string[];
                        setSelectedMediaUrls(imgs);
                        toast.success(`${imgs.length} Visuals aus aktuellem Karussell übernommen!`);
                      }}
                      className="text-[11px] font-semibold text-orange-400 hover:underline cursor-pointer"
                    >
                      Aus Karussell laden
                    </button>
                  )}
                </div>

                {/* Selected Thumbnails */}
                {selectedMediaUrls.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {selectedMediaUrls.map((url, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/5] bg-black/40">
                          <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setSelectedMediaUrls(selectedMediaUrls.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 text-[9px] font-mono px-1 rounded bg-black/70 text-white">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMediaUrls([])}
                      className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Alle Medien entfernen
                    </button>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center space-y-2 bg-white/[0.01]">
                    <p className="text-xs text-zinc-400">Keine Visuals ausgewählt.</p>
                    <p className="text-[11px] text-zinc-500">
                      Du kannst Visuals aus dem Karussell-Generator, der Historie oder per Bild-URL verwenden.
                    </p>
                    {onNavigateToCarousel && (
                      <button
                        type="button"
                        onClick={onNavigateToCarousel}
                        className="text-xs font-semibold text-orange-400 hover:underline pt-1 inline-block cursor-pointer"
                      >
                        Zum Karussell-Generator $\rightarrow$
                      </button>
                    )}
                  </div>
                )}

                {/* Custom Image URL fallback */}
                <div className="pt-3 border-t border-white/[0.08] space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    Oder Bild-URL manuell hinzufügen:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMediaUrl}
                      onChange={(e) => setCustomMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-[#120F17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customMediaUrl.trim()) {
                          setSelectedMediaUrls([...selectedMediaUrls, customMediaUrl.trim()]);
                          setCustomMediaUrl("");
                          toast.success("Bild hinzugefügt!");
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="cryptox-card p-5 border border-white/[0.08] space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
                  Live Post-Vorschau
                </span>
                <div className="rounded-2xl border border-white/10 bg-[#0d0a13] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-bold text-orange-400 text-xs">
                      SC
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {channels.find((c) => c.id === selectedChannelId)?.name || "Socialcraft"}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Geplant für {new Date(scheduledDate).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
                    {postCaption || "Deine Caption wird hier in der Vorschau angezeigt..."}
                  </p>

                  {postHashtags && (
                    <p className="text-[11px] text-orange-400/80 font-mono">{postHashtags}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: KANÄLE & ID-MANAGER ──────────────────────────────── */}
      {activeTab === "channels" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Verknüpfte Kanäle & Seiten-IDs</h3>
              <p className="text-xs text-zinc-400">
                Verwalte deine Social-Media-Kanäle oder verbinde Live-Accounts per 1-Klick OAuth
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onOpenZernioSetup && (
                <button
                  type="button"
                  onClick={onOpenZernioSetup}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF4D1C] to-[#FF8038] text-white text-xs font-bold shadow-lg shadow-[#FF4D1C]/25 hover:brightness-110 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Direct Hub Wizard</span>
                </button>
              )}

              {settings?.zernioApiKey && (
                <button
                  type="button"
                  disabled={isSyncingChannels}
                  onClick={handleSyncZernioAccounts}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isSyncingChannels && "animate-spin text-orange-400")} />
                  <span>Kanäle abgleichen</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAddChannel(true)}
                className="cryptox-orange-btn !py-2 !px-4 text-xs font-bold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Kanal manuell
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {channels.map((chan) => {
              const Icon = PLATFORM_ICONS[chan.platform] || Share2;
              const style = PLATFORM_COLORS[chan.platform] || PLATFORM_COLORS.facebook;
              return (
                <div
                  key={chan.id}
                  className="cryptox-card p-6 border border-white/[0.08] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-xl border", style.bg, style.border)}>
                        <Icon className={cn("h-5 w-5", style.text)} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Bereit / Aktiv
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{chan.name}</h4>
                      {chan.handle && <p className="text-xs text-zinc-400 font-mono">{chan.handle}</p>}
                    </div>

                    <div className="bg-black/40 p-3 rounded-xl border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Seiten- / Kanal-ID:</span>
                        <span className="font-mono font-bold text-orange-300">{chan.channelId}</span>
                      </div>
                      {chan.businessId && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Business-ID:</span>
                          <span className="font-mono text-zinc-300">{chan.businessId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    {chan.platform === "facebook" ? (
                      <a
                        href={`https://business.facebook.com/latest/settings/pages?business_id=${chan.businessId || "25861095310170488"}&selected_asset_id=${chan.channelId}&selected_asset_type=page#`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        In Meta Business öffnen <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-500 font-mono">ID verknüpft</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(chan.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title="Kanal entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Channel Modal / Inline Form */}
          {showAddChannel && (
            <div className="cryptox-card p-6 border border-orange-500/40 bg-[#120F17] max-w-xl mx-auto space-y-4 shadow-[0_0_30px_rgba(255,77,23,0.2)]">
              <h4 className="text-base font-bold text-white">Neuen Kanal hinzufügen</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Plattform:</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="facebook">Facebook Seite</option>
                    <option value="instagram">Instagram Profil</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube Kanal</option>
                    <option value="linkedin">LinkedIn Seite</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Kanal-Name:</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="z. B. Meine Facebook Seite"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Kanal- / Seiten-ID (Numerisch oder ID):
                  </label>
                  <input
                    type="text"
                    value={newChannelId}
                    onChange={(e) => setNewChannelId(e.target.value)}
                    placeholder="z. B. 337570872768998 oder UC..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Handle / Benutzername (Optional):
                  </label>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="@meinname"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChannel(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleAddChannelSubmit}
                  className="cryptox-orange-btn !py-2 !px-5 text-xs font-bold"
                >
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TIKTOK COMMERCIAL MUSIC LIBRARY MODAL ────────────────────── */}
      <TikTokMusicLibraryModal
        isOpen={showMusicLibraryModal}
        onClose={() => setShowMusicLibraryModal(false)}
        selectedSound={selectedSound}
        onSelectSound={(sound) => setSelectedSound(sound)}
      />

      {/* ── QUICK RESCHEDULE MODAL ────────────────────────────────────── */}
      {quickReschedulePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0F0D15] border border-white/15 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Termin anpassen & Neu planen</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickReschedulePost(null)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRescheduleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 block">Beitrag:</span>
                <p className="text-xs text-white font-semibold line-clamp-1 bg-black/40 p-2 rounded-lg border border-white/10">
                  {quickReschedulePost.title || quickReschedulePost.caption.slice(0, 40)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 block">Neues Datum & Uhrzeit:</label>
                <input
                  type="datetime-local"
                  required
                  value={quickRescheduleDate}
                  onChange={(e) => setQuickRescheduleDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setQuickReschedulePost(null)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="cryptox-orange-btn !py-1.5 !px-4 text-xs font-bold"
                >
                  Termin speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
