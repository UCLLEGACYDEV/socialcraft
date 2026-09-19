import React, { useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BrandKit,
  BriefValues,
  CreditStatus,
  SlideContent,
  ApiSettings,
  AiCloneProfile,
} from "@/onyx/types";
import type { User } from "@/onyx/auth";
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
  activeClone?: AiCloneProfile;

  // Studio Creation
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

  // Unused legacy props (kept in interface so parent doesn't break, but completely ignored)
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
  onGenerateStoryboard,
  isGeneratingStoryboard,
  slides,
}: StudioRootProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Check which API keys are active
  const hasKieKey = Boolean(settings.kieApiKey);
  const hasPostForMe = Boolean(settings.postForMeApiKey);
  const hasS4 = Boolean(settings.s4AccessKey && settings.s4SecretKey);
  const hasGeminiOrOpenAi = Boolean(settings.geminiApiKey || settings.openaiApiKey);

  return (
    <div className="min-h-screen bg-[#07050A] text-white flex flex-col selection:bg-[#FF4D17] selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[55rem] h-[28rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,77,23,0.08)_0%,transparent_70%)] blur-[90px]" />
      </div>

      {/* ── Minimalist Studio Header (NO TABS) ───────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0710]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
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
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Landingpage</span>
            </button>
          </div>

          {/* Right: API Keys & User */}
          <div className="flex items-center gap-2.5">
            {/* API Keys Status Pill */}
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="API-Schlüssel & Setup anzeigen"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Key className="h-3 w-3" />
              <span className="hidden sm:inline">Keys verbunden</span>
            </button>

            {/* Live Credits counter */}
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

            {/* Auth */}
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

      {/* ── Main Single Clean Studio View ────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Clean Hero Prompt Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0C15]/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[#FF4D17]/20 border border-[#FF4D17]/40 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#FF4D17]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A1F]">
              Neues Karussell erstellen
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Worüber möchtest du heute posten?
          </h1>
          <p className="text-sm text-zinc-400 mt-1 mb-6">
            Gib dein Thema oder einen Gedanken ein. Wir bauen daraus ein fertiges, hochauflösendes Social-Media-Karussell.
          </p>

          {/* Clean Input Area */}
          <div className="relative rounded-2xl border border-white/15 bg-black/50 p-4 focus-within:border-[#FF4D17] transition-all">
            <textarea
              value={brief.topic}
              onChange={(e) => onChangeBrief({ topic: e.target.value })}
              placeholder="z.B. Die 3 größten Fehler beim B2B-Vertrieb und wie du sie in unter 30 Tagen behebst..."
              rows={4}
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Folien-Anzahl:</span>
                {[4, 7, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: count })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                      brief.slideCount === count
                        ? "bg-[#FF4D17] text-white"
                        : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10",
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void onGenerateStoryboard()}
                disabled={!brief.topic.trim() || isGeneratingStoryboard}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg cursor-pointer",
                  !brief.topic.trim() || isGeneratingStoryboard
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] hover:scale-[1.02] shadow-[#FF4D17]/20",
                )}
              >
                {isGeneratingStoryboard ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Erstelle Storyboard...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Storyboard erstellen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active API Status Footer */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Kie AI ({hasKieKey ? "Aktiv" : "Aus .env"})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>PostForMe ({hasPostForMe ? "Aktiv" : "Aus .env"})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mega S4 Cloud ({hasS4 ? "Aktiv" : "Bereit"})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="text-[#FF6A1F] hover:underline cursor-pointer font-medium"
            >
              Schlüssel & Setup bearbeiten →
            </button>
          </div>
        </div>
      </main>

      {/* ── Setup & Key Modal (Accessible whenever needed) ─────────────── */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-[#0C0912] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[#FF4D17]" />
                <h2 className="text-lg font-bold text-white">API-Schlüssel & Setup</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="text-zinc-400 hover:text-white px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold"
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
