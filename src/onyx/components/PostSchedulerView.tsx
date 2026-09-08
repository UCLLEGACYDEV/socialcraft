import { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  LayoutGrid,
  List,
  Smartphone,
  Heart,
  BarChart3,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  Zap,
  Flame,
  Link2,
  Unlink,
  UploadCloud,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SocialChannel, ScheduledPost, SocialPlatform, SlideContent, HistoryEntry, ApiSettings, BrandProfile } from "../types";
import type { PostForMePlatform } from "../postforme/types";
import { DEFAULT_SOCIAL_CHANNELS, DEFAULT_BRAND_PROFILES, ANCHORED_POSTFORME_API_KEY } from "../defaults";
import { getStoredCurrentUser, type User } from "../auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PostForMeApiClient, createPostForMeClient } from "../postforme/client";
import { ZernioApiClient, createZernioClient } from "../zernio/client";
import { buildZernioPayload } from "../zernio/formatter";
import { TikTokMusicLibraryModal } from "./TikTokMusicLibraryModal";
import { BlueskyConnectModal } from "./BlueskyConnectModal";
import { TIKTOK_MUSIC_LIBRARY, type TikTokSoundItem } from "../data/tiktok-sounds";
import { generateViralCaption } from "../caption-generator";

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
  currentUser?: User | null;
  initialTab?: "queue" | "composer" | "channels" | "insights";
  onOpenPostForMeSetup?: () => void;
  onOpenZernioSetup?: () => void;
  onOpen30DayBatch?: () => void;
  brandProfiles?: BrandProfile[];
  activeProfileId?: string;
  onSelectProfile?: (id: string) => void;
  onUpdateBrandProfiles?: (profiles: BrandProfile[]) => void;
  onOpenBrandProfileManager?: () => void;
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

export interface SchedulerConnectPlatformConfig {
  id: PostForMePlatform;
  name: string;
  icon: React.ElementType;
  gradient: string;
  borderHover: string;
  badge: string;
  badgeStyle: string;
  btnClass: string;
  description: string;
}

export const SCHEDULER_CONNECT_PLATFORMS: SchedulerConnectPlatformConfig[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: Video,
    gradient: "from-cyan-500/15 via-teal-500/5 to-transparent",
    borderHover: "border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]",
    badge: "Direct Post & Entwürfe",
    badgeStyle: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    btnClass: "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20",
    description: "Direktes Veröffentlichen von Videos, Slides & Creator Inbox Entwürfen",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    gradient: "from-pink-500/15 via-rose-500/5 to-transparent",
    borderHover: "border-pink-500/30 hover:border-pink-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    badge: "Feed, Karussell & Reels",
    badgeStyle: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    btnClass: "bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white shadow-pink-500/20",
    description: "Automatisches Veröffentlichen von Multi-Slide Karussells und Reels",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    gradient: "from-blue-600/15 via-indigo-500/5 to-transparent",
    borderHover: "border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    badge: "Seiten & Gruppen",
    badgeStyle: "bg-blue-600/15 text-blue-300 border-blue-500/30",
    btnClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20",
    description: "Beiträge mit Bildern & formatierter Caption auf Facebook-Seiten",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    gradient: "from-sky-600/15 via-blue-500/5 to-transparent",
    borderHover: "border-sky-500/30 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.2)]",
    badge: "Profil & Unternehmensseite",
    badgeStyle: "bg-sky-600/15 text-sky-300 border-sky-500/30",
    btnClass: "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20",
    description: "B2B Karussell-Dokumente & Fachbeiträge auf deinem Profil",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: Twitter,
    gradient: "from-zinc-500/15 via-zinc-700/5 to-transparent",
    borderHover: "border-zinc-500/30 hover:border-zinc-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    badge: "Posts & Threads",
    badgeStyle: "bg-zinc-700/30 text-zinc-200 border-zinc-500/30",
    btnClass: "bg-zinc-700 hover:bg-zinc-600 text-white shadow-zinc-700/20",
    description: "Bilder-Tweets, Captions & automatische Hashtag-Distribution",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    gradient: "from-red-600/15 via-orange-500/5 to-transparent",
    borderHover: "border-red-500/30 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    badge: "Community & Shorts",
    badgeStyle: "bg-red-600/15 text-red-300 border-red-500/30",
    btnClass: "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20",
    description: "Community-Posts mit Bildern & Text auf deinem YouTube Kanal",
  },
  {
    id: "threads",
    name: "Threads",
    icon: MessageSquare,
    gradient: "from-emerald-600/15 via-teal-500/5 to-transparent",
    borderHover: "border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    badge: "Meta Threads",
    badgeStyle: "bg-emerald-600/15 text-emerald-300 border-emerald-500/30",
    btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20",
    description: "Direktes Veröffentlichen auf Metas Text- & Bilder-Plattform",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: Images,
    gradient: "from-rose-600/15 via-pink-500/5 to-transparent",
    borderHover: "border-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    badge: "Pins & Pinnwände",
    badgeStyle: "bg-rose-600/15 text-rose-300 border-rose-500/30",
    btnClass: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20",
    description: "Pins auf deinen Pinnwänden mit Link & formatierter Beschreibung",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: Globe,
    gradient: "from-indigo-600/15 via-blue-500/5 to-transparent",
    borderHover: "border-indigo-500/30 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]",
    badge: "AT Protocol",
    badgeStyle: "bg-indigo-600/15 text-indigo-300 border-indigo-500/30",
    btnClass: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20",
    description: "Dezentrales Social Media Netzwerk über das offizielle AT-Protokoll",
  },
];

/**
 * Formats a Date for a native `<input type="datetime-local">` value.
 * MUST use the local calendar fields — `Date.toISOString()` returns UTC, so
 * slicing that string feeds the picker a time shifted by the timezone offset
 * and every save drifts the schedule earlier, eventually into the past (which
 * makes the publishing API post immediately instead of scheduling).
 */
