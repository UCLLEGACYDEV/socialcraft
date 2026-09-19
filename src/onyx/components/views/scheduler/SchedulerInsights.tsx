import React from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Eye,
  Bookmark,
  Share2,
  Calendar,
  Sparkles,
  Flame,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import type { ScheduledPost } from "@/onyx/types";
import { PLATFORM_ICONS } from "@/onyx/components/widgets/scheduler-utils";

interface SchedulerInsightsProps {
  posts: ScheduledPost[];
}

export function SchedulerInsights({ posts }: SchedulerInsightsProps) {
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── KPI Metrics Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Geplante Beiträge
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{scheduledCount}</span>
            <span className="text-xs text-orange-400">im Kalender</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Veröffentlicht
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {publishedCount}
            </span>
            <span className="text-xs text-emerald-500">live</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Geschätzte Reichweite
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {publishedCount > 0 ? `${(publishedCount * 2.4).toFixed(1)}k` : "–"}
            </span>
            <span className="text-xs text-cyan-500">Impressions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Interaktions-Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {publishedCount > 0 ? "5.8 %" : "–"}
            </span>
            <span className="text-xs text-purple-500">Saves & Shares</span>
          </div>
        </div>
      </div>

      {/* ── Best Posting Times & Content Pillars ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Beste Sendezeiten */}
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Clock className="h-4 w-4 text-[#FF4D17]" />
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              Empfohlene beste Sendezeiten
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-pink-400" />
                <span className="text-xs font-bold text-white">Instagram Feed</span>
              </div>
              <span className="text-xs font-mono font-bold text-pink-300">Di & Do · 18:00 – 19:30</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-xs font-bold text-white">LinkedIn Karussell-Dokument</span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-300">Di & Mi · 08:30 – 10:00</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-bold text-white">TikTok Photo Slides</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300">Mo & Fr · 19:00 – 21:00</span>
            </div>
          </div>
        </div>

        {/* Card B: Content-Säulen Performance */}
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Flame className="h-4 w-4 text-[#FF4D17]" />
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              Hook- & Säulen-Performance
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Schritt-für-Schritt Guides</span>
                <span className="text-[11px] text-zinc-400">Hohe Speicherrate (Saves)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">+340 % Saves</span>
            </div>

            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Provokante Hook-Thesen</span>
                <span className="text-[11px] text-zinc-400">Maximale Kommentare & Debatten</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">+210 % Kommentare</span>
            </div>

            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Story & Zitate (Meinung)</span>
                <span className="text-[11px] text-zinc-400">Markenbindung & Follower-Zuwachs</span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400">+180 % Profilaufrufe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
