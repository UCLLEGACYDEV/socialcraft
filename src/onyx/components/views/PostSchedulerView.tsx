import React, { useState } from "react";
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
  Edit3,
  X,
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  BarChart3,
  Layers,
  CalendarDays,
  List,
} from "lucide-react";
import type {
  SocialChannel,
  ScheduledPost,
  SocialPlatform,
  SlideContent,
  HistoryEntry,
  ApiSettings,
  BrandProfile,
} from "@/onyx/types";
import { PLATFORM_ICONS } from "@/onyx/components/widgets/scheduler-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/onyx/auth";
import {
  useSchedulerState,
  SchedulerCalendar,
  PostComposer,
  ReviewInbox,
  ChannelManager,
  SchedulerInsights,
} from "./scheduler";

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
  initialTab?: "calendar" | "queue" | "review" | "composer" | "channels" | "insights";
  onOpenPostForMeSetup?: () => void;
  onOpenZernioSetup?: () => void;
  onOpen30DayBatch?: () => void;
  brandProfiles?: BrandProfile[];
  activeProfileId?: string;
  onSelectProfile?: (id: string) => void;
  onUpdateBrandProfiles?: (profiles: BrandProfile[]) => void;
  onOpenBrandProfileManager?: () => void;
}

export function PostSchedulerView(props: PostSchedulerViewProps) {
  const state = useSchedulerState(props);

  const [composerPrefillDate, setComposerPrefillDate] = useState<string | undefined>(undefined);

  const handleOpenComposerWithDate = (date?: string) => {
    setComposerPrefillDate(date);
    state.setEditingPost(null);
    state.setActiveTab("composer");
  };

  const handleStartEditingPost = (post: ScheduledPost) => {
    state.setEditingPost(post);
    state.setActiveTab("composer");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-16">
      {/* ── Top Header: Brand Profile Switcher & Secondary Actions ─────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        {/* Brand Profile Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Marke / Profil:</span>
            <select
              value={state.activeProfile.id}
              onChange={(e) => state.handleSwitchProfile(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#FF4D17] cursor-pointer"
            >
              {state.resolvedProfiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.name}
                </option>
              ))}
              <option value="all" className="bg-zinc-900 text-orange-400 font-bold">
                ★ Alle Profile (Gesamtansicht)
              </option>
            </select>
          </div>

          {props.onOpenBrandProfileManager && (
            <button
              type="button"
              onClick={props.onOpenBrandProfileManager}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Verwalten
            </button>
          )}
        </div>

        {/* Secondary Action: 30-Day Content Generator */}
        {props.onOpen30DayBatch && (
          <button
            type="button"
            onClick={props.onOpen30DayBatch}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF4D17]/15 via-amber-500/15 to-[#FF4D17]/15 border border-[#FF4D17]/40 px-3.5 py-1.5 text-xs font-bold text-orange-300 hover:text-white transition-all shadow-[0_0_20px_rgba(255,77,23,0.15)] hover:shadow-[0_0_25px_rgba(255,77,23,0.35)] flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>30 Tage Content generieren</span>
          </button>
        )}
      </div>

      {/* ── Primary 5-Tab Navigation ──────────────────────────────────── */}
      <div className="flex items-center justify-center">
        <div className="flex flex-wrap justify-center rounded-2xl border border-white/10 bg-black/60 p-1.5 gap-1 shadow-xl">
          {/* Tab 1: Kalender */}
          <button
            type="button"
            onClick={() => state.setActiveTab("calendar")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              state.activeTab === "calendar"
                ? "bg-gradient-to-r from-[#FF4D17] to-[#FF6A1F] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Kalender</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                state.activeTab === "calendar"
                  ? "bg-white/30 text-white font-bold"
                  : "bg-white/10 text-zinc-400",
              )}
            >
              {state.visiblePosts.length}
            </span>
          </button>

          {/* Tab 2: Review-Inbox (Quality Gate) */}
          <button
            type="button"
            onClick={() => state.setActiveTab("review")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer relative",
              state.activeTab === "review"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Zur Freigabe</span>
            {state.pendingReviewPosts.length > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold",
                  state.activeTab === "review"
                    ? "bg-white/30 text-white"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                )}
              >
                {state.pendingReviewPosts.length}
              </span>
            )}
          </button>

          {/* Tab 3: Neuer Beitrag (Composer) */}
          <button
            type="button"
            onClick={() => {
              state.setEditingPost(null);
              setComposerPrefillDate(undefined);
              state.setActiveTab("composer");
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              state.activeTab === "composer"
                ? "bg-gradient-to-r from-[#FF4D17] to-[#FF6A1F] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <Plus className="h-4 w-4" />
            <span>Neuer Beitrag</span>
          </button>

          {/* Tab 4: Kanäle */}
          <button
            type="button"
            onClick={() => state.setActiveTab("channels")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              state.activeTab === "channels"
                ? "bg-gradient-to-r from-[#FF4D17] to-[#FF6A1F] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <Share2 className="h-4 w-4" />
            <span>Kanäle</span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.2 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {state.profileChannels.length}
            </span>
          </button>

          {/* Tab 5: Insights */}
          <button
            type="button"
            onClick={() => state.setActiveTab("insights")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              state.activeTab === "insights"
                ? "bg-gradient-to-r from-[#FF4D17] to-[#FF6A1F] text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Insights</span>
          </button>
        </div>
      </div>

      {/* ── Active Tab Component Rendering ────────────────────────────── */}
      {state.activeTab === "calendar" && (
        <SchedulerCalendar
          posts={state.visiblePosts}
          filterPlatform={state.filterPlatform}
          onSelectPlatform={state.setFilterPlatform}
          filterStatus={state.filterStatus}
          onSelectStatus={state.setFilterStatus}
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          onInspectPost={state.setInspectPost}
          onEditPost={handleStartEditingPost}
          onDeletePost={state.handleDeletePost}
          onDuplicatePost={state.handleDuplicatePost}
          onPublishNow={state.handlePublishNow}
          onOpenComposer={handleOpenComposerWithDate}
          isPublishingId={state.isPublishingId}
        />
      )}

      {state.activeTab === "review" && (
        <ReviewInbox
          pendingPosts={state.pendingReviewPosts}
          onApprove={state.handleApprovePost}
          onReject={state.handleRejectPost}
          onBatchApprove={state.handleBatchApprove}
          onEditInComposer={handleStartEditingPost}
          onNavigateToCalendar={() => state.setActiveTab("calendar")}
          onNavigateToComposer={() => state.setActiveTab("composer")}
        />
      )}

      {state.activeTab === "composer" && (
        <PostComposer
          channels={state.profileChannels}
          currentSlides={state.currentSlides}
          historyEntries={state.historyEntries}
          editingPost={state.editingPost}
          initialScheduledItem={state.initialScheduledItem}
          onSavePost={state.handleCreateOrUpdatePost}
          onPublishNow={state.handlePublishNow}
          onCancel={() => state.setActiveTab("calendar")}
          prefillDate={composerPrefillDate}
        />
      )}

      {state.activeTab === "channels" && (
        <ChannelManager
          channels={state.profileChannels}
          onToggleChannel={state.handleToggleChannel}
          onDisconnectChannel={state.handleDisconnectChannel}
          onAddChannel={state.handleAddChannel}
          hasPublisherKey={state.hasPublisherKey}
          isAdmin={state.isAdmin}
          onOpenPublisherSetup={props.onOpenPostForMeSetup || props.onOpenZernioSetup}
        />
      )}

      {state.activeTab === "insights" && (
        <SchedulerInsights posts={state.profilePosts} />
      )}

      {/* ── Inspect / Details Modal ───────────────────────────────────── */}
      {state.inspectPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0F0D15] border border-white/15 rounded-3xl shadow-2xl p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FF4D17]/15 border border-[#FF4D17]/30 text-[#FF4D17]">
                  {React.createElement(
                    PLATFORM_ICONS[state.inspectPost.platform] || Layers,
                    { className: "h-4 w-4" },
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {state.inspectPost.title || "Beitrags-Details"}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Geplant für:{" "}
                    {new Date(state.inspectPost.scheduledFor).toLocaleString("de-DE")} Uhr
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => state.setInspectPost(null)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Gallery */}
            {state.inspectPost.mediaUrls && state.inspectPost.mediaUrls.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400">
                  Folien & Bilder ({state.inspectPost.mediaUrls.length}):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {state.inspectPost.mediaUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Folie ${i + 1}`}
                      className="h-28 w-20 object-cover rounded-xl border border-white/10 shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400">Text:</span>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap font-sans text-zinc-200">
                {state.inspectPost.caption}
              </div>
            </div>

            {/* Hashtags */}
            {state.inspectPost.hashtags && state.inspectPost.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {state.inspectPost.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-orange-300"
                  >
                    #{tag.replace(/^#/, "")}
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
                    handleStartEditingPost(state.inspectPost!);
                    state.setInspectPost(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bearbeiten</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    state.handleDuplicatePost(state.inspectPost!);
                    state.setInspectPost(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-orange-400" />
                  <span>Duplizieren</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    state.handlePublishNow(state.inspectPost!);
                    state.setInspectPost(null);
                  }}
                  disabled={state.isPublishingId === state.inspectPost.id}
                  className="cryptox-orange-btn !py-1.5 !px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,77,23,0.3)]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Jetzt senden</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  state.handleDeletePost(state.inspectPost!.id);
                  state.setInspectPost(null);
                }}
                className="p-2 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                title="Beitrag löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