function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Compact metric formatting: 1234 → "1.2k", 2_500_000 → "2.5M". */
function formatMetric(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Parses an `<input type="datetime-local">` value as local time. Returns null when empty/invalid. */
function parseLocalDatetimeValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The publishing API fetches every `media[].url` from its own servers, so a URL
 * that only resolves inside this app — a `data:`/`blob:` URL, a same-origin proxy
 * path like `/api/cloud/file?key=…`, or a pre-signed S3 URL that expires before a
 * scheduled post runs — silently breaks the post (carousels worst of all, and
 * Pinterest is the strictest validator). This re-hosts any such URL onto the
 * publisher's own storage and returns URLs it can always fetch.
 */
async function ensurePublicMedia(client: PostForMeApiClient, urls: string[]): Promise<string[]> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const resolved: string[] = [];

  for (const url of urls) {
    const isSameOrigin = url.startsWith("/") || (origin && url.startsWith(origin));
    const needsRehost =
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      isSameOrigin ||
      /[?&]X-Amz-|\.amazonaws\.com/i.test(url); // pre-signed → expires

    if (!needsRehost) {
      resolved.push(url);
      continue;
    }

    try {
      const resp = await fetch(url, isSameOrigin ? { credentials: "include" } : {});
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const hosted = await client.uploadMedia(blob, blob.type || "image/jpeg");
      resolved.push(hosted);
    } catch (err) {
      console.warn("[PostScheduler] Could not re-host media for publishing:", url, err);
      // Keep the original only if it is at least an absolute https URL; otherwise drop it.
      if (/^https:\/\//i.test(url)) resolved.push(url);
    }
  }

  return resolved;
}

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
  currentUser,
  initialTab,
  onOpenPostForMeSetup,
  onOpenZernioSetup,
  onOpen30DayBatch,
  brandProfiles = DEFAULT_BRAND_PROFILES,
  activeProfileId,
  onSelectProfile,
  onUpdateBrandProfiles,
  onOpenBrandProfileManager,
}: PostSchedulerViewProps) {
  const currentUserResolved = currentUser || getStoredCurrentUser();
  const isAdmin = currentUserResolved?.role === "admin";
  const openDirectSetup = isAdmin ? (onOpenPostForMeSetup || onOpenZernioSetup) : undefined;
  const activePostForMeKey = settings?.postForMeApiKey || ANCHORED_POSTFORME_API_KEY;
  const hasPublisherKey = !!activePostForMeKey;

  const resolvedProfiles = brandProfiles && brandProfiles.length > 0 ? brandProfiles : DEFAULT_BRAND_PROFILES;
  const [internalProfileId, setInternalProfileId] = useState<string>(activeProfileId || resolvedProfiles[0].id);
  const effectiveProfileId = activeProfileId || internalProfileId;
  const activeProfile = resolvedProfiles.find((p) => p.id === effectiveProfileId) || resolvedProfiles[0];

  const handleSwitchProfile = (id: string) => {
    if (onSelectProfile) {
      onSelectProfile(id);
    } else {
      setInternalProfileId(id);
    }
    toast.success(`Brand-Profil gewechselt: ${resolvedProfiles.find((p) => p.id === id)?.name || id}`);
  };

  // Strictly filter channels & posts belonging to this Brand Profile
  const profileChannels = channels.filter(
    (c) => (c.profileId || DEFAULT_BRAND_PROFILES[0].id) === activeProfile?.id
  );

  const profilePosts = posts.filter(
    (p) => !p.profileId || p.profileId === activeProfile?.id
  );

  const [activeTab, setActiveTab] = useState<"queue" | "composer" | "channels" | "insights">(
    initialTab || (initialScheduledItem ? "composer" : "queue")
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

  // Calendar & Preview State
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [composerTab, setComposerTab] = useState<"preview" | "media">("preview");
  const [previewSlideIdx, setPreviewSlideIdx] = useState<number>(0);
  const [inspectPost, setInspectPost] = useState<ScheduledPost | null>(null);

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleTodayMonth = () => {
    setCalendarDate(new Date());
  };

  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const setBestTime = (offsetDays: number, hour: number, minute: number, label: string) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    // If the chosen "peak time" has already passed today, roll it to the same time tomorrow
    // so the scheduler never receives a timestamp in the past (which publishes immediately).
    if (d.getTime() <= Date.now() + 5 * 60 * 1000) {
      d.setDate(d.getDate() + 1);
    }
    setPublishMode("schedule");
    setScheduledDate(toLocalDatetimeValue(d));
    toast.success(
      `Termin gesetzt: ${label} (${d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })} um ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} Uhr) ✨`
    );
  };

  const handleAutoDistributePosts = () => {
    const scheduledOnly = posts.filter((p) => p.status === "scheduled" || p.status === "draft");
    if (scheduledOnly.length === 0) {
      toast.info("Keine offenen geplanten Beiträge zum automatischen Verteilen vorhanden.");
      return;
    }

    const sorted = [...scheduledOnly].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(18, 0, 0, 0);

    const updatedMap = new Map<string, string>();
    sorted.forEach((post, idx) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + idx);
      updatedMap.set(post.id, d.toISOString());
    });

    const newPosts = posts.map((p) => {
      if (updatedMap.has(p.id)) {
        return { ...p, scheduledFor: updatedMap.get(p.id)! };
      }
      return p;
    });

    onUpdatePosts(newPosts);
    toast.success(`🎉 ${sorted.length} Beiträge gleichmäßig verteilt (jeden Tag 18:00 Uhr ab morgen)!`);
  };

  // Composer Form State (scoped to active brand profile)
  const defaultChannel = profileChannels.find((c) => c.isDefault) || profileChannels[0] || DEFAULT_SOCIAL_CHANNELS[0];
  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannel?.id || "fb-main-page");
  const selectedChannel = profileChannels.find((c) => c.id === selectedChannelId) || defaultChannel;

  useEffect(() => {
    if (profileChannels.length > 0 && !profileChannels.some((c) => c.id === selectedChannelId)) {
      setSelectedChannelId(profileChannels[0].id);
    }
  }, [activeProfile?.id, profileChannels, selectedChannelId]);
  const [postTitle, setPostTitle] = useState<string>(initialScheduledItem?.title || "");
  const [postCaption, setPostCaption] = useState<string>(
    initialScheduledItem?.prompt ? `${initialScheduledItem.title}\n\n${initialScheduledItem.prompt}` : ""
  );
  const [postHashtags, setPostHashtags] = useState<string>("#marketing #business #growth #socialcraft");
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return toLocalDatetimeValue(d);
  });
  // One clear decision: publish now vs. schedule for a time.
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("schedule");
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>(() => {
    if (initialScheduledItem?.imageUrls && initialScheduledItem.imageUrls.length > 0) {
      return initialScheduledItem.imageUrls;
    }
    const validSlideImages = currentSlides.map((s) => s.imageUrl).filter(Boolean) as string[];
    return validSlideImages.length > 0 ? validSlideImages : [];
  });
  const [customMediaUrl, setCustomMediaUrl] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handleProcessFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.error("Bitte nur Bilddateien (PNG, JPG, WEBP, etc.) hochladen.");
      return;
    }

    setIsUploadingMedia(true);
    const newUrls: string[] = [];

    for (const file of validFiles) {
      try {
        if (activePostForMeKey) {
          try {
            const client = new PostForMeApiClient(activePostForMeKey);
            const s3Url = await client.uploadMedia(file, file.type || "image/png");
            if (s3Url) {
              newUrls.push(s3Url);
              continue;
            }
          } catch (pfmErr) {
            console.warn("Post for Me S3 upload fallback to Data URL:", pfmErr);
          }
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newUrls.push(dataUrl);
      } catch (err: any) {
        console.error("Failed to load file:", file.name, err);
        toast.error(`Konnte „${file.name}“ nicht laden.`);
      }
    }

    if (newUrls.length > 0) {
      setSelectedMediaUrls((prev) => [...prev, ...newUrls]);
      toast.success(`${newUrls.length} Bild${newUrls.length > 1 ? "er" : ""} per Drag & Drop hinzugefügt! 📸`);
    }
    setIsUploadingMedia(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleMoveMedia = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedMediaUrls.length) return;
    const updated = [...selectedMediaUrls];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setSelectedMediaUrls(updated);
  };

  // Clipboard Paste support (Ctrl+V) when composer is active
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== "composer") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        await handleProcessFiles(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab, activePostForMeKey]);

  const handleGenerateAiCaption = async () => {
    const currentTopic = postTitle.trim() || "Virale Social Media Strategie & Mehrwert";
    setIsGeneratingCaption(true);
    try {
      const res = await generateViralCaption({
        topic: currentTopic,
        platform: (["facebook", "general", "instagram", "linkedin", "tiktok", "youtube"] as const).includes(
          selectedChannel?.platform as never,
        )
          ? (selectedChannel?.platform as "facebook" | "general" | "instagram" | "linkedin" | "tiktok" | "youtube")
          : "general",
        apiKey: settings?.geminiApiKey,
      });

      if (res.success) {
        setPostCaption(res.caption);
        if (res.hashtags && res.hashtags.length > 0) {
          setPostHashtags(res.hashtags.join(" "));
        }
        toast.success(
          res.provider === "gemini"
            ? "Virale Caption mit Google Gemini AI generiert! ✨"
            : "Virale Caption erstellt! 🚀",
          {
            description: "Struktur: Scroll-Stopping Hook + Mehrwert + CTA (strikt ohne Gedankenstriche).",
          }
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Erstellen der Caption";
      toast.error(msg);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

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
  // TikTok Content Posting API audit rules: privacy has NO default (user must pick),
  // and comment/duet/stitch start OFF (user must opt in).
  const [tiktokPrivacy, setTiktokPrivacy] = useState<
    "" | "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY"
  >("");
  const [tiktokAllowComments, setTiktokAllowComments] = useState(false);
  const [tiktokAllowDuet, setTiktokAllowDuet] = useState(false);
  const [tiktokAllowStitch, setTiktokAllowStitch] = useState(false);
  const [tiktokAiDisclosure, setTiktokAiDisclosure] = useState(false);
  const [tiktokDiscloseYourBrand, setTiktokDiscloseYourBrand] = useState(false);
  const [tiktokDiscloseBrandedContent, setTiktokDiscloseBrandedContent] = useState(false);
  const [tiktokAutoMusic, setTiktokAutoMusic] = useState(true);
  const [tiktokDraft, setTiktokDraft] = useState(false);

  // Live creator info (TikTok Query Creator Info) for the currently selected TikTok channel.
  const [tiktokCreatorInfo, setTiktokCreatorInfo] = useState<{
    creator_nickname?: string;
    creator_username?: string;
    creator_avatar_url?: string;
    privacy_level_options?: string[];
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
    max_video_post_duration_sec?: number;
  } | null>(null);
  const [tiktokCreatorInfoLoading, setTiktokCreatorInfoLoading] = useState(false);
  const [tiktokCreatorInfoError, setTiktokCreatorInfoError] = useState<string | null>(null);

  const loadTikTokCreatorInfo = useCallback(
    async (accountId: string) => {
      if (!accountId || !activePostForMeKey) return;
      setTiktokCreatorInfoLoading(true);
      setTiktokCreatorInfoError(null);
      try {
        const info = await new PostForMeApiClient(activePostForMeKey).getTikTokCreatorInfo(accountId);
        setTiktokCreatorInfo(info);
        // Force interaction toggles back off if the account disables them.
        if (info?.comment_disabled) setTiktokAllowComments(false);
        if (info?.duet_disabled) setTiktokAllowDuet(false);
        if (info?.stitch_disabled) setTiktokAllowStitch(false);
        // Drop a chosen privacy level that the account no longer allows.
        setTiktokPrivacy((prev) =>
          prev && info?.privacy_level_options && !info.privacy_level_options.includes(prev) ? "" : prev
        );
      } catch (err: any) {
        setTiktokCreatorInfo(null);
        setTiktokCreatorInfoError(err?.message || "Creator-Infos konnten nicht geladen werden.");
      } finally {
        setTiktokCreatorInfoLoading(false);
      }
    },
    [activePostForMeKey]
  );

  useEffect(() => {
    if (activeTab !== "composer") return;
    if (selectedChannel.platform !== "tiktok") {
      setTiktokCreatorInfo(null);
      setTiktokCreatorInfoError(null);
      return;
    }
    const accountId = selectedChannel.postForMeAccountId || selectedChannel.channelId;
    void loadTikTokCreatorInfo(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedChannel.id, selectedChannel.platform]);
  const [selectedSound, setSelectedSound] = useState<TikTokSoundItem | null>(null);
  const [showMusicLibraryModal, setShowMusicLibraryModal] = useState(false);

  // Composer inline audio player
  const [isComposerAudioPlaying, setIsComposerAudioPlaying] = useState(false);
  const composerAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopComposerAudio = () => {
    if (composerAudioRef.current) {
      composerAudioRef.current.pause();
      composerAudioRef.current.currentTime = 0;
      composerAudioRef.current = null;
    }
    setIsComposerAudioPlaying(false);
  };

  const handleToggleComposerAudio = () => {
    if (isComposerAudioPlaying) {
      stopComposerAudio();
      return;
    }

    if (!selectedSound) return;

    if (selectedSound.previewUrl) {
      try {
        const audio = new Audio(selectedSound.previewUrl);
        audio.volume = 0.85;
        audio.onended = () => setIsComposerAudioPlaying(false);
        audio.onerror = () => setIsComposerAudioPlaying(false);
        audio.play().then(() => {
          composerAudioRef.current = audio;
          setIsComposerAudioPlaying(true);
        }).catch(() => {
          setIsComposerAudioPlaying(false);
        });
      } catch {
        setIsComposerAudioPlaying(false);
      }
    } else {
      toast.info(`Sound „${selectedSound.title}“ ist aktiv.`);
    }
  };

  useEffect(() => {
    stopComposerAudio();
  }, [selectedSound]);

  const [instagramShareToFeed, setInstagramShareToFeed] = useState(true);
  const [instagramAiDisclosure, setInstagramAiDisclosure] = useState(false);
  const [instagramFirstComment, setInstagramFirstComment] = useState("");
  const [instagramPlacement, setInstagramPlacement] = useState<"timeline" | "reels" | "stories">("timeline");
  const [instagramCollaborators, setInstagramCollaborators] = useState("");

  const [facebookDraft, setFacebookDraft] = useState(false);
  const [facebookFirstComment, setFacebookFirstComment] = useState("");
  const [facebookPlacement, setFacebookPlacement] = useState<"timeline" | "reels" | "stories">("timeline");
  const [facebookCaptionEachImage, setFacebookCaptionEachImage] = useState(true);

  const [isPublishingZernio, setIsPublishingZernio] = useState(false);
  const [isSyncingChannels, setIsSyncingChannels] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingChannelId, setDisconnectingChannelId] = useState<string | null>(null);
  const [showComposerConnectQuick, setShowComposerConnectQuick] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);

  // Edit / Reschedule state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [quickReschedulePost, setQuickReschedulePost] = useState<ScheduledPost | null>(null);
  const [quickRescheduleDate, setQuickRescheduleDate] = useState<string>("");

  const handleDirectConnectPlatform = async (platformId: string) => {
    const key = activePostForMeKey;
    if (!key) {
      toast.error("Kein Post for Me API Key hinterlegt.");
      if (openDirectSetup) openDirectSetup();
      return;
    }

    if (platformId === "bluesky") {
      setShowBlueskyModal(true);
      return;
    }

    setConnectingPlatform(platformId);
    try {
      const client = new PostForMeApiClient(key);
      const redirectUrl = `${window.location.origin}/callback?platform=${platformId}`;
      const authUrl = await client.createAuthUrl(platformId as any, redirectUrl);

      if (authUrl) {
        window.open(authUrl, "_blank", "width=650,height=750");
        toast.info(`Autorisierungsfenster für ${platformId.toUpperCase()} geöffnet... 🔗`, {
          description: "Schließe die Anmeldung im Popup ab. Dein Profil wird automatisch hier verknüpft.",
        });
      }
    } catch (err: any) {
      toast.error(`Verbindungsfehler (${platformId}): ${err.message}`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnectChannel = async (chan: SocialChannel) => {
    const accId = chan.postForMeAccountId || chan.channelId;
    setDisconnectingChannelId(chan.id);
    try {
      if (chan.postForMeAccountId && activePostForMeKey) {
        const client = new PostForMeApiClient(activePostForMeKey);
        await client.disconnectSocialAccount(accId);
      }
      toast.success(`Account „${chan.name}“ erfolgreich getrennt.`);
    } catch (err: any) {
      console.warn("Could not disconnect remote account:", err.message);
    } finally {
      setDisconnectingChannelId(null);
    }

    onUpdateChannels(channels.filter((c) => c.id !== chan.id));
  };

  const handleSyncAccounts = async (silent = false) => {
    const postForMeKey = activePostForMeKey;

    if (!postForMeKey) {
      if (!silent) {
        if (isAdmin) {
          toast.info("Bitte als Admin den Publishing-Key hinterlegen.", {
            action: openDirectSetup ? { label: "Setup öffnen", onClick: openDirectSetup } : undefined,
          });
        } else {
          toast.info("Publishing-Dienst wird initialisiert. Bitte versuche es gleich erneut.");
        }
      }
      return;
    }

    setIsSyncingChannels(true);
    try {
      const client = new PostForMeApiClient(postForMeKey);
      const accounts = await client.getSocialAccounts();

      if (!accounts || accounts.length === 0) {
        if (!silent) {
          toast.info("Keine aktiven Profile gefunden. Klicke oben auf ein soziales Netzwerk, um dein Profil zu verknüpfen.");
        }
        return;
      }

      const platformMapping: Record<string, SocialPlatform> = {
        tiktok: "tiktok",
        instagram: "instagram",
        facebook: "facebook",
        linkedin: "linkedin",
        x: "twitter",
        twitter: "twitter",
        youtube: "youtube",
        threads: "threads",
        pinterest: "pinterest",
        bluesky: "bluesky",
      };

      const imported: SocialChannel[] = accounts.map((acc) => ({
        id: `pfm-${acc.id}`,
        platform: platformMapping[acc.platform.toLowerCase()] || "facebook",
        name: acc.display_name || acc.username || `${acc.platform} Account`,
        channelId: acc.id,
        postForMeAccountId: acc.id,
        handle: acc.username ? (acc.username.startsWith("@") ? acc.username : `@${acc.username}`) : undefined,
        avatarUrl: acc.profile_picture_url || "/images/socialcraft-logo.png",
        isDefault: false,
      }));

      const existingIds = new Set(channels.map((c) => c.channelId));
      const newChannels = imported.filter((c) => !existingIds.has(c.channelId));

      const updatedChannels = channels.map((existing) => {
        const fresh = imported.find((i) => i.channelId === existing.channelId);
        return fresh ? { ...existing, ...fresh } : existing;
      });

      if (newChannels.length > 0) {
        onUpdateChannels([...updatedChannels, ...newChannels]);
        if (newChannels[0]) {
          setSelectedChannelId(newChannels[0].id);
        }
        toast.success(`${newChannels.length} Social-Media-Profil(e) erfolgreich synchronisiert! 🎉`);
      } else {
        onUpdateChannels(updatedChannels);
        if (!silent) {
          toast.info("Alle Profile sind aktuell synchronisiert.");
        }
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(`Sync-Fehler: ${err.message}`);
      }
    } finally {
      setIsSyncingChannels(false);
    }
  };

  const handleSyncZernioAccounts = handleSyncAccounts;

  // Auto-sync listener when returning from OAuth popup or when window regains focus
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === "POSTFORME_AUTH_SUCCESS") {
        await handleSyncAccounts(true);
      }
    };

    const handleWindowFocus = () => {
      if (activePostForMeKey) {
        handleSyncAccounts(true);
      }
    };

    window.addEventListener("message", handleAuthMessage);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [activePostForMeKey, channels]);

  const handleCancelPost = async (post: ScheduledPost) => {
    if (post.postForMePostId && settings?.postForMeApiKey) {
      try {
        const client = new PostForMeApiClient(settings.postForMeApiKey);
        await client.deletePost(post.postForMePostId);
      } catch (err: any) {
        console.warn("Could not delete from Post for Me:", err.message);
      }
    } else if (post.zernioPostId && settings?.zernioApiKey) {
      try {
        const client = new ZernioApiClient(settings.zernioApiKey);
        await client.deletePost(post.zernioPostId);
      } catch (err: any) {
        console.warn("Could not delete from remote publisher:", err.message);
      }
    }

    const updated = posts.map((p) =>
      p.id === post.id ? { ...p, status: "cancelled" as const } : p
    );
    onUpdatePosts(updated);
    toast.info(`Beitrag „${post.title}“ wurde abgebrochen. 🚫`);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostCaption(post.caption);
    setPostHashtags(post.hashtags.join(" "));
    setSelectedMediaUrls(post.mediaUrls);
    const targetChan = channels.find((c) => c.channelId === post.channelId);
    if (targetChan) setSelectedChannelId(targetChan.id);

    if (post.musicTitle) {
      const match = TIKTOK_MUSIC_LIBRARY.find((s) => s.title === post.musicTitle);
      if (match) {
        setSelectedSound(match);
      } else {
        try {
          const stored = localStorage.getItem("socialcraft_custom_mp3_library");
          if (stored) {
            const customList = JSON.parse(stored);
            const customMatch = customList.find((s: any) => s.title === post.musicTitle);
            if (customMatch) {
              setSelectedSound(customMatch);
            } else {
              setSelectedSound({
                id: `custom-fallback-${Date.now()}`,
                title: post.musicTitle,
                artist: post.musicArtist || "Eigener Track",
                duration: "0:30",
                category: "trending",
                categoryLabel: "Audio Track",
                previewUrl: "",
                plays: "Lokal",
                commercialApproved: true,
                tag: "🎵 Track",
              });
            }
          }
        } catch {}
      }
    } else {
      setSelectedSound(null);
    }

    const postDate = new Date(post.scheduledFor);
    if (postDate.getTime() < Date.now()) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      setScheduledDate(toLocalDatetimeValue(d));
    } else {
      setScheduledDate(toLocalDatetimeValue(postDate));
    }

    setActiveTab("composer");
    toast.success(`Beitrag „${post.title}“ zur Neuplanung in den Editor geladen! 📅`);
  };

  const handleReschedulePost = (post: ScheduledPost) => {
    handleEditPost(post);
  };

  const handleQuickRescheduleOpen = (post: ScheduledPost) => {
    setQuickReschedulePost(post);
    setQuickRescheduleDate(toLocalDatetimeValue(new Date(post.scheduledFor)));
  };

  const [isReschedulingRemote, setIsReschedulingRemote] = useState(false);

  const handleQuickRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReschedulePost || !quickRescheduleDate) return;

    const when = parseLocalDatetimeValue(quickRescheduleDate);
    if (!when) {
      toast.error("Bitte wähle ein gültiges Datum und eine Uhrzeit.");
      return;
    }
    if (when.getTime() < Date.now() + 60 * 1000) {
      toast.error("Der Zeitpunkt liegt in der Vergangenheit – wähle eine Zeit in der Zukunft.");
      return;
    }
    const iso = when.toISOString();
    const post = quickReschedulePost;

    // Push the new time to the publisher, otherwise only the local queue moves
    // and the platform still fires at the old time.
    if (post.postForMePostId && activePostForMeKey && post.status !== "published") {
      setIsReschedulingRemote(true);
      try {
        await new PostForMeApiClient(activePostForMeKey).updatePost(post.postForMePostId, {
          scheduled_at: iso,
        });
      } catch (err: any) {
        setIsReschedulingRemote(false);
        toast.error(`Terminänderung bei Post for Me fehlgeschlagen: ${err?.message || err}`, {
          description: "Der Beitrag bleibt beim alten Zeitpunkt. Ggf. löschen und neu planen.",
        });
        return;
      }
      setIsReschedulingRemote(false);
    }

    onUpdatePosts(
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              scheduledFor: iso,
              status: p.status === "cancelled" || p.status === "failed" ? ("scheduled" as const) : p.status,
              errorMessage: undefined,
            }
          : p
      )
    );
    toast.success(`Termin aktualisiert: ${when.toLocaleString("de-DE")} Uhr 🕒`);
    setQuickReschedulePost(null);
  };

  const handlePublishViaPublisher = async (publishNow = true, scheduleOverride?: Date) => {
    if (!postCaption.trim() && !postTitle.trim()) {
      toast.error("Bitte gib einen Titel oder einen Beitragstext ein.");
      return;
    }

    const channel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
    const allHashtags = postHashtags
      .split(/[\s,]+/)
      .filter((t) => t.startsWith("#") || t.length > 1)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    let mediaList = selectedMediaUrls.length > 0 ? selectedMediaUrls : customMediaUrl ? [customMediaUrl] : [];

    // TikTok requires the creator to actively choose a visibility — no default is allowed.
    if (channel.platform === "tiktok" && !tiktokPrivacy) {
      toast.error("Bitte wähle die TikTok-Sichtbarkeit aus.", {
        description: "Öffentlich, Freunde oder Privat – TikTok erlaubt keine Vorauswahl.",
      });
      return;
    }

    // Resolve & validate the scheduled time up front. A datetime-local value is
    // local time; without this guard a stale/past value is sent to the publisher
    // as `scheduled_at`, which then posts immediately instead of scheduling.
    let scheduledIso: string;
    if (publishNow) {
      scheduledIso = new Date().toISOString();
    } else {
      const when = scheduleOverride ?? parseLocalDatetimeValue(scheduledDate);
      if (!when) {
        toast.error("Bitte wähle ein gültiges Datum und eine Uhrzeit für die Terminierung.");
        return;
      }
      if (when.getTime() < Date.now() + 2 * 60 * 1000) {
        toast.error("Der gewählte Zeitpunkt liegt in der Vergangenheit.", {
          description: "Wähle eine Zeit mindestens einige Minuten in der Zukunft – sonst wird der Beitrag sofort veröffentlicht.",
        });
        return;
      }
      scheduledIso = when.toISOString();
    }

    // Pinterest specifics: a pin must be published to at least one board.
    // Post for Me's field is `board_ids` (array); we store one or more comma-separated IDs on the channel.
    let pinterestConfig: { board_ids: string[]; link?: string } | undefined;
    if (channel.platform === "pinterest") {
      const boardIds = (channel.pinterestBoardId || "")
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (boardIds.length === 0) {
        toast.error("Für Pinterest fehlt die Board-ID.", {
          description: "Trage unter „Plattform-Einstellungen für PINTEREST“ die Ziel-Pinnwand ein – ohne Board kann Pinterest keinen Pin anlegen.",
        });
        return;
      }
      pinterestConfig = {
        board_ids: boardIds,
        link: channel.pinterestDefaultLink?.trim() || undefined,
      };
      // Pinterest carousel pins accept at most 5 images.
      if (mediaList.length > 5) {
        toast.warning("Pinterest erlaubt max. 5 Bilder pro Pin.", {
          description: `Es werden die ersten 5 von ${mediaList.length} Bildern verwendet.`,
          duration: 7000,
        });
        mediaList = mediaList.slice(0, 5);
      }
    }

    const pfmKey = activePostForMeKey;

    if (!pfmKey) {
      if (isAdmin) {
        toast.error("Kein Publishing API Key hinterlegt. Öffne das Admin-Setup!", {
          action: openDirectSetup ? { label: "Setup", onClick: openDirectSetup } : undefined,
        });
      } else {
        toast.error("Publishing-Dienst ist momentan nicht bereit. Bitte versuche es in Kürze erneut.");
      }
      return;
    }

    setIsPublishingZernio(true);
    try {
      if (pfmKey) {
        const client = new PostForMeApiClient(pfmKey);
        const targetAccountId = channel.postForMeAccountId || channel.zernioAccountId || channel.channelId;

        // Make sure every image is on a URL the publishing API can actually fetch.
        let publishMedia = mediaList;
        if (mediaList.length > 0) {
          publishMedia = await ensurePublicMedia(client, mediaList);
          if (publishMedia.length < mediaList.length) {
            if (publishMedia.length === 0) {
              toast.error("Die Bilder konnten nicht für die Veröffentlichung vorbereitet werden.", {
                description: "Bitte lade die Bilder erneut hoch und versuche es noch einmal.",
              });
              setIsPublishingZernio(false);
              return;
            }
            toast.warning(`${mediaList.length - publishMedia.length} Bild(er) konnten nicht übernommen werden und wurden ausgelassen.`);
          }
        }

        // Map the composer's per-platform options onto Post for Me's platform_configurations.
        const platformConfigurations: Record<string, any> = {};
        if (pinterestConfig) {
          platformConfigurations["pinterest"] = {
            board_ids: pinterestConfig.board_ids,
            ...(pinterestConfig.link ? { link: pinterestConfig.link } : {}),
            ...(postTitle.trim() ? { title: postTitle.trim() } : {}),
          };
        }
        if (channel.platform === "tiktok") {
          platformConfigurations["tiktok"] = {
            privacy_status: tiktokPrivacy === "PUBLIC_TO_EVERYONE" ? "public" : "private",
            allow_comment: tiktokAllowComments,
            allow_duet: tiktokAllowDuet,
            allow_stitch: tiktokAllowStitch,
            auto_add_music: tiktokAutoMusic,
            is_ai_generated: tiktokAiDisclosure,
            disclose_your_brand: tiktokDiscloseYourBrand,
            disclose_branded_content: tiktokDiscloseBrandedContent,
            is_draft: tiktokDraft,
            ...(postTitle.trim() ? { title: postTitle.trim() } : {}),
          };
        }
        if (channel.platform === "instagram") {
          const collaborators = instagramCollaborators
            .split(/[\s,]+/)
            .map((s) => s.replace(/^@/, "").trim())
            .filter(Boolean);
          platformConfigurations["instagram"] = {
            placement: instagramPlacement,
            share_to_feed: instagramShareToFeed,
            ...(collaborators.length > 0 ? { collaborators } : {}),
          };
        }
        if (channel.platform === "facebook") {
          platformConfigurations["facebook"] = {
            placement: facebookPlacement,
            set_caption_for_each_image: facebookCaptionEachImage,
          };
        }
        if (channel.platform === "youtube" && postTitle.trim()) {
          platformConfigurations["youtube"] = { title: postTitle.trim() };
        }

        const fullCaption = postCaption.trim() + (allHashtags.length > 0 ? "\n\n" + allHashtags.join(" ") : "");
        const createPayload = {
          caption: fullCaption,
          scheduled_at: publishNow ? null : scheduledIso,
          social_accounts: [targetAccountId],
          media: publishMedia.map((url) => ({ url })),
          ...(Object.keys(platformConfigurations).length > 0
            ? { platform_configurations: platformConfigurations }
            : {}),
        };

        // Editing a still-pending Post for Me post → update it in place instead of
        // creating a duplicate and orphaning the original scheduled entry.
        const editingRemote = editingPostId
          ? posts.find((p) => p.id === editingPostId && p.postForMePostId && p.status !== "published")
          : undefined;
        const postResult = editingRemote?.postForMePostId
          ? await client.updatePost(editingRemote.postForMePostId, createPayload as any)
          : await client.createPost(createPayload);

        const newPost: ScheduledPost = {
          id: editingPostId || `post-${Date.now()}`,
          title: postTitle.trim() || "Socialcraft Beitrag",
          caption: postCaption.trim(),
          hashtags: allHashtags,
          mediaUrls: publishMedia,
          mediaType: publishMedia.length > 1 ? "carousel" : "image",
          channelId: channel.channelId,
          platform: channel.platform,
          scheduledFor: scheduledIso,
          status: publishNow ? "published" : "scheduled",
          createdAt: new Date().toISOString(),
          publishedAt: publishNow ? new Date().toISOString() : undefined,
          postForMePostId: postResult.id,
          postForMeStatus: postResult.status,
          musicTitle: selectedSound?.title,
          musicArtist: selectedSound?.artist,
          profileId: activeProfile?.id,
        };

        if (editingPostId) {
          onUpdatePosts(posts.map((p) => (p.id === editingPostId ? newPost : p)));
          setEditingPostId(null);
        } else {
          onUpdatePosts([newPost, ...posts]);
        }

        if (publishNow) {
          toast.success("🚀 Beitrag erfolgreich veröffentlicht!", {
            description: `Live auf ${channel.name} (${channel.handle || channel.platform})`,
          });
        } else {
          toast.success("📅 Beitrag erfolgreich terminiert!", {
            description: `Geplant für ${new Date(scheduledIso).toLocaleString("de-DE")} Uhr auf ${channel.name}`,
          });
        }

        setPostTitle("");
        setPostCaption("");
        setSelectedSound(null);
        setActiveTab("queue");
        return;
      }

      // Fallback to Zernio
      const client = new ZernioApiClient(zernioKey!);
      const postResult = await client.publishOrSchedulePost({
        title: postTitle.trim() || "Socialcraft Post",
        caption: postCaption.trim(),
        hashtags: allHashtags,
        mediaUrls: mediaList,
        mediaType: mediaList.length > 1 ? "carousel" : "image",
        platform: channel.platform as any,
        accountId: channel.zernioAccountId || channel.channelId,
        publishNow,
        scheduledFor: !publishNow ? scheduledIso : undefined,
        tiktokOptions: {
          privacyLevel: tiktokPrivacy || "SELF_ONLY",
          allowComments: tiktokAllowComments,
          allowDuet: tiktokAllowDuet,
          allowStitch: tiktokAllowStitch,
          videoMadeWithAi: tiktokAiDisclosure,
          autoAddMusic: tiktokAutoMusic,
          draft: tiktokDraft,
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
        scheduledFor: scheduledIso,
        status: publishNow ? "published" : "scheduled",
        createdAt: new Date().toISOString(),
        publishedAt: publishNow ? new Date().toISOString() : undefined,
        zernioPostId: postResult._id,
        zernioStatus: postResult.status,
        externalPostUrl: postResult.platforms?.[0]?.platformPostUrl,
        musicTitle: selectedSound?.title,
        musicArtist: selectedSound?.artist,
        profileId: activeProfile?.id,
      };

      if (editingPostId) {
        onUpdatePosts(posts.map((p) => (p.id === editingPostId ? newPost : p)));
        setEditingPostId(null);
      } else {
        onUpdatePosts([newPost, ...posts]);
      }

      if (publishNow) {
        toast.success(
          tiktokDraft && channel.platform === "tiktok"
            ? "📥 Als TikTok-Entwurf übertragen! Öffne deine TikTok-App zur Freigabe."
            : "🚀 Erfolgreich live veröffentlicht!",
          {
            description: `Status: ${postResult.status} (ID: ${postResult._id})`,
          }
        );
      } else {
        toast.success("📅 Erfolgreich terminiert!", {
          description: `Geplant für ${new Date(scheduledIso).toLocaleString("de-DE")} Uhr`,
        });
      }

      setPostTitle("");
      setPostCaption("");
      setSelectedSound(null);
      setActiveTab("queue");
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();

      // TikTok caps how many users an *unaudited* app may DIRECT-post for. The cap
      // is on the app (here: Post for Me's shared credentials), not on the account —
      // it can't be lifted from your own Developer Portal. The draft endpoint
      // (/publish/inbox/…) is a separate path and usually still works.
      if (msg.includes("reached_active_user_cap") || msg.includes("active_user_cap") || msg.includes("active user cap")) {
        toast.error("TikTok: Direct-Post gesperrt (reached_active_user_cap).", {
          description:
            "Die genutzte TikTok-App (geteilte Post-for-Me-Credentials) ist nicht für öffentliches Direct-Posting freigegeben. Poste als Entwurf (landet im TikTok-Postfach zur Freigabe), oder hinterlege im White-Label-Projekt eigene TikTok-Credentials.",
          action:
            channel.platform === "tiktok" && !tiktokDraft
              ? {
                  label: "Als Entwurf senden",
                  onClick: () => {
                    setTiktokDraft(true);
                    setTimeout(() => handlePublishViaPublisher(publishNow), 100);
                  },
                }
              : undefined,
          duration: 14000,
        });
        return;
      }

      const isCapacityError =
        msg.includes("capacity") ||
        msg.includes("limit") ||
        msg.includes("direct posting");

      if (isCapacityError && channel.platform === "tiktok" && !tiktokDraft) {
        toast.error("TikTok Direct-Posting Tageslimit erreicht!", {
          description: "Tipp: Als Entwurf senden (Creator Inbox) oder nach dem Reset (Mitternacht UTC) erneut versuchen.",
          action: {
            label: "Als Entwurf senden",
            onClick: () => {
              setTiktokDraft(true);
              setTimeout(() => {
                handlePublishViaPublisher(publishNow);
              }, 100);
            },
          },
          duration: 10000,
        });
      } else {
        toast.error(`Veröffentlichung fehlgeschlagen: ${err.message}`);
      }
    } finally {
      setIsPublishingZernio(false);
    }
  };

  const handlePublishViaZernio = handlePublishViaPublisher;

  /**
   * "Automatisch terminieren" — picks the next open slot for the selected channel
   * instead of reusing whatever is in the date picker, then schedules the post.
   * Cadence: one post per day at the picker's time-of-day (default 18:00),
   * placed the day after the channel's last still-pending post, always in the future.
   */
  const handleAutoSchedulePost = () => {
    const channel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;

    const preferred = parseLocalDatetimeValue(scheduledDate);
    const hour = preferred ? preferred.getHours() : 18;
    const minute = preferred ? preferred.getMinutes() : 0;

    const pendingForChannel = posts
      .filter(
        (p) =>
          (p.channelId === channel.channelId || p.channelId === channel.id) &&
          (p.status === "scheduled" || p.status === "queued" || p.status === "draft")
      )
      .map((p) => new Date(p.scheduledFor).getTime())
      .filter((t) => !Number.isNaN(t));

    const anchor = pendingForChannel.length > 0 ? new Date(Math.max(...pendingForChannel)) : new Date();

    const slot = new Date(anchor);
    if (pendingForChannel.length > 0) {
      slot.setDate(slot.getDate() + 1);
    }
    slot.setHours(hour, minute, 0, 0);

    // Never land in the past / too close to now — roll forward a day at a time.
    while (slot.getTime() < Date.now() + 10 * 60 * 1000) {
      slot.setDate(slot.getDate() + 1);
    }

    // Only fills the time field — the user still confirms with the primary button.
    setPublishMode("schedule");
    setScheduledDate(toLocalDatetimeValue(slot));
    toast.success(
      `Nächster freier Slot: ${slot.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })} um ${String(slot.getHours()).padStart(2, "0")}:${String(slot.getMinutes()).padStart(2, "0")} Uhr`
    );
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

    const when = parseLocalDatetimeValue(scheduledDate);
    if (!when) {
      toast.error("Bitte wähle ein gültiges Datum und eine Uhrzeit.");
      return;
    }
    const scheduledIso = when.toISOString();
    const mediaUrls = selectedMediaUrls.length > 0 ? selectedMediaUrls : customMediaUrl ? [customMediaUrl] : [];

    const newPost: ScheduledPost = {
      id: editingPostId || `post-${Date.now()}`,
      title: postTitle.trim() || "Socialcraft Beitrag",
      caption: postCaption.trim(),
      hashtags: allHashtags,
      mediaUrls,
      mediaType: mediaUrls.length > 1 ? "carousel" : "image",
      channelId: channel.channelId,
      platform: channel.platform,
      scheduledFor: scheduledIso,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      musicTitle: selectedSound?.title,
      musicArtist: selectedSound?.artist,
      profileId: activeProfile?.id,
    };

    if (editingPostId) {
      onUpdatePosts(posts.map((p) => (p.id === editingPostId ? newPost : p)));
      setEditingPostId(null);
      toast.success("Beitrag erfolgreich aktualisiert & neu geplant! 🚀", {
        description: `Geplant für ${when.toLocaleString("de-DE")} Uhr auf ${channel.name}`,
      });
    } else {
      onUpdatePosts([newPost, ...posts]);
      toast.success("Beitrag erfolgreich lokal geplant! 🚀", {
        description: `Geplant für ${when.toLocaleString("de-DE")} Uhr auf ${channel.name}`,
      });
    }

    // Reset composer
    setPostTitle("");
    setPostCaption("");
    setSelectedSound(null);
    setActiveTab("queue");
  };

  const handleDeletePost = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    // Also cancel it on Post for Me if it hasn't gone out yet.
    if (target?.postForMePostId && target.status !== "published" && activePostForMeKey) {
      try {
        await new PostForMeApiClient(activePostForMeKey).deletePost(target.postForMePostId);
      } catch (err: any) {
        console.warn("Could not delete from Post for Me:", err?.message || err);
      }
    }
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

  const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null);
  const autoCheckedRef = useRef<Set<string>>(new Set());

  /**
   * Asks Post for Me for the real per-platform outcome of a post and folds it back
   * into the queue: any failed account marks the post "failed" with the platform's
   * error, all-success marks it "published" and stores the live post URL.
   */
  const handleCheckPostStatus = async (post: ScheduledPost, silent = false) => {
    if (!post.postForMePostId || !activePostForMeKey) return;
    if (!silent) setCheckingStatusId(post.id);
    try {
      const client = new PostForMeApiClient(activePostForMeKey);
      const results = await client.getPostResults(post.postForMePostId);

      if (!results || results.length === 0) {
        // No results yet — check the post's own processing status.
        const remote = await client.getPost(post.postForMePostId).catch(() => null);
        if (!silent) {
          toast.info(
            remote?.status === "processing" || remote?.status === "scheduled"
              ? "Der Beitrag wird noch verarbeitet – bitte gleich erneut prüfen."
              : "Noch keine Rückmeldung der Plattform verfügbar."
          );
        }
        return;
      }

      const failed = results.filter((r) => r.success === false);
      const firstUrl = results.find((r) => r.platform_data?.url)?.platform_data?.url;
      const errText = failed
        .map((r) => {
          const e = r.error || {};
          return e["message"] || e["error"] || e["detail"] || JSON.stringify(e);
        })
        .filter((s) => s && s !== "{}")
        .join(" · ");

      onUpdatePosts(
        posts.map((p) => {
          if (p.id !== post.id) return p;
          if (failed.length > 0) {
            return { ...p, status: "failed" as const, errorMessage: errText || "Veröffentlichung fehlgeschlagen." };
          }
          return {
            ...p,
            status: "published" as const,
            publishedAt: p.publishedAt || new Date().toISOString(),
            externalPostUrl: firstUrl || p.externalPostUrl,
            errorMessage: undefined,
          };
        })
      );

      if (!silent) {
        if (failed.length > 0) {
          toast.error(`Veröffentlichung fehlgeschlagen: ${errText || "unbekannter Fehler"}`);
        } else {
          toast.success("Beitrag ist live! ✅", { description: firstUrl });
        }
      }
    } catch (err: any) {
      if (!silent) toast.error(`Status konnte nicht geladen werden: ${err?.message || err}`);
    } finally {
      if (!silent) setCheckingStatusId(null);
    }
  };

  // ── Insights / Analytics feed (GET /social-account-feeds) ──────────
  const [insightsAccountId, setInsightsAccountId] = useState<string>("");
  const [insightsPosts, setInsightsPosts] = useState<any[]>([]);
  const [insightsCursor, setInsightsCursor] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const insightsChannels = profileChannels.filter((c) => c.postForMeAccountId || c.channelId?.startsWith("spc_"));

  const loadInsights = async (accountId: string, append = false) => {
    if (!accountId || !activePostForMeKey) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const client = new PostForMeApiClient(activePostForMeKey);
      const feed = await client.getAccountFeed(accountId, {
        limit: 12,
        expandMetrics: true,
        cursor: append && insightsCursor ? insightsCursor : undefined,
      });
      const items = Array.isArray(feed?.data) ? feed.data : [];
      setInsightsPosts((prev) => (append ? [...prev, ...items] : items));
      let nextCursor: string | null = null;
      const nextUrl = feed?.meta?.next;
      if (nextUrl) {
        try {
          nextCursor = new URL(nextUrl).searchParams.get("cursor");
        } catch {
          nextCursor = feed?.meta?.cursor || null;
        }
      }
      setInsightsCursor(nextCursor);
    } catch (err: any) {
      setInsightsError(err?.message || "Feed konnte nicht geladen werden.");
      if (!append) setInsightsPosts([]);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "insights") return;
    const first = insightsAccountId || insightsChannels[0]?.postForMeAccountId || insightsChannels[0]?.channelId || "";
    if (first && first !== insightsAccountId) {
      setInsightsAccountId(first);
    }
    if (first) void loadInsights(first, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, insightsAccountId]);

  // ── Pinterest board auto-detect (from the account's recent pins) ──
  const [pinterestBoards, setPinterestBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [pinterestBoardsLoading, setPinterestBoardsLoading] = useState(false);

  const handleLoadPinterestBoards = async () => {
    const channel = selectedChannel;
    const accountId = channel.postForMeAccountId || channel.channelId;
    if (!accountId || !activePostForMeKey) {
      toast.error("Pinterest-Profil ist nicht verbunden.");
      return;
    }
    setPinterestBoardsLoading(true);
    try {
      const client = new PostForMeApiClient(activePostForMeKey);
      const feed = await client.getAccountFeed(accountId, { limit: 50, expandMetrics: false });
      const items = Array.isArray(feed?.data) ? feed.data : [];
      const seen = new Map<string, string>();
      for (const item of items) {
        const pd: any = item.platform_data || {};
        const id = pd.board_id || pd.board?.id || pd.boardId;
        const name = pd.board_name || pd.board?.name || pd.boardName || "Pinnwand";
        if (id && !seen.has(String(id))) seen.set(String(id), String(name));
      }
      const boards = Array.from(seen, ([id, name]) => ({ id, name }));
      setPinterestBoards(boards);
      if (boards.length === 0) {
        toast.info("Keine Board-IDs in den letzten Pins gefunden. Bitte manuell eintragen (Quelltext der Board-Seite → „type\":\"board\").");
      } else {
        toast.success(`${boards.length} Pinnwand${boards.length > 1 ? "e" : ""} gefunden.`);
      }
    } catch (err: any) {
      toast.error(`Boards konnten nicht geladen werden: ${err?.message || err}`);
    } finally {
      setPinterestBoardsLoading(false);
    }
  };

  // ── Post preview / validation (POST /social-post-previews) ─────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleOpenPreview = async () => {
    if (!activePostForMeKey) {
      toast.error("Publishing-Dienst nicht bereit.");
      return;
    }
    const channel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
    const targetAccountId = channel.postForMeAccountId || channel.channelId;
    const allHashtags = postHashtags
      .split(/[\s,]+/)
      .filter((t) => t.startsWith("#") || t.length > 1)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
    const mediaList = selectedMediaUrls.length > 0 ? selectedMediaUrls : customMediaUrl ? [customMediaUrl] : [];
    const fullCaption = postCaption.trim() + (allHashtags.length > 0 ? "\n\n" + allHashtags.join(" ") : "");

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData([]);
    try {
      const client = new PostForMeApiClient(activePostForMeKey);
      const publishMedia = mediaList.length > 0 ? await ensurePublicMedia(client, mediaList) : [];
      const previews = await client.createPreviews({
        caption: fullCaption,
        preview_social_accounts: [
          {
            id: targetAccountId,
            platform: channel.platform === "twitter" ? "x" : channel.platform,
            username: channel.handle?.replace(/^@/, ""),
          },
        ],
        media: publishMedia.map((url) => ({ url })),
      });
      setPreviewData(Array.isArray(previews) ? previews : []);
    } catch (err: any) {
      setPreviewError(err?.message || "Vorschau fehlgeschlagen – die Plattform hat den Beitrag abgelehnt.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // When the queue opens, quietly reconcile posts that should have gone out by now.
  useEffect(() => {
    if (activeTab !== "queue" || !activePostForMeKey) return;
    const now = Date.now();
    posts
      .filter(
        (p) =>
          p.postForMePostId &&
          p.status !== "failed" &&
          p.status !== "cancelled" &&
          !autoCheckedRef.current.has(p.postForMePostId) &&
          new Date(p.scheduledFor).getTime() < now + 60 * 1000
      )
      .slice(0, 8)
      .forEach((p) => {
        autoCheckedRef.current.add(p.postForMePostId!);
        void handleCheckPostStatus(p, true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activePostForMeKey, posts.length]);

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
      isDefault: profileChannels.length === 0,
      profileId: activeProfile?.id,
    };
    onUpdateChannels([...channels, channel]);
    setShowAddChannel(false);
    setNewChannelName("");
    setNewChannelId("");
    setNewHandle("");
    toast.success(`Kanal erfolgreich zu Profil „${activeProfile.name}“ hinzugefügt!`);
  };

  const handleDeleteChannel = (id: string) => {
    if (profileChannels.length <= 1) {
      toast.error("Du musst mindestens einen Haupt-Kanal in diesem Profil behalten.");
      return;
    }
    onUpdateChannels(channels.filter((c) => c.id !== id));
    toast.info("Kanal entfernt.");
  };

  const filteredPosts = profilePosts.filter((p) => {
    if (filterPlatform === "all") return true;
    return p.platform === filterPlatform;
  });

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto pb-16">
      {/* ── Top Hero & Clean Control Bar ────────────────────────────── */}
      <div className="cryptox-card p-6 border border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#FF6A1F]" />
                <span>Beitrags-Planer</span>
              </h1>

              {/* Brand Profile Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
                    title="Brand-Profil wechseln (Kanäle & Posts getrennt)"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 border border-white/20"
                      style={{
                        backgroundColor: activeProfile.color ? `${activeProfile.color}30` : "#F04A2030",
                        color: activeProfile.color || "#F04A20",
                      }}
                    >
                      {activeProfile.avatarUrl ? (
                        <img src={activeProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeProfile.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="font-bold text-white max-w-[130px] truncate">{activeProfile.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">@{activeProfile.slug}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-[#0F0D15] border-white/15 text-white shadow-2xl">
                  <DropdownMenuLabel className="text-[10px] uppercase font-mono text-zinc-400 px-3 py-1.5">
                    Brand-Profil wechseln
                  </DropdownMenuLabel>
                  {resolvedProfiles.map((p) => {
                    const count = channels.filter(
                      (c) => (c.profileId || DEFAULT_BRAND_PROFILES[0].id) === p.id
                    ).length;
                    const isSel = p.id === activeProfile.id;
                    return (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => handleSwitchProfile(p.id)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 cursor-pointer rounded-xl text-xs",
                          isSel ? "bg-orange-500/15 text-orange-300 font-bold" : "hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: p.color || "#F04A20" }}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">{count} Kanäle</span>
                      </DropdownMenuItem>
                    );
                  })}
                  {isAdmin && onOpenBrandProfileManager && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={onOpenBrandProfileManager}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 cursor-pointer font-bold"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Profile verwalten / Neu anlegen...</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Aktives Profil: <strong className="text-white">{activeProfile.name}</strong> • Kanäle & Posts sind isoliert.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === "queue"
                    ? "bg-[#FF4D17] text-white shadow-[0_0_15px_rgba(255,77,23,0.35)]"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Planer ({profilePosts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("composer")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === "composer"
                    ? "bg-[#FF4D17] text-white shadow-[0_0_15px_rgba(255,77,23,0.35)]"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Planen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("insights")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === "insights"
                    ? "bg-[#FF4D17] text-white shadow-[0_0_15px_rgba(255,77,23,0.35)]"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Insights</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("channels")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative",
                  activeTab === "channels"
                    ? "bg-gradient-to-r from-[#FF4D17] to-[#FF8038] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                )}
              >
                <Link2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Profile verbinden</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white ml-0.5">
                  {profileChannels.length}
                </span>
                {profileChannels.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            </div>

            {onOpen30DayBatch && (
              <button
                type="button"
                onClick={onOpen30DayBatch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FF4D17]/40 bg-[#FF4D17]/10 text-orange-300 hover:bg-[#FF4D17]/20 hover:text-white transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                <span>30-Tage Batch</span>
              </button>
            )}

            {isAdmin && openDirectSetup && (
              <button
                type="button"
                onClick={openDirectSetup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08] hover:text-white"
                title="Admin Publishing-Engine Setup"
              >
                <Key className="h-3.5 w-3.5 text-orange-400" />
                <span>Admin Setup</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Compact Channel Status ──────────────────────────────────── */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">Kanäle ({activeProfile.name}):</span>
            {profileChannels.length === 0 ? (
              <span className="text-[11px] text-zinc-500 italic">Noch keine Kanäle verknüpft</span>
            ) : (
              profileChannels.map((chan) => {
                const Icon = PLATFORM_ICONS[chan.platform] || Share2;
                return (
                  <div
                    key={chan.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[11px] text-zinc-300"
                  >
                    <Icon className="h-3 w-3 text-orange-400" />
                    <span className="font-medium text-white">{chan.name}</span>
                  </div>
                );
              })
            )}
          </div>

          {hasPublisherKey && (
            <button
              type="button"
              disabled={isSyncingChannels}
              onClick={handleSyncAccounts}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("h-3 w-3", isSyncingChannels && "animate-spin text-orange-400")} />
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

            <div className="flex flex-wrap items-center gap-2">
              {/* View Switcher: Kalender vs. Liste */}
              <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                    viewMode === "calendar"
                      ? "bg-[#FF4D17] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Kalender</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-[#FF4D17] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Liste</span>
                </button>
              </div>

              {posts.length > 1 && (
                <button
                  type="button"
                  onClick={handleAutoDistributePosts}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold transition-all cursor-pointer"
                  title="Verteilt alle offenen Beiträge automatisch: 1 Beitrag pro Tag um 18:00 Uhr ab morgen"
                >
                  <Zap className="h-3.5 w-3.5 text-orange-400" />
                  <span>Auto-Verteilen</span>
                </button>
              )}

              {historyEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryPicker(true);
                    setActiveTab("composer");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                  <span>Aus Historie ({historyEntries.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("composer")}
                className="cryptox-orange-btn !py-1.5 !px-3.5 text-xs font-bold"
              >
                <Plus className="h-4 w-4 mr-1" />
                Beitrag planen
              </button>
            </div>
          </div>

          {/* ── CALENDAR VIEW ───────────────────────────────────────── */}
          {viewMode === "calendar" && (
            <div className="cryptox-card p-5 border border-white/[0.08] space-y-4">
              {/* Calendar Month Navigation Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#FF6A1F]" />
                    <span className="capitalize">
                      {calendarDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                    </span>
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    {filteredPosts.length} Beiträge terminiert
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Vorheriger Monat"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleTodayMonth}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    Heute
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Nächster Monat"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Names Header */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider py-1 border-b border-white/[0.04]">
                <span>Mo</span>
                <span>Di</span>
                <span>Mi</span>
                <span>Do</span>
                <span>Fr</span>
                <span>Sa</span>
                <span>So</span>
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth()).map((cell, idx) => {
                  const isToday = cell.date.toDateString() === new Date().toDateString();
                  const y = cell.date.getFullYear();
                  const m = cell.date.getMonth();
                  const d = cell.date.getDate();
                  const dayPosts = filteredPosts.filter((p) => {
                    const postD = new Date(p.scheduledFor);
                    return (
                      postD.getFullYear() === y &&
                      postD.getMonth() === m &&
                      postD.getDate() === d
                    );
                  });

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[110px] rounded-xl border p-1.5 flex flex-col justify-between transition-all group relative",
                        cell.isCurrentMonth
                          ? "bg-white/[0.02] border-white/[0.07] hover:border-white/20"
                          : "bg-black/40 border-white/[0.03] opacity-35",
                        isToday &&
                          "border-[#FF4D17]/60 bg-[#FF4D17]/[0.06] shadow-[0_0_15px_-4px_rgba(255,77,23,0.3)] ring-1 ring-[#FF4D17]/40"
                      )}
                    >
                      {/* Cell Header: Day Number + Add Button */}
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                            isToday ? "bg-[#FF4D17] text-white" : "text-zinc-400"
                          )}
                        >
                          {cell.date.getDate()}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const newD = new Date(cell.date);
                            newD.setHours(18, 0, 0, 0);
                            setScheduledDate(toLocalDatetimeValue(newD));
                            setActiveTab("composer");
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded bg-white/10 hover:bg-[#FF4D17] text-white flex items-center justify-center cursor-pointer"
                          title={`Beitrag für den ${cell.date.toLocaleDateString("de-DE")} planen`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Day Posts List */}
                      <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                        {dayPosts.map((p) => {
                          const Icon = PLATFORM_ICONS[p.platform] || Share2;
                          const style = PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.facebook;
                          const postTime = new Date(p.scheduledFor).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const isPublished = p.status === "published";
                          const isCancelled = p.status === "cancelled";

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setInspectPost(p)}
                              className={cn(
                                "w-full text-left p-1 rounded-md border text-[10px] transition-all flex items-center gap-1 truncate cursor-pointer",
                                isPublished
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                  : isCancelled
                                  ? "bg-red-500/10 border-red-500/30 text-red-300 opacity-60"
                                  : "bg-white/[0.05] border-white/10 hover:border-orange-500/40 text-white"
                              )}
                              title={`${p.title} (${postTime} Uhr)`}
                            >
                              <Icon className={cn("h-3 w-3 shrink-0", style.text)} />
                              <span className="font-mono text-[9px] text-zinc-400 shrink-0">{postTime}</span>
                              <span className="truncate font-medium">{p.title || p.caption.slice(0, 20)}</span>
                            </button>
                          );
                        })}
                      </div>

                      {dayPosts.length === 0 && (
                        <div className="text-[10px] text-zinc-600 font-mono text-center pb-1 select-none">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LIST VIEW ───────────────────────────────────────────── */}
          {viewMode === "list" && (
            filteredPosts.length === 0 ? (
              <div className="cryptox-card p-12 text-center border border-white/[0.08] space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-[#FF4D17]/10 border border-[#FF4D17]/30 flex items-center justify-center text-orange-400">
                  <CalendarIcon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Noch keine Beiträge in der Warteschlange</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Plane jetzt deinen ersten Beitrag oder wechsle in die Kalender-Ansicht für eine Monatsübersicht.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("composer")}
                    className="cryptox-orange-btn !py-2.5 !px-6 text-xs font-bold"
                  >
                    Jetzt Beitrag planen
                  </button>
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
                const isFailed = post.status === "failed";

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
                              : isFailed
                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                              : isCancelled
                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                              : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                          )}
                        >
                          {isPublished
                            ? "✅ Veröffentlicht"
                            : isFailed
                            ? "⚠️ Fehlgeschlagen"
                            : isCancelled
                            ? "❌ Abgebrochen"
                            : "🕒 Geplant"}
                        </span>
                      </div>

                      {isFailed && post.errorMessage && (
                        <div className="flex items-start gap-1.5 text-[11px] text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-2.5 py-1.5 mt-3">
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span className="break-words">{post.errorMessage}</span>
                        </div>
                      )}

                      {isPublished && post.externalPostUrl && (
                        <a
                          href={post.externalPostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 mt-3 cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Live ansehen</span>
                        </a>
                      )}

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

                          {post.postForMePostId && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCheckPostStatus(post)}
                              disabled={checkingStatusId === post.id}
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                              title="Echten Veröffentlichungs-Status bei der Plattform abfragen"
                            >
                              <RefreshCw className={cn("h-3 w-3", checkingStatusId === post.id && "animate-spin")} />
                              <span>Status prüfen</span>
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
          ))}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span>1. Ziel-Kanal & Profil wählen:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowComposerConnectQuick((prev) => !prev)}
                    className="text-xs font-semibold text-[#FF6A1F] hover:text-[#FF8038] flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{showComposerConnectQuick ? "Verbinden schließen" : "+ Profil verknüpfen (1-Klick)"}</span>
                  </button>
                </div>

                {/* Quick 1-Click Platform OAuth Connect Drawer in Composer */}
                {showComposerConnectQuick && (
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-[#1C152B]/95 via-[#120E1C]/95 to-[#0A0812] border border-[#FF4D17]/40 shadow-2xl backdrop-blur-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#FF4D17]/20 border border-[#FF4D17]/30 flex items-center justify-center text-orange-400 shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Social Profile 1-Klick verbinden</span>
                          <span className="text-[10px] text-zinc-400">Autorisiere dein Profil sicher per Popup – keine API-Keys oder Webhooks nötig</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("channels")}
                        className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer transition self-start sm:self-auto bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 px-2.5 py-1 rounded-xl"
                      >
                        <span>Großer Accounts-Hub</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {SCHEDULER_CONNECT_PLATFORMS.map((platform) => {
                        const Icon = platform.icon;
                        const isConnecting = connectingPlatform === platform.id;
                        const isAlreadyConnected = profileChannels.some(
                          (c) =>
                            c.platform.toLowerCase() === platform.id.toLowerCase() ||
                            (platform.id === "x" && c.platform.toLowerCase() === "twitter")
                        );

                        return (
                          <button
                            key={platform.id}
                            type="button"
                            disabled={isConnecting}
                            onClick={() => handleDirectConnectPlatform(platform.id)}
                            className={cn(
                              "relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer group bg-gradient-to-b hover:scale-[1.03] active:scale-[0.98]",
                              platform.gradient,
                              platform.borderHover,
                              isAlreadyConnected ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/10",
                              isConnecting && "opacity-60 pointer-events-none ring-1 ring-orange-500"
                            )}
                            title={`${platform.name} für ${activeProfile.name} verknüpfen`}
                          >
                            {isAlreadyConnected && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            )}
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 border transition-transform group-hover:scale-110", platform.badgeStyle)}>
                              {isConnecting ? (
                                <RefreshCw className="h-4 w-4 animate-spin text-orange-400" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-white truncate max-w-full block">
                              {isConnecting ? "Öffne..." : platform.name}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate max-w-full">
                              {isAlreadyConnected ? "Verbunden ✓" : platform.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profileChannels.length === 0 ? (
                    <div className="col-span-full p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center text-xs text-zinc-400 space-y-2">
                      <p>Für <strong className="text-white">{activeProfile.name}</strong> ist noch kein Social-Media-Kanal hinterlegt.</p>
                      <button
                        type="button"
                        onClick={() => setShowComposerConnectQuick(true)}
                        className="text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                      >
                        + Jetzt Kanal für {activeProfile.name} verbinden
                      </button>
                    </div>
                  ) : (
                    profileChannels.map((chan) => {
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
                        <div className="flex items-center gap-2.5 min-w-0">
                          {chan.avatarUrl && chan.avatarUrl !== "/images/socialcraft-logo.png" ? (
                            <img
                              src={chan.avatarUrl}
                              alt={chan.name}
                              className="h-8 w-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className={cn("p-1.5 rounded-lg border shrink-0", style.bg, style.border)}>
                              <Icon className={cn("h-4 w-4", style.text)} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{chan.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400 truncate block">
                              {chan.handle || `ID: ${chan.channelId}`}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-orange-400 shrink-0" />}
                      </button>
                    );
                  })
                )}

                  {/* Add Platform trigger card right in the grid */}
                  <button
                    type="button"
                    onClick={() => setShowComposerConnectQuick(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/15 bg-white/[0.01] hover:bg-white/[0.04] hover:border-orange-500/40 text-zinc-400 hover:text-white transition-all cursor-pointer text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4 text-orange-400" />
                    <span>Weiteres Profil verknüpfen</span>
                  </button>
                </div>
              </div>

              {/* 2. When — one clear choice: now vs. schedule */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/15 text-[11px] font-bold text-orange-400">2</span>
                  <span>Wann veröffentlichen?</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishMode("now")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all",
                      publishMode === "now"
                        ? "border-orange-500 bg-orange-500/15 text-white shadow-[0_0_18px_rgba(255,77,23,0.2)]"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/25"
                    )}
                  >
                    <Send className="h-4 w-4" />
                    Sofort
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishMode("schedule")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all",
                      publishMode === "schedule"
                        ? "border-orange-500 bg-orange-500/15 text-white shadow-[0_0_18px_rgba(255,77,23,0.2)]"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/25"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Zeitplan
                  </button>
                </div>

                {publishMode === "schedule" && (
                  <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/25 p-3 animate-in fade-in duration-150">
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-[#120F17] border border-white/15 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mr-0.5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        Schnellwahl:
                      </span>
                      {[
                        { fn: () => setBestTime(0, 18, 0, "Heute Abend"), label: "Heute 18:00" },
                        { fn: () => setBestTime(1, 12, 0, "Morgen Mittag"), label: "Morgen 12:00" },
                        { fn: () => setBestTime(1, 18, 30, "Morgen Abend"), label: "Morgen 18:30" },
                        { fn: () => setBestTime(2, 18, 0, "In 2 Tagen"), label: "+2 Tage" },
                      ].map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={c.fn}
                          className="rounded-lg border border-white/10 bg-white/[0.03] hover:border-orange-500/40 hover:bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white transition-all"
                        >
                          {c.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleAutoSchedulePost}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:text-white transition-all flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        Nächster freier Slot
                      </button>
                    </div>
                  </div>
                )}
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-zinc-300">
                        Beitragstext / Caption:
                      </label>
                      <button
                        type="button"
                        disabled={isGeneratingCaption}
                        onClick={handleGenerateAiCaption}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white text-[11px] font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        title="Erstellt mit Gemini AI eine virale, SEO-optimierte Caption (Hook + Value + CTA, ohne Gedankenstriche)"
                      >
                        <Sparkles className={cn("h-3 w-3 text-purple-400", isGeneratingCaption && "animate-spin")} />
                        <span>{isGeneratingCaption ? "Generiert…" : "✨ KI-Caption (Gemini)"}</span>
                      </button>
                    </div>
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

                {/* ── 4. AUDIO-TRACK / EIGENE MP3S / TIKTOK SOUNDS ────────── */}
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-black/40 to-teal-950/20 p-4 space-y-3 shadow-lg shadow-cyan-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-black font-bold shadow-md shadow-cyan-500/20">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Audio & Hintergrund-Musik</span>
                          {selectedSound && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Aktiv
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Für TikTok, Instagram Reels, Shorts & Social-Posts
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMusicLibraryModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedSound ? "Sound wechseln" : "MP3s & Library öffnen"}</span>
                    </button>
                  </div>

                  {selectedSound ? (
                    <div className="bg-black/60 p-3 rounded-xl border border-cyan-500/40 space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Composer Inline Audio Play Button */}
                          <button
                            type="button"
                            onClick={handleToggleComposerAudio}
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition shadow-md cursor-pointer",
                              isComposerAudioPlaying
                                ? "bg-cyan-400 text-black shadow-cyan-400/50 animate-pulse"
                                : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                            )}
                            title={isComposerAudioPlaying ? "Pause" : "Im Editor anhören"}
                          >
                            {isComposerAudioPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-xs truncate">{selectedSound.title}</p>
                              {selectedSound.tag && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                                  {selectedSound.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                              {selectedSound.artist} • <span className="font-mono">{selectedSound.duration}</span> • {selectedSound.plays}
                            </p>
                          </div>
                        </div>

                        {/* Remove Sound */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              stopComposerAudio();
                              setSelectedSound(null);
                              toast.info("Audio-Track entfernt.");
                            }}
                            className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
                            title="Sound entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Channel recommendation prompt */}
                      {selectedChannel.platform !== "tiktok" && (
                        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                          <span>💡 Aktueller Ziel-Kanal ist <strong>{selectedChannel.name}</strong>.</span>
                          {channels.some((c) => c.platform === "tiktok") && (
                            <button
                              type="button"
                              onClick={() => {
                                const tk = channels.find((c) => c.platform === "tiktok");
                                if (tk) setSelectedChannelId(tk.id);
                              }}
                              className="text-cyan-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>Zu TikTok-Kanal wechseln</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/30 p-2.5 rounded-xl border border-white/[0.04] text-[11px] text-zinc-400">
                      <span>Kein Audio gewählt. Lade eigene MP3s hoch oder wähle lizenzfreie Commercial Sounds.</span>
                      <button
                        type="button"
                        onClick={() => setShowMusicLibraryModal(true)}
                        className="text-xs font-semibold text-cyan-400 hover:underline shrink-0 text-left cursor-pointer"
                      >
                        + Sound hinzufügen
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. PLATFORM-SPECIFIC SETTINGS ACCORDION */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-orange-400" />
                      <span>Plattform-Einstellungen für {selectedChannel.platform.toUpperCase()}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Socialcraft Direct Engine</span>
                  </div>

                  {/* TIKTOK SPECIFIC SETTINGS — layout & rules per TikTok Content Posting API audit */}
                  {selectedChannel.platform === "tiktok" && (() => {
                    const PRIVACY_LABELS: Record<string, string> = {
                      PUBLIC_TO_EVERYONE: "Öffentlich",
                      MUTUAL_FOLLOW_FRIENDS: "Freunde",
                      FOLLOWER_OF_CREATOR: "Follower",
                      SELF_ONLY: "Nur ich (privat)",
                    };
                    const allowedPrivacy =
                      tiktokCreatorInfo?.privacy_level_options && tiktokCreatorInfo.privacy_level_options.length > 0
                        ? tiktokCreatorInfo.privacy_level_options
                        : ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"];
                    const commentDisabled = !!tiktokCreatorInfo?.comment_disabled;
                    const duetDisabled = !!tiktokCreatorInfo?.duet_disabled;
                    const stitchDisabled = !!tiktokCreatorInfo?.stitch_disabled;
                    const acctId = selectedChannel.postForMeAccountId || selectedChannel.channelId;

                    return (
                    <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                      {/* Live creator info — must be fetched from TikTok, not static */}
                      <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                        {tiktokCreatorInfoLoading ? (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Lade TikTok-Kontoinfo…</span>
                          </div>
                        ) : tiktokCreatorInfoError ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-amber-300">{tiktokCreatorInfoError}</span>
                            <button
                              type="button"
                              onClick={() => loadTikTokCreatorInfo(acctId)}
                              className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 underline shrink-0"
                            >
                              Erneut versuchen
                            </button>
                          </div>
                        ) : tiktokCreatorInfo ? (
                          <div className="flex items-center gap-2.5">
                            {tiktokCreatorInfo.creator_avatar_url && (
                              <img
                                src={tiktokCreatorInfo.creator_avatar_url}
                                alt=""
                                className="h-7 w-7 rounded-full border border-white/15"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate">
                                {tiktokCreatorInfo.creator_nickname || tiktokCreatorInfo.creator_username || "TikTok-Konto"}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                Max. Videolänge:{" "}
                                {tiktokCreatorInfo.max_video_post_duration_sec
                                  ? `${Math.round(tiktokCreatorInfo.max_video_post_duration_sec / 60)} Min`
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500">Kein verbundenes TikTok-Konto.</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-zinc-400 block mb-1">
                            Wer darf dieses Video sehen? <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={tiktokPrivacy}
                            onChange={(e) => setTiktokPrivacy(e.target.value as any)}
                            className={cn(
                              "w-full bg-[#120F17] border rounded-lg px-2.5 py-1.5 text-xs text-white",
                              tiktokPrivacy ? "border-white/10" : "border-rose-500/40"
                            )}
                          >
                            <option value="" disabled>
                              Bitte auswählen …
                            </option>
                            {allowedPrivacy.map((p) => (
                              <option key={p} value={p}>
                                {PRIVACY_LABELS[p] || p}
                              </option>
                            ))}
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
                            <span>Automatische Trend-Musik (nur Foto-Posts)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                            <input
                              type="checkbox"
                              checked={tiktokDraft}
                              onChange={(e) => setTiktokDraft(e.target.checked)}
                              className="accent-orange-500 rounded"
                            />
                            <span className="flex items-center gap-1.5">
                              <span>Als Entwurf senden (Creator Inbox)</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">Umgeht App-Limit</span>
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Interaction toggles — start OFF, hidden when the account disables them */}
                      <div>
                        <p className="text-[11px] text-zinc-400 mb-1">Interaktionen (standardmäßig aus):</p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                          {!commentDisabled && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tiktokAllowComments}
                                onChange={(e) => setTiktokAllowComments(e.target.checked)}
                                className="accent-orange-500 rounded"
                              />
                              <span>Kommentare erlauben</span>
                            </label>
                          )}
                          {!duetDisabled && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tiktokAllowDuet}
                                onChange={(e) => setTiktokAllowDuet(e.target.checked)}
                                className="accent-orange-500 rounded"
                              />
                              <span>Duette erlauben</span>
                            </label>
                          )}
                          {!stitchDisabled && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tiktokAllowStitch}
                                onChange={(e) => setTiktokAllowStitch(e.target.checked)}
                                className="accent-orange-500 rounded"
                              />
                              <span>Stitch erlauben</span>
                            </label>
                          )}
                          {(commentDisabled || duetDisabled || stitchDisabled) && (
                            <span className="text-[10px] text-zinc-600">
                              Einige Interaktionen sind für dieses Konto deaktiviert.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Commercial content disclosure — off by default */}
                      <div>
                        <p className="text-[11px] text-zinc-400 mb-1">Kommerzielle Inhalte offenlegen:</p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tiktokDiscloseYourBrand}
                              onChange={(e) => setTiktokDiscloseYourBrand(e.target.checked)}
                              className="accent-orange-500 rounded"
                            />
                            <span>Eigene Marke bewerben</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tiktokDiscloseBrandedContent}
                              onChange={(e) => setTiktokDiscloseBrandedContent(e.target.checked)}
                              className="accent-orange-500 rounded"
                            />
                            <span>Bezahlte Partnerschaft / Branded Content</span>
                          </label>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-white/5 pt-2">
                        Mit dem Veröffentlichen stimmst du – je nach Auswahl – den{" "}
                        <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer" className="underline hover:text-zinc-300">
                          TikTok Musik-Nutzungsbedingungen
                        </a>
                        {tiktokDiscloseBrandedContent || tiktokDiscloseYourBrand ? (
                          <>
                            {" "}und den{" "}
                            <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noreferrer" className="underline hover:text-zinc-300">
                              Branded-Content-Richtlinien
                            </a>
                          </>
                        ) : null}{" "}
                        zu.
                      </p>
                    </div>
                    );
                  })()}

                  {/* INSTAGRAM SPECIFIC SETTINGS */}
                  {selectedChannel.platform === "instagram" && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Platzierung:</label>
                        <select
                          value={instagramPlacement}
                          onChange={(e) => setInstagramPlacement(e.target.value as any)}
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="timeline">Feed (Timeline)</option>
                          <option value="reels">Reel</option>
                          <option value="stories">Story</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={instagramShareToFeed}
                            onChange={(e) => setInstagramShareToFeed(e.target.checked)}
                            className="accent-orange-500 rounded"
                          />
                          <span>Reel auch im Hauptfeed teilen</span>
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
                        <label className="text-[11px] text-zinc-400 block mb-1">Kollaborateure (Instagram-Namen, mit Komma getrennt):</label>
                        <input
                          type="text"
                          value={instagramCollaborators}
                          onChange={(e) => setInstagramCollaborators(e.target.value)}
                          placeholder="z. B. @marke, @partnerin"
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
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
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Platzierung:</label>
                        <select
                          value={facebookPlacement}
                          onChange={(e) => setFacebookPlacement(e.target.value as any)}
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="timeline">Feed (Timeline)</option>
                          <option value="reels">Reel</option>
                          <option value="stories">Story</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={facebookCaptionEachImage}
                          onChange={(e) => setFacebookCaptionEachImage(e.target.checked)}
                          className="accent-orange-500 rounded"
                        />
                        <span>Bei Karussell: Text unter jedem Bild</span>
                      </label>
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

                  {/* PINTEREST SPECIFIC SETTINGS */}
                  {selectedChannel.platform === "pinterest" && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-zinc-400">
                            Board-ID(s) (Pinnwand) <span className="text-rose-400">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleLoadPinterestBoards}
                            disabled={pinterestBoardsLoading}
                            className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className={cn("h-3 w-3", pinterestBoardsLoading && "animate-spin")} />
                            Boards laden
                          </button>
                        </div>

                        {pinterestBoards.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {pinterestBoards.map((b) => {
                              const active = (selectedChannel.pinterestBoardId || "").split(/[\s,]+/).includes(b.id);
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() =>
                                    onUpdateChannels(
                                      channels.map((c) =>
                                        c.id === selectedChannel.id ? { ...c, pinterestBoardId: b.id } : c
                                      )
                                    )
                                  }
                                  className={cn(
                                    "text-[10px] px-2 py-1 rounded-lg border transition",
                                    active
                                      ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                                      : "bg-white/5 border-white/10 text-zinc-300 hover:border-rose-500/40"
                                  )}
                                  title={b.id}
                                >
                                  {b.name}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <input
                          type="text"
                          value={selectedChannel.pinterestBoardId || ""}
                          onChange={(e) =>
                            onUpdateChannels(
                              channels.map((c) =>
                                c.id === selectedChannel.id ? { ...c, pinterestBoardId: e.target.value } : c
                              )
                            )
                          }
                          placeholder="z. B. 1068981941647123456 (mehrere mit Komma trennen)"
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Pflichtfeld. <strong>„Boards laden"</strong> holt die IDs aus deinen letzten Pins. Sonst manuell:
                          Board-Seite öffnen → Strg+U → nach <span className="font-mono">"type":"board"</span> suchen, die
                          ~18-stellige <span className="font-mono">"id"</span> kopieren. Mehrere mit Komma trennen.
                        </p>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Ziel-Link des Pins (optional):</label>
                        <input
                          type="url"
                          value={selectedChannel.pinterestDefaultLink || ""}
                          onChange={(e) =>
                            onUpdateChannels(
                              channels.map((c) =>
                                c.id === selectedChannel.id ? { ...c, pinterestDefaultLink: e.target.value } : c
                              )
                            )
                          }
                          placeholder="https://deine-website.de/artikel"
                          className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <p className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                        Hinweis: Ein Pinterest-Karussell-Pin fasst max. 5 Bilder. Bei mehr werden die ersten 5 verwendet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons — one primary action, driven by the Sofort/Zeitplan choice */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-zinc-400 hover:text-white"
                >
                  Abbrechen
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    disabled={previewLoading}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-zinc-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Zeigt die Plattform-Vorschau und prüft, ob der Beitrag akzeptiert wird"
                  >
                    <Eye className={cn("h-4 w-4", previewLoading && "animate-pulse")} />
                    <span>Vorschau</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPublishingZernio}
                    onClick={() => handlePublishViaPublisher(publishMode === "now")}
                    className="cryptox-orange-btn !py-2.5 !px-5 text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPublishingZernio ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{publishMode === "now" ? "Veröffentliche…" : "Plane ein…"}</span>
                      </>
                    ) : publishMode === "now" ? (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Jetzt veröffentlichen</span>
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {(() => {
                            const d = parseLocalDatetimeValue(scheduledDate);
                            return d
                              ? `Einplanen — ${d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                              : "Einplanen";
                          })()}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Feed Mockup Preview & Media Management */}
            <div className="space-y-5 lg:col-span-5">
              {/* Media & Preview Card */}
              <div className="cryptox-card p-6 border border-white/[0.08] space-y-4">
                {/* Header Switcher */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                    <button
                      type="button"
                      onClick={() => setComposerTab("preview")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                        composerTab === "preview"
                          ? "bg-[#FF4D17] text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Live Vorschau</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerTab("media")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                        composerTab === "media"
                          ? "bg-[#FF4D17] text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Medien ({selectedMediaUrls.length})</span>
                    </button>
                  </div>

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

                {/* Hidden File Input for Drag & Drop / File Picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />

                {/* ── TAB A: LIVE FEED MOCKUP PREVIEW (Droppable) ── */}
                {composerTab === "preview" && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "relative rounded-2xl border bg-black/60 p-4 space-y-3 shadow-xl transition-all",
                      isDraggingOver
                        ? "border-[#FF4D17] ring-4 ring-[#FF4D17]/30 bg-[#FF4D17]/[0.06]"
                        : "border-white/10"
                    )}
                  >
                    {/* Drag & drop glowing overlay */}
                    {isDraggingOver && (
                      <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md rounded-2xl border-2 border-dashed border-[#FF4D17] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF4D17]/20 border border-[#FF4D17]/40 flex items-center justify-center text-orange-400 mb-3 animate-bounce shadow-lg shadow-orange-500/20">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <p className="text-white font-bold text-sm">Bild hier loslassen!</p>
                        <p className="text-zinc-400 text-xs mt-1">Wird direkt als Karussell-Folie hinzugefügt</p>
                      </div>
                    )}

                    {/* Phone Mockup Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedChannel?.avatarUrl || "/images/socialcraft-logo.png"}
                          alt={selectedChannel?.name || "Kanal"}
                          className="w-7 h-7 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">{selectedChannel?.name || "Kanal"}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-zinc-300 font-mono capitalize">
                              {selectedChannel?.platform || "social"}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            {selectedChannel?.handle || `@${selectedChannel?.platform || "user"}`}
                          </span>
                        </div>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                    </div>

                    {/* Media Carousel Preview */}
                    {selectedMediaUrls.length > 0 ? (
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/80 border border-white/10 group">
                        <img
                          src={selectedMediaUrls[previewSlideIdx % selectedMediaUrls.length]}
                          alt={`Slide ${previewSlideIdx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300"
                        />
                        {selectedMediaUrls.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewSlideIdx((prev) =>
                                  prev > 0 ? prev - 1 : selectedMediaUrls.length - 1
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
                              title="Vorherige Folie"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewSlideIdx((prev) =>
                                  prev < selectedMediaUrls.length - 1 ? prev + 1 : 0
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
                              title="Nächste Folie"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white font-bold backdrop-blur-sm">
                              {previewSlideIdx + 1} / {selectedMediaUrls.length}
                            </div>
                          </>
                        )}

                        {/* Audio Pill */}
                        {selectedSound && (
                          <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 text-[11px] text-cyan-300 truncate">
                            <Music className="w-3 h-3 text-cyan-400 shrink-0 animate-spin" />
                            <span className="truncate">
                              {selectedSound.title} — {selectedSound.artist}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/5] rounded-xl border border-dashed border-white/20 hover:border-orange-500/60 bg-white/[0.02] hover:bg-orange-500/[0.04] flex flex-col items-center justify-center p-6 text-center text-zinc-400 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-[#FF4D17]/20 border border-white/10 group-hover:border-[#FF4D17]/40 flex items-center justify-center text-zinc-400 group-hover:text-orange-400 mb-3 transition">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold">Keine Bilder im Karussell</span>
                        <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 mt-1">
                          Hier klicken oder Bilder per <strong className="text-orange-400">Drag & Drop</strong> hineinziehen
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-2 font-mono">
                          PNG, JPG, WEBP • Auch Strg + V
                        </span>
                      </div>
                    )}

                    {/* Actions bar */}
                    <div className="flex items-center justify-between text-zinc-400 pt-1">
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-red-400 hover:scale-110 transition cursor-pointer" />
                        <MessageSquare className="w-4 h-4 text-zinc-300 hover:scale-110 transition cursor-pointer" />
                        <Send className="w-4 h-4 text-zinc-300 hover:scale-110 transition cursor-pointer" />
                      </div>
                      <Bookmark className="w-4 h-4 text-zinc-300 hover:scale-110 transition cursor-pointer" />
                    </div>

                    {/* Post Caption Preview */}
                    <div className="space-y-1 text-xs text-zinc-300">
                      <p className="line-clamp-3 leading-relaxed">
                        <strong className="text-white mr-1.5">{selectedChannel?.name}</strong>
                        {postCaption || "Hier erscheint deine generierte Caption..."}
                      </p>
                      {postHashtags && (
                        <p className="text-[#FF6A1F] text-[11px] font-medium leading-normal break-words">
                          {postHashtags}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB B: MEDIA SELECTOR & UPLOAD ── */}
                {composerTab === "media" && (
                  <div className="space-y-4">
                    {/* Drag & Drop Upload Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group",
                        isDraggingOver
                          ? "border-[#FF4D17] bg-[#FF4D17]/15 ring-4 ring-[#FF4D17]/25 scale-[1.01]"
                          : "border-white/15 hover:border-[#FF4D17]/60 bg-white/[0.02] hover:bg-[#FF4D17]/[0.03]"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                            isDraggingOver
                              ? "bg-[#FF4D17] text-white shadow-lg shadow-[#FF4D17]/40 animate-bounce"
                              : "bg-white/5 border border-white/10 text-orange-400 group-hover:bg-[#FF4D17]/20 group-hover:border-[#FF4D17]/40"
                          )}
                        >
                          {isUploadingMedia ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                          ) : (
                            <UploadCloud className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-300 transition">
                            {isUploadingMedia
                              ? "Lade Bilder hoch..."
                              : isDraggingOver
                              ? "Bilder jetzt loslassen!"
                              : "Bilder per Drag & Drop hier hineinziehen"}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            oder <span className="text-orange-400 font-semibold underline">Dateien durchsuchen</span> • Screenshots direkt mit <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-200">Strg + V</span> einfügen
                          </p>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          PNG, JPG, WEBP, GIF • Beliebig viele Folien
                        </span>
                      </div>
                    </div>

                    {/* Selected Media Cards */}
                    {selectedMediaUrls.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-300">
                            {selectedMediaUrls.length} Folie{selectedMediaUrls.length > 1 ? "n" : ""} im Karussell:
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedMediaUrls([])}
                            className="text-zinc-400 hover:text-red-400 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Alle entfernen
                          </button>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {selectedMediaUrls.map((url, i) => (
                            <div
                              key={i}
                              className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/5] bg-black/40 shadow-md"
                            >
                              <img
                                src={url}
                                alt={`Slide ${i + 1}`}
                                className="w-full h-full object-cover"
                              />

                              {/* Slide number badge */}
                              <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/75 text-white backdrop-blur-sm border border-white/10">
                                #{i + 1}
                              </span>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMediaUrls(selectedMediaUrls.filter((_, idx) => idx !== i));
                                }}
                                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer border border-white/10"
                                title="Folie entfernen"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>

                              {/* Reorder arrows */}
                              <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  disabled={i === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveMedia(i, -1);
                                  }}
                                  className="h-5 w-5 rounded bg-black/80 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center cursor-pointer"
                                  title="Nach links schieben"
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={i === selectedMediaUrls.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveMedia(i, 1);
                                  }}
                                  className="h-5 w-5 rounded bg-black/80 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center cursor-pointer"
                                  title="Nach rechts schieben"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Quick Add More Tile */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl border border-dashed border-white/20 hover:border-orange-500/60 bg-white/[0.02] hover:bg-orange-500/[0.05] aspect-[4/5] flex flex-col items-center justify-center p-2 text-center text-zinc-400 hover:text-orange-400 transition-all cursor-pointer group"
                            title="Weiteres Bild hinzufügen"
                          >
                            <Plus className="w-6 h-6 mb-1 transition-transform group-hover:scale-125" />
                            <span className="text-[10px] font-semibold leading-tight">+ Folie</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-white/5 rounded-xl text-center space-y-1 bg-white/[0.01]">
                        <p className="text-xs text-zinc-400">Noch keine Bilder hinzugefügt.</p>
                        <p className="text-[11px] text-zinc-500">
                          Ziehe Dateien in das Feld oben, wähle sie per Klick aus oder übernimm fertige Visuals:
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
                          placeholder="https://images.unsplash.com/..."
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
                          + Hinzufügen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: INSIGHTS / ANALYTICS FEED ─────────────────────────── */}
      {activeTab === "insights" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Insights & Performance</h3>
              <span className="text-[10px] text-zinc-400 font-mono">Live von Post for Me</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={insightsAccountId}
                onChange={(e) => setInsightsAccountId(e.target.value)}
                className="bg-[#120F17] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {insightsChannels.length === 0 && <option value="">Kein verbundenes Profil</option>}
                {insightsChannels.map((c) => (
                  <option key={c.id} value={c.postForMeAccountId || c.channelId}>
                    {c.name} ({c.platform})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => insightsAccountId && loadInsights(insightsAccountId, false)}
                disabled={insightsLoading || !insightsAccountId}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-50"
                title="Aktualisieren"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", insightsLoading && "animate-spin")} />
              </button>
            </div>
          </div>

          {insightsError && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
              {insightsError}
            </div>
          )}

          {insightsLoading && insightsPosts.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">Lade Feed…</div>
          ) : insightsPosts.length === 0 && !insightsError ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              Noch keine Beiträge im Feed. Für Metriken muss das Profil mit der „feeds"-Berechtigung verbunden sein.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insightsPosts.map((p, i) => {
                const m = p.metrics || {};
                const mediaUrl =
                  typeof p.media?.[0] === "string" ? p.media[0] : p.media?.[0]?.url || undefined;
                return (
                  <div key={p.platform_post_id || i} className="cryptox-card p-4 border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-mono uppercase">{p.platform}</span>
                      {p.posted_at && <span>{new Date(p.posted_at).toLocaleDateString("de-DE")}</span>}
                    </div>
                    {mediaUrl && (
                      <img src={mediaUrl} alt="" className="w-full h-36 object-cover rounded-lg border border-white/10" />
                    )}
                    <p className="text-xs text-zinc-300 line-clamp-3">{p.caption || "(ohne Text)"}</p>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-white text-sm font-bold">
                          <Heart className="h-3 w-3 text-rose-400" />
                          {formatMetric(m.likes ?? m.favorites)}
                        </div>
                        <div className="text-[10px] text-zinc-500">Likes</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-white text-sm font-bold">
                          <MessageCircle className="h-3 w-3 text-sky-400" />
                          {formatMetric(m.comments)}
                        </div>
                        <div className="text-[10px] text-zinc-500">Kommentare</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-white text-sm font-bold">
                          {m.video_views != null ? (
                            <Eye className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Repeat2 className="h-3 w-3 text-emerald-400" />
                          )}
                          {formatMetric(m.video_views ?? m.reach ?? m.shares)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {m.video_views != null ? "Views" : m.reach != null ? "Reichweite" : "Shares"}
                        </div>
                      </div>
                    </div>
                    {p.platform_url && (
                      <a
                        href={p.platform_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-orange-300 hover:text-orange-200"
                      >
                        <ExternalLink className="h-3 w-3" /> Auf {p.platform} ansehen
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {insightsCursor && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => loadInsights(insightsAccountId, true)}
                disabled={insightsLoading}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 disabled:opacity-50"
              >
                {insightsLoading ? "Lädt…" : "Mehr laden"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PROFILE & KANÄLE VERLINKEN ──────────────────────── */}
      {activeTab === "channels" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Luxury SaaS Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-white/10 bg-gradient-to-br from-[#1F1533]/90 via-[#110D1D]/95 to-[#08060E] backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF4D17]/25 to-purple-600/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/10 to-[#FF8038]/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D17]/15 border border-[#FF4D17]/30 text-orange-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Socialcraft Multi-Publishing Hub</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Social Media Accounts & Profile
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Verbinde deine Social-Media-Accounts per 1-Klick OAuth direkt im Browser. Deine Beiträge und Karussells werden ohne zusätzliche API-Keys vollautomatisch synchronisiert und veröffentlicht.
                </p>
              </div>

              {/* Action Buttons & Status */}
              <div className="relative z-10 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Auto-Publishing: Aktiv</span>
                </span>

                {hasPublisherKey && (
                  <button
                    type="button"
                    disabled={isSyncingChannels}
                    onClick={() => handleSyncAccounts(false)}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm"
                    title="Profile abrufen & synchronisieren"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-orange-400", isSyncingChannels && "animate-spin")} />
                    <span>{isSyncingChannels ? "Synchronisiere..." : "Kanäle abgleichen"}</span>
                  </button>
                )}

                {isAdmin && openDirectSetup && (
                  <button
                    type="button"
                    onClick={openDirectSetup}
                    className="px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Admin-Konfiguration: API-Schlüssel & Webhooks einsehen"
                  >
                    <Key className="h-3.5 w-3.5 text-orange-400" />
                    <span>Admin Webhooks</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAddChannel((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl border border-dashed border-white/20 hover:border-orange-500/40 text-xs font-medium text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  + Manuell
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">Verknüpfte Kanäle</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{channels.length} Profile</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">Unterstützte Netzwerke</span>
                <span className="text-xl font-bold text-orange-400 mt-0.5 block">9 Plattformen</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">OAuth-Sicherheit</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">100% Verifiziert</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-zinc-400 block font-medium">Setup für Endnutzer</span>
                <span className="text-xl font-bold text-cyan-300 mt-0.5 block">1-Klick Zero-Config</span>
              </div>
            </div>
          </div>

          {/* ── SECTION 1: VERFÜGBARE NETZWERKE (1-KLICK OAUTH) ──────────── */}
          {/* Active Brand Profile Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border overflow-hidden shrink-0 shadow-inner"
                style={{
                  backgroundColor: activeProfile.color ? `${activeProfile.color}25` : "#F04A2025",
                  borderColor: activeProfile.color || "#F04A20",
                  color: activeProfile.color || "#F04A20",
                }}
              >
                {activeProfile.avatarUrl ? (
                  <img src={activeProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  activeProfile.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Aktives Brand-Profil: {activeProfile.name}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                    @{activeProfile.slug}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Alle hier verknüpften Kanäle & Posts gehören exklusiv zu <strong>{activeProfile.name}</strong>.
                </p>
              </div>
            </div>

            {isAdmin && onOpenBrandProfileManager && (
              <button
                type="button"
                onClick={onOpenBrandProfileManager}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center shrink-0"
              >
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span>Profile verwalten / Neu anlegen</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  <span>Verfügbare Social-Media-Netzwerke (1-Klick OAuth)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Wähle ein Netzwerk – es öffnet sich das offizielle Login-Fenster zur Freigabe für <strong>{activeProfile.name}</strong>.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline-block">
                Offizielle API-Anbindung
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SCHEDULER_CONNECT_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isConnecting = connectingPlatform === platform.id;
                const matchedChannels = profileChannels.filter(
                  (c) =>
                    c.platform.toLowerCase() === platform.id.toLowerCase() ||
                    (platform.id === "x" && c.platform.toLowerCase() === "twitter")
                );
                const isConnected = matchedChannels.length > 0;

                return (
                  <div
                    key={platform.id}
                    className={cn(
                      "group relative p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 bg-gradient-to-b shadow-lg hover:shadow-2xl hover:scale-[1.01]",
                      platform.gradient,
                      platform.borderHover,
                      isConnected
                        ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-3 rounded-2xl border shadow-md transition-transform group-hover:scale-105", platform.badgeStyle)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-white transition-colors">
                              {platform.name}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-0.5 bg-black/40 text-zinc-300 border-white/10">
                              {platform.badge}
                            </span>
                          </div>
                        </div>

                        {isConnected ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            <span>Verbunden</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 shrink-0">
                            Bereit
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300/90 leading-relaxed min-h-[38px]">
                        {platform.description}
                      </p>

                      {/* Display connected account handles if available */}
                      {isConnected && (
                        <div className="p-2.5 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-1.5">
                          <span className="text-[10px] text-emerald-400 font-semibold block">Verknüpfte Profile:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {matchedChannels.map((c) => (
                              <span
                                key={c.id}
                                className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15 truncate max-w-full flex items-center gap-1"
                              >
                                <span>{c.handle || c.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/[0.08]">
                      <button
                        type="button"
                        disabled={isConnecting}
                        onClick={() => handleDirectConnectPlatform(platform.id)}
                        className={cn(
                          "w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110 active:scale-[0.98]",
                          isConnected
                            ? "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                            : platform.btnClass
                        )}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Autorisierung wird geöffnet...</span>
                          </>
                        ) : isConnected ? (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Weiteren {platform.name}-Account für {activeProfile.name} verbinden</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3.5 w-3.5" />
                            <span>{platform.name} für {activeProfile.name} verbinden →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 2: AKTIVE PROFILE & KANÄLE ────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-orange-400" />
                  <span>Deine aktiven Kanäle für „{activeProfile.name}“ ({profileChannels.length})</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Diese Accounts stehen dir exklusiv für <strong>{activeProfile.name}</strong> im Beitrags-Planer zur Verfügung.
                </p>
              </div>

              {profileChannels.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("composer")}
                  className="cryptox-orange-btn !py-1.5 !px-3.5 text-xs font-bold hidden sm:flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Beitrag planen</span>
                </button>
              )}
            </div>

            {profileChannels.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Link2 className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-white">Noch keine Kanäle für „{activeProfile.name}“ verknüpft</h5>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Klicke oben auf ein Netzwerk (z. B. TikTok, Instagram oder LinkedIn), um deinen ersten Kanal für <strong>{activeProfile.name}</strong> per 1-Klick zu verbinden.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileChannels.map((chan) => {
                  const Icon = PLATFORM_ICONS[chan.platform] || Share2;
                  const style = PLATFORM_COLORS[chan.platform] || PLATFORM_COLORS.facebook;
                  const isDisconnecting = disconnectingChannelId === chan.id;

                  return (
                    <div
                      key={chan.id}
                      className="cryptox-card p-5 border border-white/[0.08] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {chan.avatarUrl && chan.avatarUrl !== "/images/socialcraft-logo.png" ? (
                              <img
                                src={chan.avatarUrl}
                                alt={chan.name}
                                className="w-10 h-10 rounded-xl object-cover border border-white/15 shadow-sm"
                              />
                            ) : (
                              <div className={cn("p-2 rounded-xl border", style.bg, style.border)}>
                                <Icon className={cn("h-5 w-5", style.text)} />
                              </div>
                            )}

                            <div>
                              <h5 className="text-sm font-bold text-white leading-tight">{chan.name}</h5>
                              {chan.handle ? (
                                <p className="text-xs text-orange-300 font-mono font-medium">{chan.handle}</p>
                              ) : (
                                <p className="text-[11px] text-zinc-400 font-mono capitalize">{chan.platform}</p>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Aktiv
                          </span>
                        </div>

                        {/* Account ID / Business Details */}
                        <div className="bg-black/40 p-3 rounded-xl border border-white/[0.06] space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-sans">Kanal-ID:</span>
                            <span className="text-orange-300 font-bold truncate max-w-[170px]" title={chan.channelId}>
                              {chan.channelId}
                            </span>
                          </div>
                          {chan.businessId && (
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-sans">Business ID:</span>
                              <span className="text-zinc-300">{chan.businessId}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChannelId(chan.id);
                            setActiveTab("composer");
                            toast.info(`Kanal „${chan.name}“ im Composer geladen.`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        >
                          <span>Beitrag planen</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isDisconnecting}
                          onClick={() => handleDisconnectChannel(chan)}
                          className="px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Profil trennen"
                        >
                          <Trash2 className={cn("h-3.5 w-3.5", isDisconnecting && "animate-spin")} />
                          <span>{isDisconnecting ? "Trennt..." : "Trennen"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* ── BLUESKY AT PROTOCOL MODAL ─────────────────────────────────── */}
      <BlueskyConnectModal
        isOpen={showBlueskyModal}
        onClose={() => setShowBlueskyModal(false)}
        apiKey={activePostForMeKey}
        onSuccess={() => {
          setTimeout(() => handleSyncAccounts(true), 1500);
        }}
      />

      {/* ── PREVIEW / VALIDATION MODAL ───────────────────────────────── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#0F0D15] border border-white/15 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Vorschau & Prüfung</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewLoading ? (
              <div className="py-12 text-center text-sm text-zinc-400">Prüfe Beitrag bei der Plattform…</div>
            ) : previewError ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="break-words">{previewError}</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Der Beitrag würde in dieser Form von der Plattform abgelehnt. Passe Text/Medien/Einstellungen an.
                </p>
              </div>
            ) : previewData.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-400">Keine Vorschau-Daten erhalten.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2">
                  <Check className="h-4 w-4" />
                  <span>Sieht gut aus – der Beitrag wird von der Plattform akzeptiert.</span>
                </div>
                {previewData.map((pv, i) => {
                  const mediaUrl =
                    typeof pv.media?.[0] === "string" ? pv.media[0] : pv.media?.[0]?.url || undefined;
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                      <div className="text-[11px] font-mono uppercase text-zinc-400">
                        {pv.platform || "Plattform"}
                        {pv.social_account_username ? ` · @${pv.social_account_username}` : ""}
                      </div>
                      {mediaUrl && (
                        <img src={mediaUrl} alt="" className="w-full max-h-64 object-cover rounded-lg border border-white/10" />
                      )}
                      <p className="text-xs text-zinc-200 whitespace-pre-wrap">{pv.caption}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

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
                  disabled={isReschedulingRemote}
                  className="cryptox-orange-btn !py-1.5 !px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isReschedulingRemote && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>{isReschedulingRemote ? "Speichere…" : "Termin speichern"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── INSPECT POST DETAILS MODAL ─────────────────────────────── */}
      {inspectPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0F0D15] border border-white/15 rounded-2xl shadow-2xl p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const Icon = PLATFORM_ICONS[inspectPost.platform] || Share2;
                  const style = PLATFORM_COLORS[inspectPost.platform] || PLATFORM_COLORS.facebook;
                  return (
                    <div className={cn("p-1.5 rounded-lg border", style.bg, style.border)}>
                      <Icon className={cn("h-4 w-4", style.text)} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-sm font-bold text-white">{inspectPost.title || "Beitrags-Details"}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Geplant für: {new Date(inspectPost.scheduledFor).toLocaleString("de-DE")} Uhr
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectPost(null)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Gallery in Modal */}
            {inspectPost.mediaUrls && inspectPost.mediaUrls.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400">
                  Karussell-Bilder ({inspectPost.mediaUrls.length}):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {inspectPost.mediaUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Slide ${i + 1}`}
                      className="h-28 w-20 object-cover rounded-lg border border-white/10 shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Caption in Modal */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400">Caption & Text:</span>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap font-sans text-zinc-200">
                {inspectPost.caption}
              </div>
            </div>

            {/* Hashtags */}
            {inspectPost.hashtags && inspectPost.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {inspectPost.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-orange-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRescheduleOpen(inspectPost);
                    setInspectPost(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Datum anpassen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEditPost(inspectPost);
                    setInspectPost(null);
                    setActiveTab("composer");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vollständig bearbeiten</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDeletePost(inspectPost.id);
                    setInspectPost(null);
                  }}
                  className="p-2 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                  title="Beitrag löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
