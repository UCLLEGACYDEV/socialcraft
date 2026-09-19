import React, { useMemo } from "react";
import {
  Sparkles,
  ListVideo,
  Calendar,
  GalleryVerticalEnd,
  UserCheck,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BrandKit,
  BriefValues,
  CreditStatus,
  HistoryEntry,
  ParsedCarousel,
  ScheduledPost,
  SeriesJob,
  SlideContent,
  SocialChannel,
  TabKey,
  ApiSettings,
  AiCloneProfile,
  BrandProfile,
} from "@/onyx/types";
import type { User } from "@/onyx/auth";

import { StudioPipelineView } from "../views/StudioPipelineView";
import { ProfileAndSetupView } from "../views/ProfileAndSetupView";
import { SeriesQueue } from "../views/SeriesQueue";
import { PostSchedulerView } from "../views/PostSchedulerView";
import { CloudGalleryView } from "../views/CloudGalleryView";

export interface StudioRootProps {
  // Navigation & Routing
  currentTab: TabKey;
  onNavigateTab: (tab: TabKey) => void;
  onNavigateLanding: () => void;
  onNavigateAdmin?: () => void;

  // User & Auth
  currentUser: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;

  // Credits
  creditStatus?: CreditStatus;
  onRefreshCredits: () => void;
  onOpenCreditsUpgrade?: () => void;

  // Brand, Settings & Setup
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  activeClone?: AiCloneProfile;
  brandProfiles?: BrandProfile[];
  activeBrandProfileId?: string;
  onSelectBrandProfile?: (id: string) => void;
  onUpdateBrandProfiles?: (profiles: BrandProfile[]) => void;

  // Single Studio Carousel Pipeline
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  slides: SlideContent[];
  onUpdateSlide: (id: string, patch: Partial<SlideContent>) => void;
  onGenerateStoryboard: () => Promise<void>;
  isGeneratingStoryboard: boolean;
  onRenderImages: () => Promise<void>;
  isRenderingImages: boolean;
  onResetCarousel: () => void;
  onExportZip: (withOverlay: boolean) => Promise<void> | void;
  onRerollImage: (slideId: string) => Promise<void>;

  // Autopilot / Series Queue
  queue: SeriesJob[];
  isRunningQueue: boolean;
  onAddJobs: (carousels: ParsedCarousel[]) => void;
  onRunQueue: () => void;
  onStopQueue: () => void;
  onDeleteJob: (id: string) => void;
  onClearQueue?: () => void;
  onRenameJob: (id: string, name: string) => void;
  onEditJobSlide: (jobId: string, slideId: string) => void;
  onRerollJobSlide: (jobId: string, slideId: string) => void;
  onDownloadJobSlide: (jobId: string, slideId: string) => void;
  onStartJobSlide?: (jobId: string, slideId: string) => void;
  onCancelJobSlide?: (jobId: string, slideId: string) => void;
  onRunSelectedJobSlides?: (jobId: string, slideIds: string[]) => void;
  onCancelJobSlides?: (jobId: string) => void;
  onSaveJobToCloud?: (jobId: string) => void;
  onOpen30DayBatch?: () => void;

  // Scheduler & Channels
  scheduledPosts: ScheduledPost[];
  onUpdateScheduledPosts: (posts: ScheduledPost[]) => void;
  socialChannels: SocialChannel[];
  onUpdateSocialChannels: (channels: SocialChannel[]) => void;
  schedulerSubTab?: "queue" | "composer" | "channels";

  // Gallery & History
  history: HistoryEntry[];
  onSelectHistoryEntry?: (entry: HistoryEntry) => void;
  onDeleteHistoryEntry?: (id: string) => void;
}

const PRIMARY_TABS: {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}[] = [
  { key: "carousel", label: "Studio (Erstellen)", shortLabel: "Studio", icon: Sparkles, badge: "Pipeline" },
  { key: "bulk", label: "Content-Serie", shortLabel: "Serie", icon: ListVideo, badge: "Autopilot" },
  { key: "scheduler", label: "Planer & Kalender", shortLabel: "Planer", icon: Calendar },
  { key: "history", label: "Cloud-Galerie", shortLabel: "Galerie", icon: GalleryVerticalEnd },
  { key: "ai-clone", label: "Mein Look & Setup", shortLabel: "Setup", icon: UserCheck },
];

