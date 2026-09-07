import {
  ArrowLeft,
  Coins,
  ChevronDown,
  Layers,
  LogOut,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Image as ImageIcon,
  Cloud,
  Lock,
} from "lucide-react";
import type { CreditStatus, TabKey } from "../types";
import type { User } from "../auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CryptoxNavbarProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onNavigateLanding?: () => void;
  onNavigateAdmin?: () => void;
  currentUser?: User | null;
  onOpenAuth?: (mode: "login" | "register") => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  creditStatus?: CreditStatus | undefined;
  onRefreshCredits: () => void;
  onOpenCreditsUpgrade?: () => void;
  onOpenBrandKit: () => void;
  onOpenSettings: () => void;
  onOpenMcp: () => void;
  onOpenDatenschutz?: () => void;
}

// Group 1: Creation Tools
const CREATION_TABS: { key: TabKey; label: string }[] = [
  { key: "carousel", label: "Karussell" },
  { key: "bulk", label: "Serie" },
  { key: "direct-prompt", label: "Einzelbild" },
];

// Group 2: Library & Workspaces
const LIBRARY_TABS: { key: TabKey; label: string }[] = [
  { key: "prompt-gallery", label: "Prompt Hub" },
  { key: "ai-clone", label: "KI Clone" },
  { key: "history", label: "Galerie" },
];

