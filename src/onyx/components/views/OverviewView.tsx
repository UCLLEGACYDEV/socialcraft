import {
  Calendar,
  ChevronRight,
  Clock,
  Cloud,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  Palette,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import type { User } from "@/onyx/auth";
import type { CreditStatus, HistoryEntry, ScheduledPost, SocialChannel, TabKey } from "@/onyx/types";
import { cn } from "@/lib/utils";

export interface OverviewViewProps {
  currentUser?: User | null;
  onNavigate: (tab: TabKey) => void;
  onOpen30DayBatch?: () => void;
  onOpenBrandKit?: () => void;
  onOpenSettings?: () => void;
  onOpenCreditsUpgrade?: () => void;
  scheduledPosts?: ScheduledPost[];
  socialChannels?: SocialChannel[];
  historyEntries?: HistoryEntry[];
  creditStatus?: CreditStatus;
  onRefreshCredits?: () => void;
  onOpenHistoryEntry?: (entry: HistoryEntry) => void;
}

export function OverviewView({
  currentUser,
  onNavigate,
  onOpen30DayBatch,
  onOpenBrandKit,
  onOpenSettings,
  onOpenCreditsUpgrade,
  scheduledPosts = [],
  socialChannels = [],
  historyEntries = [],
  creditStatus,
  onRefreshCredits,
  onOpenHistoryEntry,
}: OverviewViewProps) {
  const activeChannels = socialChannels.filter(
    (c) => Boolean(c.channelId || c.zernioAccountId || c.postForMeAccountId || c.accessToken)
  );
  const pendingPosts = scheduledPosts.filter((p) => p.status === "scheduled" || p.status === "draft");
  const recentEntries = historyEntries.slice(0, 3);

  const greetingName = currentUser?.name ? currentUser.name.split(" ")[0] : null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in-50 duration-300">
      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent p-6 sm:p-8 backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,77,23,0.15)_0%,transparent_70%)] blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              Studio Übersicht
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {greetingName ? `Hallo ${greetingName}, was möchtest du heute erstellen?` : "Was möchtest du heute erstellen?"}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Keine komplizierte Einrichtung nötig: Wähle deinen Startpunkt und lege direkt los. Deine Entwürfe werden automatisch in deiner privaten Cloud gesichert.
            </p>
          </div>

          {/* Quick status pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <Zap className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Guthaben</div>
                <div className="text-sm font-bold text-white">
                  {currentUser ? `${currentUser.credits.toLocaleString()} Credits` : "500 Start-Credits"}
                </div>
              </div>
              {onOpenCreditsUpgrade && (
                <button
                  type="button"
                  onClick={onOpenCreditsUpgrade}
                  className="ml-2 text-xs font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-4 cursor-pointer"
                >
                  Aufladen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── The 3 Big Hero Action Cards ────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Haupt-Startpunkte</h2>
            <p className="text-xs text-zinc-400">Die drei einfachsten Wege zu deinem nächsten Social-Media-Beitrag</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Karussell erstellen */}
          <div
            onClick={() => onNavigate("carousel")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#18131C] to-[#0E0B12] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF4D17]/50 hover:shadow-[0_12px_30px_-10px_rgba(255,77,23,0.3)] cursor-pointer"
          >
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,77,23,0.12)_0%,transparent_70%)] blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-[#FF5E28] border border-orange-500/40 shadow-inner group-hover:scale-105 transition-transform">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-bold text-orange-300">
                  Meistgenutzt
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white group-hover:text-orange-200 transition-colors">
                  Karussell erstellen
                </h3>
                <p className="text-xs font-semibold text-orange-400/90">
                  Mehrteilige Slide-Serie für Instagram & LinkedIn
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  Verwandelt dein Thema in eine zusammenhängende visuelle Story mit Hook, Hauptteil, Call-to-Action und konsistentem Look.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-[#FF5E28] group-hover:text-white transition-colors">
              <span>Jetzt Karussell starten</span>
              <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Einzelnes Bild */}
          <div
            onClick={() => onNavigate("direct-prompt")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#16141D] to-[#0E0C13] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_12px_30px_-10px_rgba(139,92,246,0.3)] cursor-pointer"
          >
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/40 shadow-inner group-hover:scale-105 transition-transform">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                  Schnell & Direkt
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition-colors">
                  Einzelnes Bild
                </h3>
                <p className="text-xs font-semibold text-violet-400/90">
                  Ein Visual in hoher Qualität auf den Punkt
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  Gib dein Wunsch-Motiv oder einen freien Text ein. Perfekt für Feed-Posts, Stories, Header oder Werbe-Grafiken.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-violet-400 group-hover:text-white transition-colors">
              <span>Bild generieren</span>
              <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3: 30 Tage Content */}
          <div
            onClick={() => {
              if (onOpen30DayBatch) onOpen30DayBatch();
              else onNavigate("scheduler");
            }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#1C1514] to-[#120B0A] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_12px_30px_-10px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,transparent_70%)] blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner group-hover:scale-105 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  Vollautomatisch
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                  30 Tage Content
                </h3>
                <p className="text-xs font-semibold text-amber-400/90">
                  Kompletter Monatsplan mit Veröffentlichung
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  Generiert auf Knopfdruck Beiträge für den ganzen Monat und verteilt sie automatisch auf die besten Uhrzeiten deiner Kanäle.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-white transition-colors">
              <span>Monatsplaner öffnen</span>
              <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Status & Quick Tools Hub ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hub Item 1: Planer */}
        <div
          onClick={() => onNavigate("scheduler")}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <Calendar className="h-4 w-4 text-[#FF4D17]" />
              <span className="text-xs font-bold text-white">Social-Media-Kalender</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-zinc-400">
            {pendingPosts.length > 0
              ? `${pendingPosts.length} geplante Beiträge in der Warteschlange`
              : "Noch keine Beiträge im Kalender eingeplant"}
          </p>
          <div className="text-[11px] font-medium text-orange-400/90 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{activeChannels.length} Social-Kanäle verknüpft</span>
          </div>
        </div>

        {/* Hub Item 2: Ideen & Vorlagen */}
        <div
          onClick={() => onNavigate("prompt-gallery")}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Ideen & Vorlagen</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-zinc-400">
            Erprobte Themen, Vorlagen und Inspirationen für deine Nische.
          </p>
          <div className="text-[11px] font-medium text-amber-400/90">
            Vorlagen durchstöbern →
          </div>
        </div>

        {/* Hub Item 3: Mein Gesicht */}
        <div
          onClick={() => onNavigate("ai-clone")}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Mein Gesicht</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-zinc-400">
            Füge dein eigenes Gesicht oder eine Persona in deine Visuals ein.
          </p>
          <div className="text-[11px] font-medium text-emerald-400/90">
            Gesichtsprofil verwalten →
          </div>
        </div>

        {/* Hub Item 4: Mein Look */}
        <div
          onClick={() => {
            if (onOpenBrandKit) onOpenBrandKit();
            else onNavigate("carousel");
          }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <Palette className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Mein Look</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-zinc-400">
            Farben, Schriften und Social-Handle für deinen einheitlichen Stil.
          </p>
          <div className="text-[11px] font-medium text-blue-400/90">
            Branding festlegen →
          </div>
        </div>
      </div>

      {/* ── Letzte Inhalte / Galerie Preview ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white">Zuletzt erstellte Inhalte</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("history")}
            className="text-xs text-orange-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold"
          >
            <span>Alle in der Galerie ansehen</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  if (onOpenHistoryEntry) onOpenHistoryEntry(entry);
                  else onNavigate("history");
                }}
                className="group flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 hover:bg-white/[0.05] hover:border-white/[0.16] transition-all cursor-pointer"
              >
                <div className="h-14 w-14 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                  {entry.slides?.[0]?.imageUrl ? (
                    <img
                      src={entry.slides[0].imageUrl}
                      alt={entry.topic}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Layers className="h-5 w-5 text-zinc-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-300 transition-colors">
                    {entry.topic || "Unbenanntes Projekt"}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {entry.slides?.length || 0} Slides • {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] p-6 text-center space-y-2">
            <Cloud className="h-6 w-6 text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400">
              Du hast noch keine Inhalte erstellt. Starte oben mit einem Karussell oder einem Einzelbild!
            </p>
          </div>
        )}
      </div>

      {/* ── Privacy & Trust Banner ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/30 p-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Privater Cloud-Ordner pro Nutzer: Deine Prompts und Bilder bleiben ausschließlich in deinem Workspace.</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>DSGVO-konform</span>
          <span>•</span>
          <span>Kein Datentraining mit deinen Inhalten</span>
        </div>
      </div>
    </div>
  );
}
