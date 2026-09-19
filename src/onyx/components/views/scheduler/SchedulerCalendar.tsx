import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Layers,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Edit3,
  Copy,
  Trash2,
  X,
  Sparkles,
  LayoutGrid,
  List,
  CalendarDays,
  Zap,
} from "lucide-react";
import type { ScheduledPost, SocialPlatform, ScheduledPostStatus } from "@/onyx/types";
import { PLATFORM_ICONS } from "@/onyx/components/widgets/scheduler-utils";
import { cn } from "@/lib/utils";

interface SchedulerCalendarProps {
  posts: ScheduledPost[];
  filterPlatform: string;
  onSelectPlatform: (platform: string) => void;
  filterStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onInspectPost: (post: ScheduledPost) => void;
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
  onDuplicatePost: (post: ScheduledPost) => void;
  onPublishNow: (post: ScheduledPost) => void;
  onOpenComposer: (prefillDate?: string) => void;
  isPublishingId: string | null;
}

const PLATFORMS: { id: string; label: string }[] = [
  { id: "all", label: "Alle Kanäle" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
];

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Alle Status" },
  { id: "scheduled", label: "Geplant" },
  { id: "in_review", label: "Zur Freigabe" },
  { id: "published", label: "Veröffentlicht" },
  { id: "draft", label: "Entwurf" },
];

