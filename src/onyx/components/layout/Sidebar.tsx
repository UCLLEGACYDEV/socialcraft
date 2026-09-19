import {
  Calendar,
  Compass,
  GalleryVerticalEnd,
  Image as ImageIcon,
  Layers,
  ListVideo,
  Palette,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Settings,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BrandKit, CreditStatus, TabKey } from "@/onyx/types";
import { cn } from "@/lib/utils";

export interface NavItem {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "create",
    label: "Erstellen",
    items: [
      { key: "carousel", label: "Karussell", icon: Layers, badge: "Neu" },
      { key: "direct-prompt", label: "Einzelbild", icon: ImageIcon },
      { key: "bulk", label: "Content-Serie", icon: ListVideo },
      { key: "prompt-gallery", label: "Ideen & Vorlagen", icon: Sparkles },
    ],
  },
  {
    id: "schedule",
    label: "Planen",
    items: [
      { key: "scheduler", label: "Kalender & Posts", icon: Calendar },
    ],
  },
  {
    id: "content",
    label: "Meine Inhalte",
    items: [
      { key: "history", label: "Cloud-Galerie", icon: GalleryVerticalEnd },
    ],
  },
  {
    id: "style",
    label: "Mein Stil",
    items: [
      { key: "ai-clone", label: "Mein Gesicht", icon: UserCheck },
    ],
  },
];

interface SidebarProps {
  active: TabKey;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate: (key: TabKey) => void;
  brandKit: BrandKit;
  creditStatus?: CreditStatus;
  onRefreshCredits: () => void;
  onOpenBrandKit: () => void;
  onOpenSettings: () => void;
  onOpenMcp?: () => void;
}

export function Sidebar({
  active,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  brandKit,
  creditStatus,
  onRefreshCredits,
  onOpenBrandKit,
  onOpenSettings,
}: SidebarProps) {
  const lowCredits =
    (creditStatus?.kie.credits ?? 999) <= 50 || (creditStatus?.ai33.credits ?? 999) <= 50;

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/[0.08] bg-[#0C0910]/95 backdrop-blur-2xl transition-[width] duration-300 ease-out select-none",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* ── Brand Header ────────────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="flex items-center gap-3 text-left w-full group cursor-pointer focus:outline-none"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF4D17] to-[#FF7A30] text-sm font-bold text-white shadow-[0_0_16px_rgba(255,77,23,0.4)] group-hover:scale-105 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-white font-sans">
                Socialcraft
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">Studio Workspace</div>
            </div>
          )}
        </button>
      </div>

      {/* ── Primary Navigation ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {/* Hub / Overview Button */}
        <div>
          <button
            type="button"
            onClick={() => onNavigate("overview")}
            title="Übersicht & Start"
            className={cn(
              "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer",
              active === "overview"
                ? "bg-[#FF4D17] text-white shadow-[0_0_18px_-2px_#FF4D17]"
                : "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <Compass className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Übersicht</span>}
          </button>
        </div>

        {/* 4 Primary Navigation Groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {group.label}
              </div>
            )}
            {group.items.map(({ key, label, icon: Icon, badge }) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onNavigate(key)}
                  title={label}
                  className={cn(
                    "relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-white/[0.1] text-white font-semibold"
                      : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-[#FF4D17]" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#FF4D17]" : "text-zinc-400")} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!collapsed && badge && (
                    <span className="rounded-full bg-orange-500/20 px-1.5 py-0.2 text-[9px] font-bold text-orange-400">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Mein Look (Brand Kit) Shortcut */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={onOpenBrandKit}
            title="Mein Look (Farben & Schriftarten)"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative">
                <Palette className="h-4 w-4 text-zinc-400" />
                <span
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-[#0C0910]"
                  style={{ backgroundColor: brandKit.accentColorHex || "#FF4D17" }}
                />
              </span>
              {!collapsed && <span className="truncate">Mein Look</span>}
            </div>
            {!collapsed && (
              <span className="text-[10px] text-zinc-400 truncate max-w-[70px]">
                {brandKit.handle || "Look"}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Footer & Settings ───────────────────────────────────────── */}
      <div className="space-y-1.5 border-t border-white/[0.06] p-2.5">
        {!collapsed && creditStatus && (
          <div className="mb-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Guthaben</span>
              <button
                type="button"
                onClick={onRefreshCredits}
                className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Aktualisieren"
              >
                <RefreshCw className={cn("h-3 w-3", creditStatus.loading && "animate-spin")} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Verfügbar</span>
              <span className={cn("font-bold", lowCredits ? "text-amber-400" : "text-white")}>
                {creditStatus.kie.formatted}
              </span>
            </div>
          </div>
        )}

        <SideButton collapsed={collapsed} onClick={onOpenSettings} label="Einstellungen">
          <Settings className="h-4 w-4" />
        </SideButton>

        <SideButton
          collapsed={collapsed}
          onClick={onToggleCollapsed}
          label={collapsed ? "Erweitern" : "Einklappen"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </SideButton>
      </div>
    </aside>
  );
}

function SideButton({
  collapsed,
  onClick,
  label,
  children,
}: {
  collapsed: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
    >
      {children}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
