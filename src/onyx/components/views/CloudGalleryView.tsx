import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  Folder,
  FolderDown,
  FolderOpen,
  Images,
  Layers,
  LayoutGrid,
  Maximize2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import type { User } from "@/onyx/auth";
import type { HistoryEntry, ApiSettings } from "@/onyx/types";
import {
  deleteBatchS4Images,
  deleteS4Image,
  getS4StorageStats,
  listS4Images,
  saveImageToS4,
  ensureUserS4Folder,
  type S4CloudImage,
} from "@/onyx/s4-storage";
import { downloadCloudImage, exportS4ImagesAsZip } from "@/onyx/export-zip";
import { HistoryView } from "./SimpleViews";
import { LS } from "@/onyx/storage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GalleryScheduleModal } from "@/onyx/components/modals/GalleryScheduleModal";
import "@/onyx/components/widgets/cloud-gallery.css";

/** Wandelt technische Ordnernamen (2026-09-06_WARUM_DEINE_GESPRAeCHE..._c8bc6f) in lesbare Titel um. */
function prettyProjectName(raw: string): string {
  let s = raw.replace(/^\d{4}-\d{2}-\d{2}_/, ""); // Datums-Präfix weg
  s = s.replace(/_[0-9a-f]{6}$/i, ""); // Hash-Suffix weg
  s = s
    .replace(/Ae/g, "Ä").replace(/Oe/g, "Ö").replace(/Ue/g, "Ü")
    .replace(/ae/g, "ä").replace(/oe/g, "ö").replace(/ue/g, "ü");
  s = s.replace(/_/g, " ").trim();
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Kurzes Datum aus dem Ordner-Präfix, falls vorhanden. */
function projectDate(raw: string): string | null {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})_/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null;
}

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
  settings,
}: CloudGalleryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"cloud" | "local">("cloud");
  const [folderFilter, setFolderFilter] = useState<"my" | "users" | "admins" | "all">("my");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<S4CloudImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [scheduleModalItem, setScheduleModalItem] = useState<{
    title: string;
    imageUrls: string[];
    prompt?: string;
  } | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  // Automatically ensure the user's cloud folder exists (especially for active admin!)
  useEffect(() => {
    if (currentUser) {
      void ensureUserS4Folder(currentUser).then((res) => {
        if (res.success) {
          console.log(`[CloudGalleryView] Cloud folder ready: ${res.folder}`);
        }
      });
    }
  }, [currentUser]);

  // Reload when cloud storage changes
  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("onyx:s4-update", handleUpdate);
    return () => window.removeEventListener("onyx:s4-update", handleUpdate);
  }, []);

  const [allImages, setAllImages] = useState<S4CloudImage[]>([]);
  const [stats, setStats] = useState({ count: 0, totalBytes: 0, formattedSize: "0 MB", folder: "" });

  useEffect(() => {
    let isMounted = true;
    const fetchCloudData = async () => {
      const f = isAdmin ? folderFilter : "my";
      const [images, newStats] = await Promise.all([
        listS4Images(currentUser, f),
        getS4StorageStats(currentUser, f)
      ]);
      if (isMounted) {
        setAllImages(images);
        setStats(newStats);
      }
    };
    void fetchCloudData();
    return () => { isMounted = false; };
  }, [currentUser, isAdmin, folderFilter, refreshTrigger]);

  const handleSyncCloudFolder = async () => {
    setIsSyncingFolder(true);
    toast.info("Prüfe & erstelle Cloud-Ordner im Speicher...");
    try {
      const res = await ensureUserS4Folder(currentUser);
      if (res.success) {
        toast.success(`Cloud-Ordner „${res.folder}“ erfolgreich im Speicher bereitgestellt!`);
        setRefreshTrigger((p) => p + 1);
      } else {
        toast.error(`Hinweis zum Cloud-Ordner: ${res.error || "Bitte Cloud-Schlüssel in den Einstellungen prüfen."}`);
      }
    } finally {
      setIsSyncingFolder(false);
    }
  };

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

  const handleDeleteSingle = async (image: S4CloudImage) => {
    if (confirm(`Bild „${image.filename}“ wirklich aus deinem Cloud-Ordner löschen?`)) {
      const ok = await deleteS4Image(image.id);
      if (ok) {
        setSelectedIds((prev) => prev.filter((id) => id !== image.id));
        if (previewImage?.id === image.id) setPreviewImage(null);
        toast.success(`Bild gelöscht`);
      }
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`${selectedIds.length} Bilder wirklich aus dem Cloud-Ordner löschen?`)) {
      const count = await deleteBatchS4Images(selectedIds);
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

  const [galleryViewMode, setGalleryViewMode] = useState<"folders" | "grid">("folders");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [viewerProject, setViewerProject] = useState<string | null>(null);

  const toggleProjectExpand = (projectName: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  // Group images into clean user folder hierarchy: carousels, clones, gallery
  const folderTree = useMemo(() => {
    const carousels: Record<string, S4CloudImage[]> = {};
    const clones: Record<string, S4CloudImage[]> = {};
    const series: Record<string, S4CloudImage[]> = {};
    const gallery: S4CloudImage[] = [];

    for (const img of filteredImages) {
      if (img.subfolder === "carousels" || img.category === "carousel") {
        const proj = img.projectName || "Standard Karussell-Projekt";
        if (!carousels[proj]) carousels[proj] = [];
        carousels[proj].push(img);
      } else if (img.subfolder === "series" || img.category === "series") {
        const proj = img.projectName || "Standard Serien-Projekt";
        if (!series[proj]) series[proj] = [];
        series[proj].push(img);
      } else if (img.subfolder === "clones" || img.category === "ai-clone") {
        const proj = img.projectName || "Eigene KI-Klone";
        if (!clones[proj]) clones[proj] = [];
        clones[proj].push(img);
      } else {
        gallery.push(img);
      }
    }

    // Sort carousels and series slides by filename (slide_01, slide_02, etc.)
    Object.keys(carousels).forEach((k) => {
      carousels[k].sort((a, b) => a.filename.localeCompare(b.filename));
    });
    Object.keys(series).forEach((k) => {
      series[k].sort((a, b) => a.filename.localeCompare(b.filename));
    });

    return { carousels, clones, series, gallery };
  }, [filteredImages]);

  // Download entire single project folder as ZIP
  const handleDownloadProjectZip = async (projectName: string, images: S4CloudImage[]) => {
    if (images.length === 0) return;
    setIsZipping(true);
    toast.info(`Erstelle ZIP für Projekt „${projectName}“…`);
    try {
      const cleanProj = projectName.replace(/[^\p{L}\p{N}_-]+/gu, "_") || "Karussell_Projekt";
      const count = await exportS4ImagesAsZip(images, cleanProj);
      if (count > 0) {
        toast.success(`Projekt „${projectName}“ (${count} Slides) heruntergeladen!`);
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

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;
    const saved = await saveImageToS4({
      imageUrl: uploadUrl.trim(),
      prompt: uploadPrompt.trim() || "Manuell hinzugefügtes Bild",
      category: "upload",
      user: currentUser,
      onError: (msg) => toast.error(`Cloud-Speicherung fehlgeschlagen: ${msg}`),
    });
    if (!saved) return;
    setUploadUrl("");
    setUploadPrompt("");
    setShowUploadModal(false);
    toast.success(`Bild in deinem Cloud-Ordner gesichert`);
  };

  const currentFolderName = currentUser ? currentUser.name : "Mein Cloud-Workspace";

  return (
    <div className="gallery-workspace space-y-6">
      <div className="gallery-heading">
        <div>
          <p className="gallery-eyebrow">DEIN CONTENT-WORKSPACE</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Galerie & Mediathek</h1>
          <p className="mt-2 text-sm text-zinc-400">Deine Bilder und Projekte. Bereit für den nächsten Post.</p>
        </div>
        <div className="gallery-tabs" role="group" aria-label="Speicherort">
          <button type="button" aria-pressed={activeSubTab === "cloud"} onClick={() => setActiveSubTab("cloud")}>
            <Cloud className="h-4 w-4" /><span>Cloud-Galerie</span><span className="gallery-count">{allImages.length}</span>
          </button>
          <button type="button" aria-pressed={activeSubTab === "local"} onClick={() => setActiveSubTab("local")}>
            <Folder className="h-4 w-4" /><span>Lokale Entwürfe</span><span className="gallery-count">{historyEntries.length}</span>
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
          <div className="gallery-storage">
            <div className="gallery-storage-row">
              <div className="flex items-center gap-3 min-w-0">
                <span className="gallery-storage-icon"><Cloud className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold text-white">{stats.count} {stats.count === 1 ? "Bild" : "Bilder"}<span className="mx-2 text-zinc-600">·</span><span className="font-normal text-zinc-400">{stats.formattedSize}</span></p>
                  <p className="mt-1 text-xs text-zinc-400">{folderFilter === "my" ? "Dein persönlicher Cloud-Ordner" : folderFilter === "users" ? "Ordner aller Benutzer" : "Gesamte Mediathek"}</p>
                </div>
              </div>
              <div className="gallery-storage-actions">
                <button type="button" onClick={handleDownloadFolderZip} disabled={isZipping || allImages.length === 0} className="gallery-button gallery-secondary">
                  <FolderDown className="h-4 w-4" /><span>{isZipping ? "ZIP wird erstellt…" : "Ordner herunterladen"}</span>
                </button>
                <button type="button" onClick={() => setShowUploadModal(true)} className="gallery-button gallery-primary">
                  <Plus className="h-4 w-4" />Bild hinzufügen
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="gallery-button gallery-secondary gallery-icon-button" aria-label="Ordneraktionen"><MoreHorizontal className="h-5 w-5" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-white/10 bg-[#14131b] text-zinc-200">
                    <DropdownMenuItem onClick={() => setRefreshTrigger((p) => p + 1)} className="gap-2 py-3"><RefreshCw className="h-4 w-4" />Galerie aktualisieren</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleSyncCloudFolder()} disabled={isSyncingFolder} className="gap-2 py-3"><Cloud className="h-4 w-4" />{isSyncingFolder ? "Synchronisiere…" : "Cloud-Ordner synchronisieren"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {isAdmin && (
              <div className="gallery-admin-row">
                <label htmlFor="gallery-folder-scope" className="text-xs font-medium text-zinc-400">Admin-Ansicht</label>
                <select id="gallery-folder-scope" value={folderFilter} onChange={(e) => setFolderFilter(e.target.value as typeof folderFilter)} className="gallery-scope-select">
                  <option value="my">Mein Ordner</option><option value="users">Alle Benutzer</option><option value="all">Gesamte Mediathek</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Search, Categories & Bulk Actions Bar ──────────────── */}
          <div className="gallery-toolbar">
            {/* Search Input & View Switcher */}
            <div className="gallery-search-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bilder, Themen oder Motive suchen…"
                  aria-label="Galerie durchsuchen"
                  className="field-input !pl-10 !py-3 !text-sm w-full"
                />
              </div>

              {/* View Switcher: Ordner-Struktur vs Kachel-Raster */}
              <div className="gallery-tabs gallery-view-tabs" role="group" aria-label="Galerieansicht">
                <button
                  type="button"
                  aria-pressed={galleryViewMode === "folders"}
                  onClick={() => setGalleryViewMode("folders")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer",
                    galleryViewMode === "folders"
                      ? "bg-[#FF4D17]/20 text-[#FF6A1F] border border-[#FF4D17]/40 shadow-[0_0_10px_rgba(255,77,23,0.2)]"
                      : "text-zinc-400 hover:text-white",
                  )}
                  title="Strukturierte Ordner-Ansicht nach Projekten und Kategorien"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-[#FF6A1F]" />
                  <span>Projekte</span>
                </button>
                <button
                  type="button"
                  aria-pressed={galleryViewMode === "grid"}
                  onClick={() => setGalleryViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer",
                    galleryViewMode === "grid"
                      ? "bg-[#FF4D17]/20 text-[#FF6A1F] border border-[#FF4D17]/40 shadow-[0_0_10px_rgba(255,77,23,0.2)]"
                      : "text-zinc-400 hover:text-white",
                  )}
                  title="Flaches Kachel-Raster aller Bilder"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Alle Bilder</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="gallery-category-filters" role="group" aria-label="Inhalte filtern">
              {[
                { id: "all", label: "Alle" },
                { id: "carousel", label: "Karussell" },
                { id: "ai-clone", label: "KI-Klon" },
                { id: "series", label: "Serie" },
                { id: "direct-prompt", label: "Direct-Prompt" },
                { id: "upload", label: "Uploads" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={categoryFilter === cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
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
            <div className="gallery-selection-bar">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-300">
                  <span className="font-bold text-orange-400">{selectedIds.length}</span> von {filteredImages.length} ausgewählt
                </span>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/15 shadow-sm cursor-pointer"
                  >
                    <Archive className="h-3.5 w-3.5 text-orange-400" />
                    Ausgewählte als ZIP ({selectedIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteBatch}
                    className="flex items-center gap-1.5 rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-destructive/30 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
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
              <h3 className="text-base font-bold text-white">{searchQuery || categoryFilter !== "all" ? "Keine passenden Bilder gefunden" : "Noch keine Bilder im Cloud-Ordner"}</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {searchQuery || categoryFilter !== "all"
                  ? "Keine Treffer für deine Suche."
                  : "Erzeuge ein Karussell, erstelle Visuals oder lade ein Bild hoch. Alles wird automatisch in deinem Cloud-Ordner gesichert und mit Supabase synchronisiert."}
              </p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" /> Erstes Bild ablegen
              </button>
            </div>
          )}

          {/* ── VIEW MODE 1: Ordner-Struktur (Projekte & Unterordner) ─ */}
          {filteredImages.length > 0 && galleryViewMode === "folders" && (
            <div className="space-y-6">
              {/* SECTION: Karussell-Projekte (carousels/) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-[#FF6A1F]" />
                    <h2 className="text-sm font-bold text-white tracking-wide">
                      Karussell-Projekte
                    </h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                      {Object.keys(folderTree.carousels).length} {Object.keys(folderTree.carousels).length === 1 ? "Projekt" : "Projekte"}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Alle Slides eines Karussells an einem Ort
                  </span>
                </div>

                {Object.keys(folderTree.carousels).length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-6 text-center text-xs text-zinc-500">
                    Noch keine Karussell-Projekte in diesem Ordner abgelegt.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(folderTree.carousels).map(([projectName, slides]) => {
                      const isExpanded = expandedProjects[projectName] !== false; // default open
                      const totalSizeMB = (slides.reduce((acc, s) => acc + s.sizeBytes, 0) / (1024 * 1024)).toFixed(1);
                      const latestSlide = slides[0];

                      return (
                        <div
                          key={projectName}
                          className="rounded-2xl border border-white/[0.08] bg-[#100E17]/90 backdrop-blur-xl overflow-hidden shadow-lg transition-all"
                        >
                          {/* Folder Header Row */}
                          <div
                            onClick={() => toggleProjectExpand(projectName)}
                            className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/[0.02] border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                className="text-zinc-400 hover:text-white p-0.5"
                                aria-label={isExpanded ? "Einklappen" : "Aufdecken"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-[#FF6A1F]" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                                )}
                              </button>
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shrink-0">
                                <Folder className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                                  <span>{prettyProjectName(projectName)}</span>
                                  <span className="text-[10px] font-normal text-zinc-500">
                                    ({slides.length} Slides · {totalSizeMB} MB)
                                  </span>
                                </h3>
                                {projectDate(projectName) && (
                                  <p className="text-[11px] text-zinc-500">{projectDate(projectName)}</p>
                                )}
                              </div>
                            </div>

                            {/* Project Folder Actions */}
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => toggleProjectExpand(projectName)}
                                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-zinc-400" />
                                <span>{isExpanded ? "Einklappen" : "Inhalte aufdecken"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleDownloadProjectZip(projectName, slides)}
                                disabled={isZipping}
                                className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/15 hover:bg-orange-500/25 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors cursor-pointer disabled:opacity-50"
                                title="Dieses Karussell-Projekt komplett als ZIP herunterladen"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                <span>Projekt als ZIP</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setScheduleModalItem({
                                    title: prettyProjectName(projectName),
                                    imageUrls: slides.map((s) => s.displayUrl || s.url).filter(Boolean),
                                    prompt: slides[0]?.prompt,
                                  });
                                }}
                                className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/25 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors cursor-pointer"
                                title="Dieses Karussell-Projekt im Beitrags-Planer terminieren"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Planen</span>
                              </button>

                              {onOpenHistory && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Try to match history entry by title
                                    const match = historyEntries.find(
                                      (h) => h.topic.toLowerCase().includes(projectName.toLowerCase()) ||
                                        projectName.toLowerCase().includes(h.topic.toLowerCase())
                                    );
                                    if (match) {
                                      onOpenHistory(match);
                                    } else if (slides[0]?.prompt && onUseInCarousel) {
                                      onUseInCarousel(slides[0].displayUrl || slides[0].url, slides[0].prompt);
                                    } else {
                                      toast.info(`Projekt „${projectName}“ geladen.`);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                                  title="Dieses Projekt im Karussell-Editor bearbeiten"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                                  <span>Im Editor öffnen</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Content: Reveal all slides in the folder */}
                          {isExpanded && (
                            <div className="p-4 bg-black/30">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {slides.map((slide, idx) => {
                                  const isSelected = selectedIds.includes(slide.id);
                                  return (
                                    <div
                                      key={slide.id}
                                      className={cn(
                                        "group relative flex flex-col overflow-hidden rounded-xl border bg-[#14111C] transition-all",
                                        isSelected
                                          ? "border-[#FF4D17] ring-1 ring-[#FF4D17]"
                                          : "border-white/[0.08] hover:border-orange-500/40"
                                      )}
                                    >
                                      {/* Slide Number Badge */}
                                      <div className="absolute top-2 left-2 z-10 rounded-md bg-black/80 border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                                        Slide {idx + 1}
                                      </div>

                                      {/* Selection Checkbox */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSelect(slide.id);
                                        }}
                                        className={cn(
                                          "absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all cursor-pointer",
                                          isSelected
                                            ? "border-[#FF4D17] bg-[#FF4D17] text-white"
                                            : "border-white/30 bg-black/60 text-transparent hover:border-white/60"
                                        )}
                                      >
                                        <Check className={cn("h-3 w-3 stroke-[3]", isSelected ? "text-white" : "opacity-0")} />
                                      </button>

                                      {/* Image Thumbnail */}
                                      <div
                                        className="relative aspect-[4/5] w-full overflow-hidden bg-black/50 cursor-pointer"
                                        onClick={() => setPreviewImage(slide)}
                                      >
                                        <img
                                          src={slide.displayUrl || slide.url}
                                          alt={slide.filename}
                                          loading="lazy"
                                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                          onError={(e) => {
                                            const proxy = `/api/cloud/file?key=${encodeURIComponent(slide.key)}`;
                                            if (e.currentTarget.src !== proxy) e.currentTarget.src = proxy;
                                          }}
                                        />

                                        {/* Hover Overlay */}
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 bg-black/70 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPreviewImage(slide);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-transform hover:scale-110"
                                            title="Großansicht"
                                          >
                                            <Maximize2 className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              void handleDownloadSingle(slide);
                                            }}
                                            className="p-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-transform hover:scale-110"
                                            title="Herunterladen"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Footer */}
                                      <div className="p-2 space-y-1">
                                        <p className="text-[10px] font-semibold text-zinc-300 truncate" title={slide.filename}>
                                          {slide.filename}
                                        </p>
                                        <p className="text-[9px] text-zinc-500 line-clamp-1" title={slide.prompt}>
                                          {slide.prompt}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: Serien (series/) */}
              {Object.keys(folderTree.series).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-400" />
                      <h2 className="text-sm font-bold text-white tracking-wide">
                        Deine Serien
                      </h2>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {Object.keys(folderTree.series).length} Serien
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.entries(folderTree.series).map(([projectName, slides]) => {
                      const totalSizeMB = (slides.reduce((acc, s) => acc + s.sizeBytes, 0) / (1024 * 1024)).toFixed(1);
                      const cover = slides[0];
                      const title = prettyProjectName(projectName);
                      const date = projectDate(projectName);

                      return (
                        <div
                          key={projectName}
                          className="gallery-project-card group"
                        >
                          {/* Cover-Bild */}
                          <div
                            className="gallery-project-cover"
                            role="button" tabIndex={0} aria-label={`Projekt ${title} ansehen`}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewerProject(projectName); } }}
                            onClick={() => setViewerProject(projectName)}
                          >
                            {cover && (
                              <img
                                src={cover.displayUrl || cover.url}
                                alt={title}
                                loading="lazy"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  const proxy = `/api/cloud/file?key=${encodeURIComponent(cover.key)}`;
                                  if (e.currentTarget.src !== proxy) e.currentTarget.src = proxy;
                                }}
                              />
                            )}
                            <div className="absolute top-2 left-2 rounded-md bg-black/70 border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                              {slides.length} Slides
                            </div>
                          </div>
                          <div className="gallery-project-meta">
                              <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 min-h-[2.5rem]">{title}</h3>
                              <p className="text-xs text-zinc-400 mt-2">
                                {date ? `${date} · ` : ""}{totalSizeMB} MB
                              </p>
                          </div>

                          {/* Aktionen */}
                          <div className="gallery-project-actions">
                            <button
                              type="button"
                              onClick={() => setViewerProject(projectName)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Ansehen</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setScheduleModalItem({
                                  title: title,
                                  imageUrls: slides.map((s) => s.displayUrl || s.url).filter(Boolean),
                                  prompt: slides[0]?.prompt,
                                });
                              }}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 px-2.5 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/25 transition-colors cursor-pointer"
                              title="Diese Serie im Beitrags-Planer terminieren"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Planen</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadProjectZip(projectName, slides)}
                              disabled={isZipping}
                              aria-label={`Projekt ${title} als ZIP herunterladen`}
                              className="gallery-button gallery-secondary gallery-icon-button"
                            >
                              {isZipping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Serien-Viewer: öffnet alle Slides als Overlay, ohne die Grid-Karten zu verziehen */}
                  {viewerProject && folderTree.series[viewerProject] && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                      onClick={() => setViewerProject(null)}
                    >
                      <div
                        className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#100E17] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#100E17]/95 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-white truncate">
                              {prettyProjectName(viewerProject)}
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                              {folderTree.series[viewerProject]!.length} Slides
                              {projectDate(viewerProject) ? ` · ${projectDate(viewerProject)}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDownloadProjectZip(viewerProject, folderTree.series[viewerProject]!)}
                              disabled={isZipping}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/25 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isZipping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              <span>ZIP</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewerProject(null)}
                              className="rounded-lg bg-white/5 p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              aria-label="Schließen"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-5">
                          {folderTree.series[viewerProject]!.map((slide) => {
                            const isSelected = selectedIds.includes(slide.id);
                            return (
                              <div
                                key={slide.id}
                                className={cn(
                                  "group/slide relative overflow-hidden rounded-lg border bg-[#14111C] transition-all",
                                  isSelected
                                    ? "border-blue-500 ring-1 ring-blue-500"
                                    : "border-white/[0.08] hover:border-white/20"
                                )}
                              >
                                <div
                                  className="relative aspect-square w-full cursor-pointer bg-black/40 overflow-hidden"
                                  onClick={() => toggleSelect(slide.id)}
                                >
                                  <img
                                    src={slide.displayUrl || slide.url}
                                    alt={slide.filename}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover/slide:scale-105"
                                    loading="lazy"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                      <div className="rounded-full bg-blue-500 p-1 shadow-lg shadow-black/50">
                                        <Check className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  )}
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/slide:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadSingle(slide);
                                      }}
                                      className="rounded-md bg-black/70 p-1.5 text-white hover:bg-black backdrop-blur-md border border-white/10"
                                      title="Herunterladen"
                                    >
                                      <Download className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: KI-Klone (clones/) */}
              {Object.keys(folderTree.clones).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-400" />
                      <h2 className="text-sm font-bold text-white tracking-wide">
                        Unterordner: <span className="text-purple-400">clones/</span>
                      </h2>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {Object.keys(folderTree.clones).length} Klone
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Object.entries(folderTree.clones).flatMap(([cloneName, imgs]) =>
                      imgs.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setPreviewImage(img)}
                          className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#14111C] hover:border-purple-500/40 transition-all cursor-pointer"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-black/50">
                            <img
                              src={img.displayUrl || img.url}
                              alt={img.filename}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                const proxy = `/api/cloud/file?key=${encodeURIComponent(img.key)}`;
                                if (e.currentTarget.src !== proxy) e.currentTarget.src = proxy;
                              }}
                            />
                            <div className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300">
                              {cloneName}
                            </div>
                          </div>
                          <div className="p-2 text-[10px] font-medium text-zinc-300 truncate">
                            {img.prompt}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: Einzelbilder & Galerie (gallery/) */}
              {folderTree.gallery.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white tracking-wide">
                        Unterordner: <span className="text-emerald-400">gallery/</span>
                      </h2>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {folderTree.gallery.length} Einzelbilder
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {folderTree.gallery.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setPreviewImage(img)}
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#14111C] hover:border-emerald-500/40 transition-all cursor-pointer"
                      >
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/50">
                          <img
                            src={img.displayUrl || img.url}
                            alt={img.filename}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const proxy = `/api/cloud/file?key=${encodeURIComponent(img.key)}`;
                              if (e.currentTarget.src !== proxy) e.currentTarget.src = proxy;
                            }}
                          />
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="text-[10px] font-semibold text-zinc-300 truncate">{img.filename}</p>
                          <p className="text-[9px] text-zinc-500 line-clamp-1">{img.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VIEW MODE 2: Kachel-Raster (Flache Übersicht) ──────── */}
          {filteredImages.length > 0 && galleryViewMode === "grid" && (
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
                        "absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer",
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
                        src={img.displayUrl || img.url}
                        alt={img.filename}
                        loading="lazy"
                        onError={(e) => {
                          const proxy = `/api/cloud/file?key=${encodeURIComponent(img.key)}`;
                          if (e.currentTarget.src !== proxy) {
                            e.currentTarget.src = proxy;
                          }
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Hover Overlay with Action Buttons */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 bg-black/75 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
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
                            setScheduleModalItem({
                              title: img.prompt || img.filename,
                              imageUrls: [img.displayUrl || img.url],
                              prompt: img.prompt,
                            });
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/20 text-orange-300 hover:bg-orange-500/40 hover:text-white transition-transform hover:scale-110 shadow-[0_0_15px_rgba(255,77,23,0.3)]"
                          title="Im Planer terminieren"
                        >
                          <Calendar className="h-4 w-4" />
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
                  src={previewImage.displayUrl || previewImage.url}
                  alt={previewImage.filename}
                  onError={(e) => {
                    const proxy = `/api/cloud/file?key=${encodeURIComponent(previewImage.key)}`;
                    if (e.currentTarget.src !== proxy) {
                      e.currentTarget.src = proxy;
                    }
                  }}
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

                  <button
                    type="button"
                    onClick={() => {
                      setScheduleModalItem({
                        title: previewImage.prompt || previewImage.filename,
                        imageUrls: [previewImage.displayUrl || previewImage.url],
                        prompt: previewImage.prompt,
                      });
                    }}
                    className="flex-1 rounded-xl border border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/25 px-3 py-2 text-xs font-semibold text-orange-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Dieses Bild im Beitrags-Planer terminieren"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Planen</span>
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

      {/* ── Sexy Planen & Scheduling Dialog ────────────────────────── */}
      <GalleryScheduleModal
        isOpen={Boolean(scheduleModalItem)}
        onClose={() => setScheduleModalItem(null)}
        item={scheduleModalItem}
        onNavigateToScheduler={onNavigateToScheduler}
        settings={settings}
        currentUser={currentUser}
      />
    </div>
  );
}
