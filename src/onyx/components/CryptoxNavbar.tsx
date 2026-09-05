import {
  ArrowLeft,
  Coins,
  Cpu,
  Layers,
  LogOut,
  Palette,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import type { CreditStatus, TabKey } from "../types";
import type { User } from "../auth";
import { cn } from "@/lib/utils";

interface CryptoxNavbarProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onNavigateLanding?: () => void;
  onNavigateAdmin?: () => void;
  currentUser?: User | null;
  onOpenAuth?: (mode: "login" | "register") => void;
  onLogout?: () => void;
  creditStatus?: CreditStatus | undefined;
  onRefreshCredits: () => void;
  onOpenCreditsUpgrade?: () => void;
  onOpenBrandKit: () => void;
  onOpenSettings: () => void;
  onOpenMcp: () => void;
}

const NAV_TABS: { key: TabKey; label: string }[] = [
  { key: "carousel", label: "Karussell" },
  { key: "bulk", label: "Serie" },
  { key: "prompt-gallery", label: "Prompt Hub" },
  { key: "ai-clone", label: "KI Clone" },
  { key: "direct-prompt", label: "Einzelbild" },
  { key: "history", label: "Galerie" },
];

export function CryptoxNavbar({
  activeTab,
  onNavigate,
  onNavigateLanding,
  onNavigateAdmin,
  currentUser,
  onOpenAuth,
  onLogout,
  creditStatus,
  onRefreshCredits,
  onOpenCreditsUpgrade,
  onOpenBrandKit,
  onOpenSettings,
  onOpenMcp,
}: CryptoxNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 transition-all">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
        {/* ── Left: Brand Logo & Landing Link ──────────────────── */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onNavigateLanding ?? (() => onNavigate("carousel"))}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Zurück zur Startseite"
          >
            {/* Swirl logo icon */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] via-[#FF6A1F] to-[#FFA149] shadow-[0_0_24px_-4px_#FF4D17] transition-transform duration-300 group-hover:scale-105">
              <div className="h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-[spin_8s_linear_infinite]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white font-sans">
                  Socialcraft
                </span>
                <span className="rounded-full border border-primary/40 bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary-bright uppercase tracking-wider">
                  Studio
                </span>
              </div>
            </div>
          </div>

          {onNavigateLanding && (
            <button
              type="button"
              onClick={onNavigateLanding}
              className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all ml-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Startseite</span>
            </button>
          )}
        </div>

        {/* ── Center: Floating Pill Navigation ──────────────────── */}
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-[#120F17]/80 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onNavigate(tab.key)}
                className={cn(
                  "relative rounded-full px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#FF4D17] text-white shadow-[0_0_22px_-2px_#FF4D17]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.06]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ── Right: Quick Controls, Credits & User Profile ─────── */}
        <div className="flex items-center gap-2">
          {/* Universal Admin Button */}
          {onNavigateAdmin && (
            <button
              type="button"
              onClick={onNavigateAdmin}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all shadow-[0_0_15px_-4px_#FF4D17]",
                currentUser?.role === "admin"
                  ? "border-primary/50 bg-primary/20 text-primary-bright hover:bg-primary/30"
                  : "border-white/15 bg-white/[0.04] text-white/80 hover:text-white hover:border-primary/40 hover:bg-primary/10",
              )}
              title="Admin Dashboard öffnen"
            >
              <Shield className="h-3.5 w-3.5 text-[#FF6A1F]" />
              <span>{currentUser?.role === "admin" ? "Admin" : "Admin-Bereich"}</span>
            </button>
          )}

          {/* Interactive Credits Pill & Instant Upgrade Trigger */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pl-3 text-xs font-medium text-white/80 backdrop-blur-xl hover:border-white/20 transition-colors shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
            <div
              onClick={onRefreshCredits}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white"
              title="Klicken zum Aktualisieren"
            >
              <Coins className="h-3.5 w-3.5 text-[#FF6A1F]" />
              <span className="font-semibold text-white font-mono">
                {currentUser ? `${currentUser.credits.toLocaleString()} cr` : (creditStatus?.kie.formatted ?? "4.320 cr")}
              </span>
            </div>
            {onOpenCreditsUpgrade && (
              <button
                type="button"
                onClick={onOpenCreditsUpgrade}
                className="flex items-center gap-1 rounded-full bg-[#FF4D17] hover:bg-[#FF6A1F] text-white px-2.5 py-1 text-[11px] font-bold shadow-[0_0_12px_#FF4D17] transition-all cursor-pointer"
                title="Credits aufladen & upgraden"
              >
                <span>+ Aufladen</span>
              </button>
            )}
          </div>

          {/* Brand Kit */}
          <button
            type="button"
            onClick={onOpenBrandKit}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/80 backdrop-blur-xl transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <Palette className="h-3.5 w-3.5 text-primary-bright" />
            <span>Brand Kit</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/80 backdrop-blur-xl transition-all hover:bg-white/[0.08] hover:text-white"
            aria-label="Einstellungen"
            title="API & Studio Einstellungen"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Auth Profile or Login Trigger */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5 backdrop-blur-xl">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-7 w-7 rounded-full object-cover border border-white/20"
              />
              <span className="hidden xl:inline text-xs font-semibold text-white max-w-[100px] truncate">
                {currentUser.name.split(" ")[0]}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-white/40 hover:text-red-400 ml-1 transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                Anmelden
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
