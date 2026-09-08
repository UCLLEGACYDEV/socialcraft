import React from "react";
import {
  Facebook,
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Globe,
  MessageSquare,
  Twitter,
  Images,
  Send,
} from "lucide-react";
import type { SocialPlatform, SlideContent } from "../../types";
import type { PostForMeApiClient } from "../../postforme/client";

export const PLATFORM_ICONS: Record<SocialPlatform, React.ElementType> = {
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

export interface SchedulerConnectPlatformConfig {
  id: string;
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
 * MUST use local fields to prevent timezone shift drift.
 */
export function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses an `<input type="datetime-local">` value as local time. Returns null when empty/invalid. */
export function parseLocalDatetimeValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Slide images in guaranteed carousel order (by slideNumber, then array order). */
export function slidesToOrderedUrls(slides: SlideContent[]): string[] {
  return [...slides]
    .sort((a, b) => (a.slideNumber ?? 0) - (b.slideNumber ?? 0))
    .map((s) => s.imageUrl)
    .filter(Boolean) as string[];
}

/** Compact metric formatting: 1234 → "1.2k", 2_500_000 → "2.5M". */
export function formatMetric(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const rehostCache = new Map<string, string>();

/**
 * Re-hosts local/expiring media onto the publisher's own storage so remote API workers can always fetch.
 */
export async function ensurePublicMedia(client: PostForMeApiClient, urls: string[]): Promise<string[]> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const resolved = await Promise.all(
    urls.map(async (url) => {
      const isSameOrigin = url.startsWith("/") || (origin ? url.startsWith(origin) : false);
      const needsRehost =
        url.startsWith("data:") ||
        url.startsWith("blob:") ||
        isSameOrigin ||
        /[?&](X-Amz-|Signature=)/i.test(url);

      if (!needsRehost) return url;
      if (rehostCache.has(url)) return rehostCache.get(url)!;

      try {
        const resp = await fetch(url, isSameOrigin ? { credentials: "include" } : {});
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const hosted = await client.uploadMedia(blob, blob.type || "image/jpeg");
        rehostCache.set(url, hosted);
        return hosted;
      } catch (err) {
        console.warn("[PostScheduler] Could not re-host media for publishing:", url, err);
        return /^https:\/\//i.test(url) ? url : null;
      }
    })
  );

  return resolved.filter((u): u is string => !!u);
}
