import {
  Coins,
  Cpu,
  Layers,
  Palette,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import type { CreditStatus, TabKey } from "../types";
import { cn } from "@/lib/utils";

interface CryptoxNavbarProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  creditStatus?: CreditStatus | undefined;
  onRefreshCredits: () => void;
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
  creditStatus,
  onRefreshCredits,
  onOpenBrandKit,
  onOpenSettings,
  onOpenMcp,
}: CryptoxNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 transition-all">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
        {/* ── Left: Brand Logo ─────────────────────────────────── */}
        <div
          onClick={() => onNavigate("carousel")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          {/* Swirl logo icon */}
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] via-[#FF6A1F] to-[#FFA149] shadow-[0_0_24px_-4px_#FF4D17] transition-transform duration-300 group-hover:scale-105">
            <div className="h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-[spin_8s_linear_infinite]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                Cryptox
              </span>
              <span className="rounded-full border border-primary/40 bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary-bright uppercase tracking-wider">
                Studio
              </span>
            </div>
          </div>
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
                  "relative rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200",
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

        {/* ── Right: Quick Controls & Credits ───────────────────── */}
        <div className="flex items-center gap-2">
          {/* Credits pill */}
          <div
            onClick={onRefreshCredits}
            className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur-xl hover:border-white/20 transition-colors cursor-pointer shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]"
            title="Klicken zum Aktualisieren"
          >
            <Coins className="h-3.5 w-3.5 text-[#FF6A1F]" />
            <span className="font-semibold text-white">
              {creditStatus?.kie.formatted ?? "4.320 cr"}
            </span>
            <RefreshCw
              className={cn(
                "h-3 w-3 text-white/40 hover:text-white transition-colors",
                creditStatus?.loading && "animate-spin text-[#FF6A1F]",
              )}
            />
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
        </div>
      </div>
    </header>
  );
}
