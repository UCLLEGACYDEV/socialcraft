import React, { useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  Key,
  Layers,
  MessageSquare,
  Workflow,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BrandKit,
  BriefValues,
  CreditStatus,
  SlideContent,
  ApiSettings,
  SocialChannel,
  ScheduledPost,
} from "@/onyx/types";
import type { User } from "@/onyx/auth";

import { ChatStudioView } from "./ChatStudioView";
import { BatchStudioView } from "./BatchStudioView";
import { FlowAutomationCanvas } from "./FlowAutomationCanvas";
import { ProfileAndSetupView } from "../views/ProfileAndSetupView";

export interface StudioRootProps {
  onNavigateLanding: () => void;
  onNavigateAdmin?: () => void;

  // User & Auth
  currentUser: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;

  // Credits
  creditStatus?: CreditStatus;
  onRefreshCredits: () => void;

  // Brand, Settings & Setup
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;

  // Studio Creation
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  slides: SlideContent[];
  onSetSlides?: (slides: SlideContent[]) => void;
  onUpdateSlide: (id: string, patch: Partial<SlideContent>) => void;
  onGenerateStoryboard: () => Promise<void>;
  isGeneratingStoryboard: boolean;
  onRenderImages: () => Promise<void>;
  isRenderingImages: boolean;
  onResetCarousel: () => void;
  onExportZip: (withOverlay: boolean) => Promise<void> | void;
  onRerollImage: (slideId: string) => Promise<void>;

  // Channels & Scheduling
  socialChannels?: SocialChannel[];
  onSchedulePosts?: (posts: ScheduledPost[]) => void;
  onSchedulePost?: (post: ScheduledPost) => void;

  // Catch-all
  [key: string]: any;
}

export function StudioRoot({
  onNavigateLanding,
  currentUser,
  onOpenAuth,
  creditStatus,
  onRefreshCredits,
  brandKit,
  onChangeBrandKit,
  settings,
  onChangeSettings,
  brief,
  onChangeBrief,
  slides,
  onSetSlides,
  onUpdateSlide,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  onRenderImages,
  isRenderingImages,
  onResetCarousel,
  onExportZip,
  socialChannels = [],
  onSchedulePosts = () => {},
  onSchedulePost = () => {},
}: StudioRootProps) {
  const [activeMode, setActiveMode] = useState<"chat" | "batch" | "flow">("chat");
  const [showSetupModal, setShowSetupModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#07050A] text-white flex flex-col selection:bg-[#FF4D17] selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,77,23,0.08)_0%,transparent_70%)] blur-[100px]" />
      </div>

      {/* ── Studio Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0710]/95 backdrop-blur-xl px-4 sm:px-6 py-3">
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-sans">
                  Socialcraft
                </span>
                <span className="rounded bg-[#FF4D17]/15 border border-[#FF4D17]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6A1F] uppercase tracking-wider">
                  Studio
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onNavigateLanding}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Landingpage</span>
            </button>
          </div>

          {/* ── 3-Way Mode Switcher (Chat | Batch | Flow) ─────────────── */}
          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-[#120F17]/90 p-1 shadow-lg backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setActiveMode("chat")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                activeMode === "chat"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("batch")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                activeMode === "batch"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Batch Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("flow")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                activeMode === "flow"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>Flow Automation</span>
            </button>
          </nav>

          {/* Right: Setup & User */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              title="API-Schlüssel & Brand-Setup bearbeiten"
            >
              <Key className="h-3.5 w-3.5 text-[#FF6A1F]" />
              <span className="hidden sm:inline">Setup & Keys</span>
            </button>

            <button
              type="button"
              onClick={onRefreshCredits}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Credits aktualisieren"
            >
              <span className="font-mono">{currentUser?.credits ?? 100} Cr.</span>
              <RefreshCw
                className={cn(
                  "h-3 w-3 text-zinc-400 hover:text-white",
                  creditStatus?.loading && "animate-spin",
                )}
              />
            </button>

            {!currentUser && (
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

      {/* ── Main Studio Workspace ────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Mode 1: Chat Studio (ChatGPT-Style für Karussells) */}
        {activeMode === "chat" && (
          <ChatStudioView
            brief={brief}
            onChangeBrief={onChangeBrief}
            slides={slides}
            onSetSlides={onSetSlides}
            onUpdateSlide={onUpdateSlide}
            onGenerateStoryboard={onGenerateStoryboard}
            isGeneratingStoryboard={isGeneratingStoryboard}
            onRenderImages={onRenderImages}
            isRenderingImages={isRenderingImages}
            onReset={onResetCarousel}
            onExportZip={() => onExportZip(true)}
            brandKit={brandKit}
            settings={settings}
          />
        )}

        {/* Mode 2: Batch Studio (Claude-Block & 1-Klick Planer) */}
        {activeMode === "batch" && (
          <BatchStudioView
            socialChannels={socialChannels}
            onSchedulePosts={onSchedulePosts}
            settings={settings}
          />
        )}

        {/* Mode 3: Flow Automation (n8n-Style Node Canvas) */}
        {activeMode === "flow" && (
          <FlowAutomationCanvas
            socialChannels={socialChannels}
            onSchedulePost={onSchedulePost}
          />
        )}
      </main>

      {/* ── Setup & Key Modal ────────────────────────────────────────── */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#0C0912] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[#FF4D17]" />
                <h2 className="text-lg font-bold text-white">API-Schlüssel & Brand-Setup</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="text-zinc-400 hover:text-white px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold cursor-pointer"
              >
                Schließen ✕
              </button>
            </div>

            <ProfileAndSetupView
              brandKit={brandKit}
              onChangeBrandKit={onChangeBrandKit}
              settings={settings}
              onChangeSettings={onChangeSettings}
              currentUser={currentUser}
              creditStatus={creditStatus}
              onRefreshCredits={onRefreshCredits}
            />
          </div>
        </div>
      )}
    </div>
  );
}
