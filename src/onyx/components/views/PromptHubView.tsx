import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Flame,
  Image as ImageIcon,
  Layers,
  Loader2,
  Maximize2,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BANANA_PROMPTS_DATA,
  fetchLiveBananaPrompts,
  type BananaPromptItem,
} from "@/onyx/data/banana-prompts";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Alle",
  "Cinematic",
  "Portrait",
  "Photography",
  "Realistic",
  "Fashion",
  "Modern",
  "Business",
  "Corporate",
  "Fantasy",
  "Minimalist",
  "Dark / Moody",
  "3D Render",
  "Retro / Vintage",
] as const;

type Category = (typeof CATEGORIES)[number];
type SortOption = "popular" | "recent" | "title";

interface PromptHubViewProps {
  onUseInCarousel?: (prompt: string, title: string) => void;
  onUseInDirectPrompt?: (prompt: string) => void;
}

export function PromptHubView({
  onUseInCarousel,
  onUseInDirectPrompt,
}: PromptHubViewProps) {
  const [prompts, setPrompts] = useState<BananaPromptItem[]>(BANANA_PROMPTS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalPrompt, setActiveModalPrompt] = useState<BananaPromptItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Copy handler with visual feedback
  const handleCopy = (item: BananaPromptItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    void navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    toast.success("Prompt in die Zwischenablage kopiert!", {
      description: item.title,
    });
    setTimeout(() => {
      setCopiedId((curr) => (curr === item.id ? null : curr));
    }, 2000);
  };

  // Live refresh from Banana Prompts API
  const handleLiveSync = async () => {
    setIsRefreshing(true);
    toast.info("Lade neueste Prompts von bananaprompts.xyz…");
    try {
      const liveItems = await fetchLiveBananaPrompts(100, 0);
      if (liveItems.length > 0) {
        // Merge with existing
        setPrompts((prev) => {
          const map = new Map<string, BananaPromptItem>();
          for (const item of liveItems) map.set(item.id, item);
          for (const item of prev) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          return Array.from(map.values());
        });
        toast.success(`${liveItems.length} Prompts von bananaprompts.xyz synchronisiert!`);
      } else {
        toast.info("Keine neuen Prompts gefunden — Lokale Bibliothek aktuell.");
      }
    } catch {
      toast.error("Fehler beim Abrufen der Live-Prompts.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter & sort logic
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    // Filter by Category
    if (selectedCategory !== "Alle") {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        p.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        p.prompt.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        p.prompt.toLowerCase().includes(query) ||
        p.creatorName.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortOption === "popular") return b.likes - a.likes;
      if (sortOption === "title") return a.title.localeCompare(b.title);
      return 0; // default order
    });
  }, [prompts, selectedCategory, searchQuery, sortOption]);

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="cryptox-card relative overflow-hidden space-y-5 p-6 sm:p-7 border border-white/[0.08]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 shadow-[0_0_15px_-4px_rgba(255,77,23,0.5)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Prompt Hub
              </h1>
              <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-0.5 text-xs font-semibold text-orange-400">
                {prompts.length} Prompts
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Kuratierte AI-Art- & Bild-Prompts. Filtere nach Look & Stil, kopiere Prompts oder übertrage sie direkt in deine Slide-Generierung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleLiveSync}
              disabled={isRefreshing}
              className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold"
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Live aktualisieren</span>
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ────────────────────────── */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Thema, Stil, Model, Creator…"
              className="w-full rounded-xl border border-white/[0.1] bg-[#0E0C13]/80 py-2 pl-9 pr-8 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-orange-500/60 focus:bg-[#14121a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
                aria-label="Suche zurücksetzen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-zinc-400">Sortierung:</span>
            <div className="flex rounded-xl border border-white/[0.1] bg-white/[0.02] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSortOption("popular")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  sortOption === "popular"
                    ? "bg-orange-500/20 text-orange-400 font-semibold shadow-[0_0_12px_-4px_rgba(255,77,23,0.5)]"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Flame className="h-3.5 w-3.5" /> Beliebt
              </button>
              <button
                type="button"
                onClick={() => setSortOption("title")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  sortOption === "title"
                    ? "bg-orange-500/20 text-orange-400 font-semibold shadow-[0_0_12px_-4px_rgba(255,77,23,0.5)]"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                A–Z
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 pt-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1 text-xs font-medium transition-all",
                selectedCategory === cat
                  ? "border-orange-500/80 bg-orange-500/15 text-orange-400 font-semibold shadow-[0_0_15px_-4px_rgba(255,77,23,0.4)]"
                  : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Info ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          {filteredPrompts.length} {filteredPrompts.length === 1 ? "Prompt" : "Prompts"} gefunden
          {selectedCategory !== "Alle" && ` in „${selectedCategory}“`}
          {searchQuery && ` für „${searchQuery}“`}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Alle");
            }}
            className="text-primary-bright hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* ── Prompt Cards Grid ──────────────────────────────────── */}
      {filteredPrompts.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">Keine passenden Prompts gefunden</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Versuche einen anderen Suchbegriff oder wechsle zur Kategorie „Alle“.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Alle");
            }}
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/[0.05]"
          >
            Alle anzeigen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPrompts.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveModalPrompt(item)}
                className="glass-card group relative flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1.5"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/50">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/[0.02] text-zinc-600">
                      <ImageIcon className="h-8 w-8 opacity-40" />
                    </div>
                  )}

                  {/* Gradient shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C13] via-black/30 to-transparent" />

                  {/* Top Badges: Model & Likes */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="rounded-full border border-white/[0.1] bg-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-200 backdrop-blur-md">
                      {item.model}
                    </span>
                    <span className="rounded-full border border-white/[0.1] bg-black/75 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                    </span>
                  </div>

                  {/* View Details Icon on Hover */}
                  <div className="absolute right-3 bottom-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.15] bg-black/80 text-white backdrop-blur-md shadow-[0_0_15px_rgba(255,77,23,0.3)]">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="flex flex-1 flex-col p-4 space-y-2.5">
                  {/* Title & Creator */}
                  <div>
                    <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      von <span className="text-zinc-200 font-medium">{item.creatorName}</span>
                    </p>
                  </div>

                  {/* Prompt Text Preview */}
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed flex-1">
                    {item.prompt}
                  </p>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div
                    className="pt-2 border-t border-white/[0.08] flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item, e)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-1.5 px-2 text-xs font-semibold transition-all",
                        isCopied
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                          : "border-white/[0.1] bg-white/[0.03] text-zinc-200 hover:bg-orange-500/10 hover:border-orange-500/40 hover:text-white",
                      )}
                      title="Prompt in die Zwischenablage kopieren"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Kopiert</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Kopieren</span>
                        </>
                      )}
                    </button>

                    {/* Use in Carousel Button */}
                    {onUseInCarousel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseInCarousel(item.prompt, item.title);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-zinc-400 transition-colors hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50"
                        title="In Karussell übernehmen"
                        aria-label="In Karussell übernehmen"
                      >
                        <Layers className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Use in Direct Prompt Button */}
                    {onUseInDirectPrompt && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseInDirectPrompt(item.prompt);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-zinc-400 transition-colors hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50"
                        title="In Einzelbild übernehmen"
                        aria-label="In Einzelbild übernehmen"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Prompt Detail / Preview Modal ───────────────────────── */}
      {activeModalPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveModalPrompt(null)}
        >
          <div
            className="cryptox-card-elevated relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setActiveModalPrompt(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-black/70 text-zinc-400 backdrop-blur-md transition-colors hover:text-white hover:bg-white/[0.1]"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left side: Preview Image */}
            <div className="relative aspect-square w-full bg-black/40 md:aspect-auto md:w-1/2 overflow-hidden">
              {activeModalPrompt.image ? (
                <img
                  src={activeModalPrompt.image}
                  alt={activeModalPrompt.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Right side: Prompt Content & Actions */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-0.5 text-xs font-semibold text-orange-400">
                    {activeModalPrompt.model}
                  </span>
                  <span className="text-xs text-zinc-400">
                    von <strong className="text-white">{activeModalPrompt.creatorName}</strong>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{activeModalPrompt.title}</h2>
              </div>

              {/* Tags */}
              {activeModalPrompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeModalPrompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-xs text-zinc-400"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Full Prompt Text Block */}
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Vollständiger Prompt
                </label>
                <div className="relative rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-200 select-text whitespace-pre-wrap font-mono">
                    {activeModalPrompt.prompt}
                  </p>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => handleCopy(activeModalPrompt)}
                  className="cryptox-orange-btn w-full !py-2.5 text-xs font-semibold"
                >
                  {copiedId === activeModalPrompt.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>In Zwischenablage kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Prompt kopieren</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {onUseInCarousel && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseInCarousel(activeModalPrompt.prompt, activeModalPrompt.title);
                        setActiveModalPrompt(null);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <Layers className="h-3.5 w-3.5 text-orange-400" />
                      <span>In Karussell</span>
                    </button>
                  )}

                  {onUseInDirectPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseInDirectPrompt(activeModalPrompt.prompt);
                        setActiveModalPrompt(null);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-orange-400" />
                      <span>In Einzelbild</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