export function StudioRoot({
  currentTab,
  onNavigateTab,
  onNavigateLanding,
  onNavigateAdmin,
  currentUser,
  onOpenAuth,
  creditStatus,
  onRefreshCredits,
  brandKit,
  onChangeBrandKit,
  settings,
  onChangeSettings,
  activeClone,
  brandProfiles,
  activeBrandProfileId,
  onSelectBrandProfile,
  onUpdateBrandProfiles,
  brief,
  onChangeBrief,
  slides,
  onUpdateSlide,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  onRenderImages,
  isRenderingImages,
  onResetCarousel,
  onExportZip,
  queue,
  isRunningQueue,
  onAddJobs,
  onRunQueue,
  onStopQueue,
  onDeleteJob,
  onClearQueue,
  onRenameJob,
  onEditJobSlide,
  onRerollJobSlide,
  onDownloadJobSlide,
  onStartJobSlide,
  onCancelJobSlide,
  onRunSelectedJobSlides,
  onCancelJobSlides,
  onSaveJobToCloud,
  onOpen30DayBatch,
  scheduledPosts,
  onUpdateScheduledPosts,
  socialChannels,
  onUpdateSocialChannels,
  schedulerSubTab,
  history,
  onSelectHistoryEntry,
  onDeleteHistoryEntry,
}: StudioRootProps) {
  // Normalize tab key so legacy keys redirect smoothly
  const activeTabKey: TabKey = useMemo(() => {
    if (
      currentTab === "overview" ||
      currentTab === "direct-prompt" ||
      currentTab === "prompt-gallery"
    ) {
      return "carousel";
    }
    return currentTab;
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-[#07050A] text-white flex flex-col selection:bg-[#FF4D17] selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,77,23,0.07)_0%,transparent_70%)] blur-[90px]" />
        <div className="absolute top-[40%] -right-32 w-[30rem] h-[30rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,90,20,0.04)_0%,transparent_70%)] blur-[90px]" />
      </div>

      {/* ── Studio Top Navigation Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0710]/90 backdrop-blur-xl px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Back to Landing */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateLanding}
              className="group flex items-center gap-2.5 text-left cursor-pointer transition-opacity hover:opacity-90"
              title="Zur Landingpage zurückkehren"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#FF4D17] to-[#FF8C00] p-[1px] shadow-[0_0_15px_-3px_#FF4D17]">
                <div className="h-full w-full rounded-[11px] bg-[#0A0710] flex items-center justify-center overflow-hidden">
                  <img
                    src="/images/socialcraft-logo.png"
                    alt="Socialcraft"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white font-sans">
                    Socialcraft
                  </span>
                  <span className="rounded bg-[#FF4D17]/15 border border-[#FF4D17]/30 px-1 py-0.2 text-[9px] font-bold text-[#FF6A1F] uppercase tracking-wider">
                    Studio
                  </span>
                </div>
              </div>
            </button>

            {/* Back to Landing link */}
            <button
              type="button"
              onClick={onNavigateLanding}
              className="hidden lg:inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer ml-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Landingpage</span>
            </button>
          </div>

          {/* ── Center: Primary Studio Navigation Tabs ───────────────── */}
          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-[#120F17]/90 p-1 shadow-lg backdrop-blur-2xl">
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeTabKey === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onNavigateTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {tab.badge && !isActive && (
                    <span className="hidden md:inline-block rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-medium text-zinc-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Right: User & Credits Hub ────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Live Credits counter */}
            <button
              type="button"
              onClick={onRefreshCredits}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              title="Kie AI & System Credits auffrischen"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-medium">
                {currentUser ? `${currentUser.credits ?? 100} Cr.` : "Aktiv"}
              </span>
              <RefreshCw
                className={cn(
                  "h-3 w-3 text-zinc-400 hover:text-white",
                  creditStatus?.loading && "animate-spin",
                )}
              />
            </button>

            {/* User Account / Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab("ai-clone")}
                  className="h-8 w-8 rounded-full border border-white/20 bg-zinc-800 flex items-center justify-center text-xs font-bold text-white hover:border-[#FF4D17] transition-colors cursor-pointer"
                  title={`${currentUser.name || currentUser.email} (Setup öffnen)`}
                >
                  {currentUser.name?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || "U"}
                </button>
                {currentUser.role === "admin" && onNavigateAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateAdmin}
                    className="hidden sm:inline-flex text-[10px] font-bold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-md hover:bg-amber-500/20 transition-colors"
                  >
                    Admin
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer border border-white/10"
              >
                Anmelden
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Studio View Routing ─────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* 1. Karussell Studio Pipeline */}
        {activeTabKey === "carousel" && (
          <StudioPipelineView
            brief={brief}
            onChangeBrief={onChangeBrief}
            slides={slides}
            onUpdateSlide={onUpdateSlide}
            onGenerateStoryboard={onGenerateStoryboard}
            isGeneratingStoryboard={isGeneratingStoryboard}
            onRenderImages={onRenderImages}
            isRenderingImages={isRenderingImages}
            onReset={onResetCarousel}
            onSchedulePost={(postData) => {
              const newPost: ScheduledPost = {
                id: `post-${Date.now()}`,
                title: postData.title,
                caption: postData.caption,
                hashtags: [],
                mediaUrls: postData.imageUrls,
                mediaType: "carousel",
                channelId: socialChannels[0]?.id || "default",
                platform: socialChannels[0]?.platform || "instagram",
                scheduledFor: new Date(Date.now() + 86400000).toISOString(),
                status: "scheduled",
                createdAt: new Date().toISOString(),
              };
              onUpdateScheduledPosts([newPost, ...scheduledPosts]);
              onNavigateTab("scheduler");
            }}
            onExportZip={() => onExportZip(true)}
            brandKit={brandKit}
            activeClone={activeClone}
            settings={settings}
            onNavigateToSetup={() => onNavigateTab("ai-clone")}
          />
        )}

        {/* 2. Content-Serie (Autopilot Batch) */}
        {activeTabKey === "bulk" && (
          <SeriesQueue
            queue={queue}
            isRunning={isRunningQueue}
            onAddJobs={onAddJobs}
            onRunQueue={onRunQueue}
            onStopQueue={onStopQueue}
            onDeleteJob={onDeleteJob}
            onClearQueue={onClearQueue}
            onRenameJob={onRenameJob}
            onEditSlide={onEditJobSlide}
            onRerollSlide={onRerollJobSlide}
            onDownloadSlide={onDownloadJobSlide}
            onStartSlide={onStartJobSlide}
            onCancelSlide={onCancelJobSlide}
            onRunSelectedSlides={onRunSelectedJobSlides}
            onCancelJobSlides={onCancelJobSlides}
            onSaveJobToCloud={onSaveJobToCloud}
            onOpen30DayBatch={onOpen30DayBatch}
            settings={settings}
            onChangeSettings={onChangeSettings}
          />
        )}

        {/* 3. Planer & Kalender */}
        {activeTabKey === "scheduler" && (
          <PostSchedulerView
            channels={socialChannels}
            onUpdateChannels={onUpdateSocialChannels}
            posts={scheduledPosts}
            onUpdatePosts={onUpdateScheduledPosts}
            currentSlides={slides}
            historyEntries={history}
            onNavigateToCarousel={() => onNavigateTab("carousel")}
            settings={settings}
            currentUser={currentUser}
            initialTab={schedulerSubTab}
            brandProfiles={brandProfiles}
            activeProfileId={activeBrandProfileId}
            onSelectProfile={onSelectBrandProfile}
            onUpdateBrandProfiles={onUpdateBrandProfiles}
          />
        )}

        {/* 4. Cloud Galerie */}
        {activeTabKey === "history" && (
          <CloudGalleryView
            currentUser={currentUser}
            historyEntries={history}
            onOpenHistory={(entry: HistoryEntry) => {
              if (onSelectHistoryEntry) onSelectHistoryEntry(entry);
              onNavigateTab("carousel");
            }}
            onDeleteHistory={(id: string) => {
              if (onDeleteHistoryEntry) onDeleteHistoryEntry(id);
            }}
            onNavigateToScheduler={() => onNavigateTab("scheduler")}
            settings={settings}
          />
        )}

        {/* 5. Mein Look & Setup */}
        {activeTabKey === "ai-clone" && (
          <ProfileAndSetupView
            brandKit={brandKit}
            onChangeBrandKit={onChangeBrandKit}
            settings={settings}
            onChangeSettings={onChangeSettings}
            currentUser={currentUser}
            creditStatus={creditStatus}
            onRefreshCredits={onRefreshCredits}
          />
        )}
      </main>
    </div>
  );
}
