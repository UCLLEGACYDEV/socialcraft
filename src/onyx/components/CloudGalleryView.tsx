import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  Cloud,
  Download,
  Folder,
  FolderDown,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import type { User } from "../auth";
import type { HistoryEntry } from "../types";
import {
  deleteBatchS4Images,
  deleteS4Image,
  getS4StorageStats,
  listS4Images,
  saveImageToS4,
  type S4CloudImage,
} from "../s4-storage";
import { downloadCloudImage, exportS4ImagesAsZip } from "../export-zip";
import { HistoryView } from "./SimpleViews";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CloudGalleryViewProps {
  currentUser: User | null;
  historyEntries: HistoryEntry[];
  onOpenHistory: (entry: HistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  onUseInCarousel?: ((imageUrl: string, prompt: string) => void) | undefined;
  onUseInDirectPrompt?: ((prompt: string) => void) | undefined;
}

export function CloudGalleryView({
  currentUser,
  historyEntries,
  onOpenHistory,
  onDeleteHistory,
  onUseInCarousel,
  onUseInDirectPrompt,
}: CloudGalleryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"cloud" | "local">("cloud");
  const [folderFilter, setFolderFilter] = useState<"my" | "users" | "admins" | "all">("my");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<S4CloudImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  // Reload when cloud storage changes
  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("onyx:s4-update", handleUpdate);
    return () => window.removeEventListener("onyx:s4-update", handleUpdate);
  }, []);

  const allImages = useMemo(() => {
    return listS4Images(currentUser, isAdmin ? folderFilter : "my");
  }, [currentUser, isAdmin, folderFilter, refreshTrigger]);

  const stats = useMemo(() => {
    return getS4StorageStats(currentUser, isAdmin ? folderFilter : "my");
  }, [currentUser, isAdmin, folderFilter, refreshTrigger]);

  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      if (categoryFilter !== "all" && img.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchPrompt = img.prompt.toLowerCase().includes(query);
        const matchFilename = img.filename.toLowerCase().includes(query);
        const matchUser = img.userName.toLowerCase().includes(query);
        return matchPrompt || matchFilename || matchUser;
      }
      return true;
    });
  }, [allImages, categoryFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedIds(filteredImages.map((img) => img.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleDeleteSingle = (image: S4CloudImage) => {
    if (confirm(`Bild „${image.filename}“ wirklich aus deinem Cloud-Ordner löschen?`)) {
      const ok = deleteS4Image(image.id);
      if (ok) {
        setSelectedIds((prev) => prev.filter((id) => id !== image.id));
        if (previewImage?.id === image.id) setPreviewImage(null);
        toast.success(`Bild gelöscht`);
      }
    }
  };

  const handleDeleteBatch = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`${selectedIds.length} Bilder wirklich aus dem Cloud-Ordner löschen?`)) {
      const count = deleteBatchS4Images(selectedIds);
      setSelectedIds([]);
      toast.success(`${count} Bilder erfolgreich gelöscht`);
    }
  };

  const handleDownloadSingle = async (image: S4CloudImage) => {
    await downloadCloudImage(image);
    toast.success(`Bild „${image.filename}“ heruntergeladen`);
  };

  // Download entire folder as ZIP
  const handleDownloadFolderZip = async () => {
    if (allImages.length === 0) {
      toast.error("Keine Bilder zum Herunterladen im Ordner.");
      return;
    }
    setIsZipping(true);
    toast.info("Erstelle ZIP-Archiv des Ordners…");
    try {
      const folderName = currentUser?.name ? `Cloud_Ordner_${currentUser.name.replace(/\s+/g, "_")}` : "Mein_Cloud_Ordner";
      const count = await exportS4ImagesAsZip(allImages, folderName);
      if (count > 0) {
        toast.success(`Ordner mit ${count} Bildern als ZIP heruntergeladen!`);
      } else {
        toast.error("Fehler beim Erstellen der ZIP-Datei.");
      }
    } finally {
      setIsZipping(false);
    }
  };

  // Download only selected images as ZIP
  const handleDownloadSelectedZip = async () => {
    const selectedImages = allImages.filter((img) => selectedIds.includes(img.id));
    if (selectedImages.length === 0) return;
    setIsZipping(true);
    toast.info(`Erstelle ZIP-Archiv mit ${selectedImages.length} Bildern…`);
    try {
      const count = await exportS4ImagesAsZip(selectedImages, `Auswahl_${selectedImages.length}_Bilder`);
      if (count > 0) {
        toast.success(`${count} Bilder als ZIP heruntergeladen!`);
      }
    } finally {
      setIsZipping(false);
    }
  };

  const handleManualUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;
    saveImageToS4({
      imageUrl: uploadUrl.trim(),
      prompt: uploadPrompt.trim() || "Manuell hinzugefügtes Bild",
      category: "upload",
      user: currentUser,
    });
    setUploadUrl("");
    setUploadPrompt("");
    setShowUploadModal(false);
    toast.success(`Bild in deinem Cloud-Ordner gesichert`);
  };

  const currentFolderName = currentUser ? currentUser.name : "Mein Cloud-Workspace";

  return (
    <div className="space-y-6">
      {/* ── Top Header & Tab Switcher ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2.5">
            <span>Cloud-Galerie & Mediathek</span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400">
              Cloud-Sync aktiv
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Alle deine generierten Bilder sicher in deinem persönlichen Cloud-Ordner abgelegt.
          </p>
        </div>

        {/* Tab Switcher: Mein Cloud-Ordner vs Lokales Archiv */}
        <div className="flex items-center rounded-2xl border border-white/[0.08] bg-[#0F0D15] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveSubTab("cloud")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeSubTab === "cloud"
                ? "border border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F] shadow-[0_0_15px_-3px_#FF4D17]"
                : "text-zinc-400 hover:text-white",
            )}
          >
            <Cloud className="h-4 w-4 text-[#FF6A1F]" />
            <span>Mein Cloud-Ordner</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-300">
              {allImages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("local")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeSubTab === "local"
                ? "border border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F] shadow-[0_0_15px_-3px_#FF4D17]"
                : "text-zinc-400 hover:text-white",
            )}
          >
            <Folder className="h-4 w-4 text-zinc-400" />
            <span>Lokale Entwürfe</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-300">
              {historyEntries.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── SubTab 2: Lokales Archiv ───────────────────────────────── */}
      {activeSubTab === "local" && (
        <HistoryView
          entries={historyEntries}
          onOpen={onOpenHistory}
          onDelete={onDeleteHistory}
        />
      )}

      {/* ── SubTab 1: Mein Cloud-Ordner ────────────────────────────── */}
      {activeSubTab === "cloud" && (
        <div className="space-y-5">
          {/* Cloud Connection Banner & Folder Management */}
          <div className="cryptox-card relative overflow-hidden border border-white/[0.08] p-5 sm:p-6 bg-gradient-to-r from-[#120F1C]/90 to-[#1A1424]/90">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Cloud-Speicher aktiv · Gesichert
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1 font-semibold text-xs text-orange-400">
                    <Folder className="h-3.5 w-3.5 text-orange-400" />
                    Ordner: {currentFolderName}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {stats.count} {stats.count === 1 ? "Bild" : "Bilder"} gespeichert ({stats.formattedSize})
                  </span>
                </div>
              </div>

              {/* Action Buttons: ZIP Download & Upload */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Download entire folder as ZIP */}
                <button
                  type="button"
                  onClick={handleDownloadFolderZip}
                  disabled={isZipping || allImages.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/[0.1] hover:border-white/25 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                  title="Alle Bilder dieses Ordners als ZIP herunterladen"
                >
                  <FolderDown className="h-4 w-4 text-[#FF6A1F]" />
                  <span>Ganzen Ordner herunterladen (ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3.5 py-2 text-xs font-semibold text-orange-400 transition-all hover:bg-orange-500/25 hover:text-white shadow-[0_0_15px_rgba(255,77,23,0.15)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Bild hinzufügen
                </button>

                <button
                  type="button"
                  onClick={() => setRefreshTrigger((p) => p + 1)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Ordner aktualisieren"
                  aria-label="Aktualisieren"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Admin Folder Switcher */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-300">Admin-Ansicht:</span>
                  <div className="flex rounded-xl border border-white/10 bg-black/30 p-0.5 text-xs">
                    {(
                      [
                        { id: "my", label: "Mein Ordner" },
                        { id: "users", label: "Alle Benutzer" },
                        { id: "all", label: "Gesamte Mediathek" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFolderFilter(tab.id)}
                        className={cn(
                          "rounded-lg px-3 py-1 font-medium transition-all",
                          folderFilter === tab.id
                            ? "bg-white/15 text-white font-semibold shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-[11px] text-zinc-500">
                  Als Administrator kannst du zwischen deinen eigenen und den Ordnern aller Nutzer wechseln.
                </span>
              </div>
            )}
          </div>

          {/* ── Search, Categories & Bulk Actions Bar ──────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nach Bildname, Thema oder Motiv suchen…"
                className="field-input !pl-10 !py-2 text-xs sm:text-sm w-full"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "Alle" },
                { id: "carousel", label: "Karussell" },
                { id: "series", label: "Serie" },
                { id: "direct-prompt", label: "Direct-Prompt" },
                { id: "upload", label: "Uploads" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                    categoryFilter === cat.id
                      ? "border-orange-500/60 bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(255,77,23,0.2)]"
                      : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {filteredImages.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#0E0C14] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-300">
                  <span className="font-bold text-orange-400">{selectedIds.length}</span> von {filteredImages.length} ausgewählt
                </span>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Keine
                  </button>
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSelectedZip}
                    disabled={isZipping}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/15 shadow-sm"
                  >
                    <Archive className="h-3.5 w-3.5 text-orange-400" />
                    Ausgewählte als ZIP ({selectedIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteBatch}
                    className="flex items-center gap-1.5 rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-destructive/30 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Ausgewählte löschen ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Empty State ────────────────────────────────────────── */}
          {filteredImages.length === 0 && (
            <div className="cryptox-card p-12 text-center border border-white/[0.08] space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <Cloud className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-base font-bold text-white">Noch keine Bilder im Cloud-Ordner</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {searchQuery || categoryFilter !== "all"
                  ? "Keine Treffer für deine Suche."
                  : "Erzeuge ein Karussell, generiere Visuals oder füge manuell ein Bild hinzu. Alles wird automatisch in deinem Cloud-Ordner gesichert."}
              </p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" /> Erstes Bild ablegen
              </button>
            </div>
          )}

          {/* ── Image Grid ─────────────────────────────────────────── */}
          {filteredImages.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredImages.map((img) => {
                const isSelected = selectedIds.includes(img.id);
                const sizeMB = (img.sizeBytes / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={img.id}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-2xl border bg-[#110F17]/90 backdrop-blur-xl transition-all duration-300",
                      isSelected
                        ? "border-[#FF4D17] ring-2 ring-[#FF4D17]/60 shadow-[0_0_25px_rgba(255,77,23,0.3)]"
                        : "border-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.5)] hover:border-orange-500/40 hover:shadow-[0_20px_50px_-10px_rgba(255,77,23,0.2)]",
                    )}
                  >
                    {/* Select Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(img.id);
                      }}
                      className={cn(
                        "absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-200",
                        isSelected
                          ? "border-[#FF4D17] bg-[#FF4D17] text-white shadow-[0_0_10px_#FF4D17]"
                          : "border-white/30 bg-black/60 text-transparent hover:border-white/60 hover:bg-black/80",
                      )}
                      aria-label="Auswählen"
                    >
                      <Check className={cn("h-3.5 w-3.5 stroke-[3]", isSelected ? "text-white" : "opacity-0")} />
                    </button>

                    {/* Category Badge */}
                    <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
                      <span className="rounded-md border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 backdrop-blur-md">
                        {img.category}
                      </span>
                    </div>

                    {/* Image Area */}
                    <div
                      className="relative aspect-[4/5] w-full overflow-hidden bg-black/40 cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    >
                      <img
                        src={img.displayUrl}
                        alt={img.filename}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Hover Overlay with Action Buttons */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 bg-black/75 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(img);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-transform hover:scale-110"
                          title="Details & Großansicht"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDownloadSingle(img);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform hover:scale-110"
                          title="Bild herunterladen"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSingle(img);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 hover:text-white transition-transform hover:scale-110 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                          title="Bild löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-3.5 space-y-2 border-t border-white/[0.06] bg-[#0E0C14]">
                      {/* Filename */}
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                        <span className="truncate" title={img.filename}>
                          {img.filename}
                        </span>
                      </div>

                      {/* Prompt */}
                      <p className="line-clamp-2 text-xs text-zinc-300 leading-relaxed font-normal" title={img.prompt}>
                        {img.prompt}
                      </p>

                      {/* User Info & Date */}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500 border-t border-white/[0.04]">
                        <span className="flex items-center gap-1 truncate max-w-[120px]" title={img.userName}>
                          <UserIcon className="h-3 w-3 shrink-0 text-orange-400/80" />
                          <span className="truncate">{img.userName}</span>
                        </span>
                        <span>{sizeMB} MB · {new Date(img.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Detail / Preview Modal ─────────────────────────────────── */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full rounded-3xl border border-white/10 bg-[#120F1C] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white">{previewImage.filename}</h3>
                <p className="text-xs text-zinc-400">In deinem Cloud-Ordner gesichert</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-[4/5] flex items-center justify-center">
                <img
                  src={previewImage.displayUrl}
                  alt={previewImage.filename}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Visual Prompt</span>
                  <p className="mt-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-zinc-300 leading-relaxed">
                    {previewImage.prompt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-zinc-400 pt-1">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Kategorie</span>
                    <span className="text-white font-medium capitalize">{previewImage.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Dateigröße</span>
                    <span className="text-white font-medium">{(previewImage.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Gespeichert am</span>
                    <span className="text-white font-medium">{new Date(previewImage.createdAt).toLocaleString("de-DE")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 block">Benutzer</span>
                    <span className="text-white font-medium">{previewImage.userName}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => void handleDownloadSingle(previewImage)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 text-orange-400" />
                    Herunterladen
                  </button>

                  {onUseInCarousel && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseInCarousel(previewImage.displayUrl, previewImage.prompt);
                        setPreviewImage(null);
                      }}
                      className="flex-1 cryptox-orange-btn !py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ins Karussell
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteSingle(previewImage)}
                    className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Upload / Save Modal ─────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <form
            onSubmit={handleManualUpload}
            className="relative max-w-md w-full rounded-3xl border border-white/10 bg-[#120F1C] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="h-4 w-4 text-orange-400" />
                Bild im Cloud-Ordner sichern
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Das Bild wird in deinem persönlichen Cloud-Ordner abgelegt:
              <span className="block mt-1 font-semibold text-orange-400">
                Ordner: {currentFolderName}
              </span>
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Bild-URL</label>
                <input
                  type="url"
                  required
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="field-input w-full text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Prompt / Notiz (optional)</label>
                <input
                  type="text"
                  value={uploadPrompt}
                  onChange={(e) => setUploadPrompt(e.target.value)}
                  placeholder="Z.B. Editorial 3D Marble Concept"
                  className="field-input w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                In Cloud sichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