export function SchedulerCalendar({
  posts,
  filterPlatform,
  onSelectPlatform,
  filterStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onInspectPost,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
  onPublishNow,
  onOpenComposer,
  isPublishingId,
}: SchedulerCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1; // 0 = Monday
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean; isoDate: string }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isoDate: d.toISOString().split("T")[0]!,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isoDate: d.toISOString().split("T")[0]!,
      });
    }

    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isoDate: d.toISOString().split("T")[0]!,
      });
    }

    return days;
  }, [currentDate]);

  // Map posts to dates: dateString YYYY-MM-DD -> posts[]
  const postsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of posts) {
      const dateKey = post.scheduledFor.split("T")[0];
      if (dateKey) {
        const list = map.get(dateKey) || [];
        list.push(post);
        map.set(dateKey, list);
      }
    }
    return map;
  }, [posts]);

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* ── Toolbar: Platform Pills, Search, View Switcher ─────────────── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-black text-white capitalize min-w-[180px]">
              {monthYearLabel}
            </h2>
            <div className="flex items-center gap-1 border border-white/10 rounded-xl p-1 bg-white/[0.03]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Vorheriger Monat"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Heute
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Nächster Monat"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search & View Mode Switcher & Create Post Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Beiträge durchsuchen…"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 bg-black/50 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#FF4D17]"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-white/10 rounded-xl p-1 bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "month"
                    ? "bg-[#FF4D17] text-white shadow-[0_0_12px_rgba(255,77,23,0.4)]"
                    : "text-zinc-400 hover:text-white",
                )}
                title="Monatsansicht"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-[#FF4D17] text-white shadow-[0_0_12px_rgba(255,77,23,0.4)]"
                    : "text-zinc-400 hover:text-white",
                )}
                title="Listenansicht"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenComposer()}
              className="cryptox-orange-btn !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,77,23,0.35)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Neuer Beitrag</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
          <span className="text-xs text-zinc-500 mr-1 flex items-center gap-1 font-medium">
            <Filter className="h-3 w-3" />
            Filter:
          </span>

          {/* Platform Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PLATFORMS.map((p) => {
              const isSelected = filterPlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPlatform(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#FF4D17]/20 border-[#FF4D17] text-white shadow-[0_0_10px_rgba(255,77,23,0.2)]"
                      : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:border-white/20",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block h-3 w-px bg-white/10 mx-1" />

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((s) => {
              const isSelected = filterStatus === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectStatus(s.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                    isSelected
                      ? "bg-white/15 border-white/40 text-white"
                      : "bg-white/[0.01] border-white/[0.06] text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── View Content: Month Grid or List View ─────────────────────── */}
      {viewMode === "month" ? (
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl overflow-x-auto">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px] mb-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <span>Mo</span>
            <span>Di</span>
            <span>Mi</span>
            <span>Do</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>So</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {calendarDays.map((day, idx) => {
              const dayPosts = postsByDate.get(day.isoDate) || [];
              const isToday = day.isoDate === todayIso;

              return (
                <div
                  key={idx}
                  className={cn(
                    "group relative min-h-[120px] rounded-2xl border p-2 flex flex-col justify-between transition-all",
                    day.isCurrentMonth
                      ? "bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]"
                      : "bg-black/20 border-white/[0.03] opacity-40 hover:opacity-80",
                    isToday && "border-[#FF4D17]/50 shadow-[0_0_20px_rgba(255,77,23,0.15)]",
                  )}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono",
                        isToday
                          ? "bg-[#FF4D17] text-white shadow-[0_0_10px_#FF4D17]"
                          : "text-zinc-400 group-hover:text-white",
                      )}
                    >
                      {day.date.getDate()}
                    </span>

                    {/* Quick Add Button on Hover */}
                    <button
                      type="button"
                      onClick={() => onOpenComposer(day.isoDate)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-opacity cursor-pointer"
                      title="Beitrag für diesen Tag planen"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Posts in Day */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {dayPosts.map((p) => {
                      const Icon = PLATFORM_ICONS[p.platform] || Layers;
                      const timeStr = new Date(p.scheduledFor).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={p.id}
                          onClick={() => onInspectPost(p)}
                          className={cn(
                            "flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-medium truncate cursor-pointer transition-all hover:scale-[1.02]",
                            p.status === "published"
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                              : p.status === "in_review"
                              ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                              : p.status === "failed" || p.status === "manual_needed"
                              ? "bg-red-950/40 border-red-500/40 text-red-300"
                              : "bg-white/[0.05] border-white/10 text-white hover:border-[#FF4D17]/50",
                          )}
                          title={`${p.title} (${timeStr})`}
                        >
                          <Icon className="h-3 w-3 shrink-0 text-[#FF4D17]" />
                          <span className="truncate flex-1">{p.title}</span>
                          <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                            {timeStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── List View ─────────────────────────────────────────────── */
        <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-3">
          {posts.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 space-y-2">
              <Layers className="h-10 w-10 mx-auto text-zinc-600" />
              <p className="text-xs">Keine Beiträge im gewählten Filter gefunden</p>
            </div>
          ) : (
            posts.map((post) => {
              const Icon = PLATFORM_ICONS[post.platform] || Layers;
              const dateFormatted = new Date(post.scheduledFor).toLocaleDateString("de-DE", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={post.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative h-14 w-12 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                      {post.mediaUrls?.[0] ? (
                        <img
                          src={post.mediaUrls[0]}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-600">
                          <Icon className="h-4 w-4" />
                        </div>
                      )}
                      {post.mediaUrls?.length > 1 && (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] font-mono text-white">
                          {post.mediaUrls.length}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white truncate">{post.title}</span>
                        <span
                          className={cn(
                            "px-2 py-0.2 rounded-md text-[10px] font-bold border",
                            post.status === "published"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : post.status === "in_review"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : post.status === "failed" || post.status === "manual_needed"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-white/10 text-zinc-300 border-white/10",
                          )}
                        >
                          {post.status === "published"
                            ? "Veröffentlicht"
                            : post.status === "in_review"
                            ? "Zur Freigabe"
                            : post.status === "failed"
                            ? "Fehlgeschlagen"
                            : post.status === "manual_needed"
                            ? "Manuell nötig"
                            : "Geplant"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">{post.caption}</p>
                      <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                        {dateFormatted} · {post.platform}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspectPost(post)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Details ansehen"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditPost(post)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Bearbeiten"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicatePost(post)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Duplizieren"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