export function CryptoxNavbar({
  activeTab,
  onNavigate,
  onNavigateLanding,
  onNavigateAdmin,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  creditStatus,
  onRefreshCredits,
  onOpenCreditsUpgrade,
  onOpenBrandKit,
  onOpenSettings,
}: CryptoxNavbarProps) {
  const isAdmin = currentUser?.role === "admin";

  // Clean credit count without noisy provider text
  const creditDisplay = creditStatus?.kie.success
    ? `${creditStatus.kie.credits.toLocaleString()} cr`
    : currentUser
    ? `${currentUser.credits.toLocaleString()} cr`
    : creditStatus?.kie.formatted ?? "Credits";

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-3 pb-2 transition-all">
      <div className="mx-auto flex max-w-[1550px] items-center justify-between gap-3">
        {/* ── Left: Brand & Workspace Identity ────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            onClick={() => {
              onNavigate("carousel");
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Socialcraft Studio Workspace"
          >
            {/* Socialcraft Brand Logo Icon */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-[0_0_20px_-2px_rgba(255,77,23,0.5)] transition-transform duration-300 group-hover:scale-105 border border-[#FF4D17]/40 bg-black/60 shrink-0">
              <img
                src="/images/socialcraft-logo.png"
                alt="Socialcraft Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                Socialcraft
              </span>
              <span className="rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary-bright uppercase tracking-wider">
                {isAdmin ? "Admin" : currentUser ? "Pro" : "Studio"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Center: Grouped Studio Navigation ────────────────────── */}
        <nav className="hidden md:flex items-center rounded-full border border-white/10 bg-[#120F17]/90 p-1 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Creation Group */}
          <div className="flex items-center gap-0.5">
            {CREATION_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onNavigate(tab.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Elegant Divider */}
          <div className="h-3.5 w-[1px] bg-white/15 mx-1.5" />

          {/* Library / Workspace Group */}
          <div className="flex items-center gap-0.5">
            {LIBRARY_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onNavigate(tab.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Right: Consolidated Actions & User Hub ───────────────── */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Direct Admin Pill (when admin) */}
          {isAdmin && onNavigateAdmin && (
            <button
              type="button"
              onClick={onNavigateAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/50 bg-primary/20 hover:bg-primary/30 px-3 py-1.5 text-xs font-bold text-primary-bright shadow-[0_0_15px_-3px_#FF4D17] transition-all cursor-pointer"
              title="Admin Dashboard öffnen"
            >
              <Shield className="h-3.5 w-3.5 text-[#FF6A1F]" />
              <span>Admin</span>
            </button>
          )}

          {/* Credits Pill (clean & compact, no provider noise) */}
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-1 pl-3 text-xs font-medium text-white/90 backdrop-blur-xl hover:border-white/20 transition-all shadow-sm">
            <div
              onClick={onRefreshCredits}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white mr-1.5"
              title="Klicken zum Aktualisieren"
            >
              <Coins className="h-3.5 w-3.5 text-[#FF6A1F]" />
              <span className="font-semibold text-white font-mono tracking-tight">
                {creditDisplay}
              </span>
              <RefreshCw
                className={cn(
                  "h-3 w-3 text-zinc-500 hover:text-white transition-colors",
                  creditStatus?.loading && "animate-spin text-[#FFA149]",
                )}
              />
            </div>
            {onOpenCreditsUpgrade && (
              <button
                type="button"
                onClick={onOpenCreditsUpgrade}
                className="flex items-center gap-1 rounded-lg bg-[#FF4D17] hover:bg-[#FF6A1F] text-white px-2.5 py-1 text-[11px] font-bold shadow-[0_0_10px_rgba(255,77,23,0.4)] transition-all cursor-pointer"
                title="Credits aufladen"
              >
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">Aufladen</span>
              </button>
            )}
          </div>

          {/* Tools Cluster: Brand Kit, Settings & Privacy/Datenschutz */}
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-0.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={onOpenBrandKit}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Brand Kit & Design System"
            >
              <Palette className="h-3.5 w-3.5 text-orange-400" />
              <span className="hidden xl:inline">Brand Kit</span>
            </button>
            <div className="h-3.5 w-[1px] bg-white/10 my-auto" />
            {onOpenDatenschutz && (
              <>
                <button
                  type="button"
                  onClick={onOpenDatenschutz}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-300 hover:text-emerald-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Datenschutz & Sicherheit (DSGVO)"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden 2xl:inline text-emerald-400/90 font-medium">Sicherheit</span>
                </button>
                <div className="h-3.5 w-[1px] bg-white/10 my-auto" />
              </>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Einstellungen"
              aria-label="Einstellungen"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* User Profile & Account Dropdown */}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1 pr-2.5 backdrop-blur-xl hover:border-white/20 transition-all cursor-pointer select-none",
                    isAdmin && "border-primary/40 shadow-[0_0_12px_rgba(255,77,23,0.15)]"
                  )}
                >
                  <img
                    src={currentUser.avatarUrl || "/images/socialcraft-admin-logo.jpg"}
                    alt={currentUser.name}
                    onError={(e) => {
                      e.currentTarget.src = "/images/socialcraft-admin-logo.jpg";
                    }}
                    className="h-7 w-7 rounded-lg object-cover border border-white/20"
                  />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-none max-w-[100px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-zinc-400 capitalize leading-tight">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 rounded-2xl border border-white/10 bg-[#120F1C]/95 p-2 text-zinc-200 shadow-2xl backdrop-blur-2xl"
              >
                {/* Header Profile Info */}
                <div className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.06] mb-1">
                  <img
                    src={currentUser.avatarUrl || "/images/socialcraft-admin-logo.jpg"}
                    alt={currentUser.name}
                    onError={(e) => {
                      e.currentTarget.src = "/images/socialcraft-admin-logo.jpg";
                    }}
                    className="h-9 w-9 rounded-xl object-cover border border-white/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.2 text-[9px] font-bold text-orange-400 uppercase">
                        {currentUser.role}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Cloud aktiv
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-white/[0.08]" />

                {/* Profile & Credentials Modal */}
                {onOpenProfile && (
                  <DropdownMenuItem
                    onClick={onOpenProfile}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-orange-400" />
                    <span>Mein Profil & Cloud-Sync</span>
                  </DropdownMenuItem>
                )}

                {/* Quick Navigation Items */}
                {isAdmin && onNavigateAdmin && (
                  <DropdownMenuItem
                    onClick={onNavigateAdmin}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-orange-400 hover:bg-orange-500/15 hover:text-white cursor-pointer transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => onNavigate("history")}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
                >
                  <Cloud className="h-4 w-4 text-[#FF6A1F]" />
                  <span>Cloud-Galerie & Ordner</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onOpenBrandKit}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
                >
                  <Palette className="h-4 w-4 text-orange-400" />
                  <span>Brand Kit anpassen</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onOpenSettings}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4 text-zinc-400" />
                  <span>Studio & API Einstellungen</span>
                </DropdownMenuItem>

                {onOpenDatenschutz && (
                  <DropdownMenuItem
                    onClick={onOpenDatenschutz}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Datenschutz & Sicherheit (DSGVO)</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/[0.08]" />

                {/* Logout */}
                {onLogout && (
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Abmelden</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
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
