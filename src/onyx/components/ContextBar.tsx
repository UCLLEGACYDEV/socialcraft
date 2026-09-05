import { FolderOpen, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { ApiSettings, TabKey } from "../types";
import { StudioSelect } from "./StudioSelect";
import { cn } from "@/lib/utils";

interface ContextBarProps {
  view: TabKey;
  onNavigate: (tab: TabKey) => void;
  settings: ApiSettings;
  onUpdateSettings: (patch: Partial<ApiSettings>) => void;
  historyCount: number;
  seriesProgress?: { done: number; total: number } | null;
  onGotoSeries: () => void;
}

const KIE_MODELS: ApiSettings["kieModel"][] = [
  "nano-banana-2",
  "nano-banana-2-lite",
  "nano-banana-pro",
];
const RESOLUTIONS: ApiSettings["kieResolution"][] = ["1K", "2K", "4K"];

const NAV: { key: TabKey; label: string }[] = [
  { key: "carousel", label: "Karussell" },
  { key: "bulk", label: "Serie" },
  { key: "direct-prompt", label: "Einzelbild" },
  { key: "prompt-gallery", label: "Prompt Hub" },
  { key: "history", label: "Galerie" },
];

export function ContextBar({
  view,
  onNavigate,
  settings,
  onUpdateSettings,
  historyCount,
  seriesProgress,
  onGotoSeries,
}: ContextBarProps) {
  const showModel = view === "carousel" || view === "direct-prompt";
  const showShield = view === "carousel" || view === "bulk";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        {seriesProgress && (
          <button
            type="button"
            onClick={onGotoSeries}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary-bright"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Serie {seriesProgress.done}/{seriesProgress.total}
          </button>
        )}
        {showShield && (
          <div
            title={`Anti-Wiederholung: ${historyCount} gespeicherte Motive`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="font-semibold text-foreground/90">{historyCount}</span>
          </div>
        )}
      </div>

      <nav className="pill-nav absolute left-1/2 hidden -translate-x-1/2 md:flex">
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              view === item.key
                ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_var(--primary)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {showModel && (
          <div className="hidden items-center gap-2 lg:flex">
            <StudioSelect
              value={settings.kieModel}
              onChange={(v) => onUpdateSettings({ kieModel: v as ApiSettings["kieModel"] })}
              options={KIE_MODELS.map((m) => ({ value: m, label: m }))}
              ariaLabel="Bildmodell"
              className="w-44"
            />
            <StudioSelect
              value={settings.kieResolution}
              onChange={(v) =>
                onUpdateSettings({ kieResolution: v as ApiSettings["kieResolution"] })
              }
              options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
              ariaLabel="Auflösung"
              className="w-20"
            />
          </div>
        )}
        {view !== "direct-prompt" && (
          <button
            type="button"
            onClick={() => toast("Ordner öffnen ist nur in der Desktop-Version verfügbar.")}
            className="rounded-lg border border-border bg-foreground/[0.03] p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Ordner öffnen"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
