import {
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
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BrandKit, CreditStatus, TabKey } from "../types";
import { cn } from "@/lib/utils";

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "carousel", label: "Karussell", icon: Layers },
  { key: "bulk", label: "Serie", icon: ListVideo },
  { key: "direct-prompt", label: "Einzelbild", icon: ImageIcon },
  { key: "ai-clone", label: "AI Clone", icon: UserCheck },
  { key: "prompt-gallery", label: "Prompt Hub", icon: Sparkles },
  { key: "history", label: "Galerie", icon: GalleryVerticalEnd },
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
  onOpenMcp: () => void;
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
  onOpenMcp,
}: SidebarProps) {
  const lowCredits =
    (creditStatus?.kie.credits ?? 999) <= 50 || (creditStatus?.ai33.credits ?? 999) <= 50;

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 ease-out",
        collapsed ? "w-[68px]" : "w-[224px]",
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 font-mono text-sm font-bold text-primary-bright ring-1 ring-primary/40">
          O
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate font-mono text-sm font-bold tracking-tight">ONYX Studio</div>
            <div className="mono-label">Carousel Engine</div>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              title={label}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                isActive
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-bright" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 px-2 pb-3">
        {!collapsed && creditStatus && (
          <div className="mb-2 rounded-xl border border-border/70 bg-foreground/[0.03] p-2.5 transition-colors">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/90">Credits</span>
              <button
                type="button"
                onClick={onRefreshCredits}
                className="p-1 -mr-1 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-foreground/5"
                title="Credits aktualisieren"
                aria-label="Credits aktualisieren"
              >
                <RefreshCw className={cn("h-3 w-3", creditStatus.loading && "animate-spin")} />
              </button>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">KIE</span>
                <span className={cn("font-semibold", lowCredits ? "text-warning" : "text-foreground")}>
                  {creditStatus.kie.formatted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">ai33</span>
                <span className={cn("font-semibold", lowCredits ? "text-warning" : "text-foreground")}>
                  {creditStatus.ai33.formatted}
                </span>
              </div>
            </div>
          </div>
        )}

        <SideButton collapsed={collapsed} onClick={onOpenMcp} label="Claude MCP">
          <Zap className="h-4 w-4 text-primary-bright" />
        </SideButton>

        <SideButton collapsed={collapsed} onClick={onOpenBrandKit} label={brandKit.handle}>
          <span className="relative">
            <Palette className="h-4 w-4" />
            <span
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-sidebar"
              style={{ backgroundColor: brandKit.accentColorHex }}
            />
          </span>
        </SideButton>

        <SideButton collapsed={collapsed} onClick={onOpenSettings} label="Einstellungen">
          <Settings className="h-4 w-4" />
        </SideButton>

        <SideButton
          collapsed={collapsed}
          onClick={onToggleCollapsed}
          label="Einklappen"
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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
    >
      {children}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
