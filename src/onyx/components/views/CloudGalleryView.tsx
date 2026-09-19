import React, { useMemo, useState } from "react";
import {
  Archive,
  Calendar,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import type { User } from "@/onyx/auth";
import type { HistoryEntry, ApiSettings } from "@/onyx/types";
import { exportS4ImagesAsZip } from "@/onyx/export-zip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CloudGalleryViewProps {
  currentUser: User | null;
  historyEntries: HistoryEntry[];
  onOpenHistory: (entry: HistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  onUseInCarousel?: ((imageUrl: string, prompt: string) => void) | undefined;
  onUseInDirectPrompt?: ((prompt: string) => void) | undefined;
  onScheduleItem?: ((item: { title: string; imageUrls: string[]; prompt?: string }) => void) | undefined;
  onNavigateToScheduler?: (() => void) | undefined;
  settings?: ApiSettings;
}

export function CloudGalleryView({
  currentUser,
  historyEntries,
  onOpenHistory,
  onDeleteHistory,
  onUseInCarousel,
  onUseInDirectPrompt,
  onScheduleItem,
  onNavigateToScheduler,
}: CloudGalleryViewProps) {
  const [filterType, setFilterType] = useState<"all" | "carousel" | "single">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreviewEntry, setActivePreviewEntry] = useState<HistoryEntry | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return historyEntries.filter((entry) => {
      const isCarousel = entry.slides && entry.slides.length > 1;
      if (filterType === "carousel" && !isCarousel) return false;
      if (filterType === "single" && isCarousel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTopic = entry.topic?.toLowerCase().includes(q);
        const matchHeadline = entry.slides?.some((s) => s.headline?.toLowerCase().includes(q));
        if (!matchTopic && !matchHeadline) return false;
      }
      return true;
    });
  }, [historyEntries, filterType, searchQuery]);

  // 1-Click Vollexport aller Inhalte (PDF Kap. 10.8)
  const handleFullExport = async () => {
    if (historyEntries.length === 0) {
      toast.warning("Keine Inhalte für den Export vorhanden.");
      return;
    }

    setIsExportingZip(true);
    toast.info("Erstelle verschlüsseltes ZIP-Archiv deiner Daten…");

    try {
      // Gather all image URLs
      const allImages: { url: string; filename: string }[] = [];
      historyEntries.forEach((entry, eIdx) => {
        const safeTopic = (entry.topic || "projekt").slice(0, 25).replace(/[^a-zA-Z0-9]/g, "_");
        entry.slides.forEach((slide, sIdx) => {
          if (slide.imageUrl) {
            allImages.push({
              url: slide.imageUrl,
              filename: `${eIdx + 1}_${safeTopic}_slide_${sIdx + 1}.jpg`,
            });
          }
        });
      });

      if (allImages.length > 0) {
        await exportS4ImagesAsZip(
          allImages.map((img) => ({
            filename: img.filename,
            displayUrl: img.url,
          })),
          `socialcraft_datenhoheit_export_${Date.now()}`,
        );
        toast.success("Vollständiger ZIP-Export abgeschlossen! 📦");
      } else {
        toast.info("Keine exportierbaren Bilddaten gefunden.");
      }
    } catch {
      toast.error("Fehler beim Erstellen des ZIP-Exports.");
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Meine Inhalte & Cloud-Speicher
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Cloud-Galerie
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Alle erstellten Karusselle und Visuals gesichert an einem zentralen Ort.
          </p>
        </div>

        {/* Datenhoheit 1-Klick Aktionen */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isExportingZip || historyEntries.length === 0}
            onClick={handleFullExport}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            title="Vollständiges Backup aller Bilder und Texte als ZIP herunterladen"
          >
            <Download className="h-3.5 w-3.5 text-[#FF4D17]" />
            <span>{isExportingZip ? "Packe ZIP…" : "Voll-Export (ZIP)"}</span>
          </button>
        </div>
      </div>

      {/* ── Datenhoheit & Schutz-Banner ─────────────────────────────── */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4D17]/15 border border-[#FF4D17]/30 text-[#FF4D17]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Volle Datenhoheit</h3>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                Kein KI-Training
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deine Inhalte gehören ausschließlich dir. Kein Weiterverkauf, kein Training generativer
              Modelle auf deinen Texten oder Bildern (DSGVO Kap. 10.8).
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-400 font-mono text-right shrink-0">
          <span className="text-white font-bold">{historyEntries.length}</span> Projekte gesichert
        </div>
      </div>

      {/* ── Filter- & Suchleiste ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter-Tabs */}
        <div className="flex items-center rounded-2xl bg-white/[0.04] p-1 border border-white/[0.08] text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex-1 sm:flex-none text-center",
              filterType === "all" ? "bg-[#FF4D17] text-white shadow-sm" : "text-zinc-400 hover:text-white",
            )}
          >
            Alle ({historyEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("carousel")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex-1 sm:flex-none text-center",
              filterType === "carousel" ? "bg-[#FF4D17] text-white shadow-sm" : "text-zinc-400 hover:text-white",
            )}
          >
            Karusselle
          </button>
          <button
            type="button"
            onClick={() => setFilterType("single")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex-1 sm:flex-none text-center",
              filterType === "single" ? "bg-[#FF4D17] text-white shadow-sm" : "text-zinc-400 hover:text-white",
            )}
          >
            Einzelbilder
          </button>
        </div>

        {/* Suchleiste */}
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nach Thema oder Text suchen…"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Galerie Grid ────────────────────────────────────────────── */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center text-zinc-500 space-y-3">
          <FolderOpen className="h-10 w-10 mx-auto text-zinc-600" />
          <p className="text-sm font-bold text-zinc-300">Keine passenden Inhalte gefunden.</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Sobald du dein erstes Karussell oder Einzelbild generierst, erscheint es automatisch hier
            in deiner sicheren Cloud-Galerie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry) => {
            const firstImg = entry.slides[0]?.imageUrl;
            const slideCount = entry.slides.length;
            const isCarousel = slideCount > 1;

            return (
              <div
                key={entry.id}
                className="group rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div
                  onClick={() => setActivePreviewEntry(entry)}
                  className="relative aspect-[4/5] bg-black/80 overflow-hidden cursor-pointer"
                >
                  {firstImg ? (
                    <img
                      src={firstImg}
                      alt={entry.topic}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white">
                    {isCarousel ? (
                      <>
                        <Layers className="h-3 w-3 text-[#FF4D17]" />
                        <span>{slideCount} Slides</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3 text-blue-400" />
                        <span>Einzelbild</span>
                      </>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewEntry(entry);
                      }}
                      className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-transform hover:scale-110"
                      title="Vorschau öffnen"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {entry.topic || "Unbenanntes Projekt"}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                    {isCarousel ? (
                      <button
                        type="button"
                        onClick={() => onOpenHistory(entry)}
                        className="py-1.5 px-3 rounded-xl bg-[#FF4D17]/15 hover:bg-[#FF4D17]/25 text-[#FF4D17] text-xs font-bold transition-colors cursor-pointer flex-1 flex items-center justify-center gap-1"
                      >
                        <span>Im Studio</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      onUseInDirectPrompt && (
                        <button
                          type="button"
                          onClick={() => onUseInDirectPrompt(entry.topic)}
                          className="py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold transition-colors cursor-pointer flex-1 text-center"
                        >
                          Bearbeiten
                        </button>
                      )
                    )}

                    {onScheduleItem && onNavigateToScheduler && (
                      <button
                        type="button"
                        onClick={() => {
                          const validUrls = entry.slides
                            .map((s) => s.imageUrl)
                            .filter(Boolean) as string[];
                          onScheduleItem({
                            title: entry.topic,
                            imageUrls: validUrls,
                            prompt: entry.topic,
                          });
                          onNavigateToScheduler();
                        }}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Im Planer terminieren"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteHistory(entry.id)}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Vorschau Modal ──────────────────────────────────────────── */}
      {activePreviewEntry && (
        <div
          onClick={() => setActivePreviewEntry(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-[#0C0910] border border-white/15 rounded-3xl p-6 sm:p-7 space-y-5 overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white">{activePreviewEntry.topic}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {activePreviewEntry.slides.length} Folien · Erstellt am{" "}
                  {new Date(activePreviewEntry.createdAt).toLocaleDateString("de-DE")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewEntry(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Slides Preview Carousel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activePreviewEntry.slides.map((s, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-black">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                        Kein Bild
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold block">
                      Slide {idx + 1}
                    </span>
                    <span className="text-[11px] text-zinc-200 truncate block font-medium">
                      {s.headline || s.roleLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  onOpenHistory(activePreviewEntry);
                  setActivePreviewEntry(null);
                }}
                className="cryptox-orange-btn !py-2 !px-5 text-xs font-bold shadow-[0_0_20px_rgba(255,77,23,0.35)] cursor-pointer"
              >
                Im Karussell-Studio öffnen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
