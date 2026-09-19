import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Flame,
  Image as ImageIcon,
  Layers,
  Maximize2,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Compass,
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
  "Editorial",
  "Minimalist",
  "Dark / Moody",
  "3D Render",
  "Business",
] as const;

type Category = (typeof CATEGORIES)[number];

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
    toast.info("Lade neueste kuratierte Stile…");
    try {
      const liveItems = await fetchLiveBananaPrompts(60, 0);
      if (liveItems.length > 0) {
        setPrompts((prev) => {
          const map = new Map<string, BananaPromptItem>();
          for (const item of liveItems) map.set(item.id, item);
          for (const item of prev) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          return Array.from(map.values());
        });
        toast.success(`${liveItems.length} Stile synchronisiert! ✨`);
      } else {
        toast.info("Stilbibliothek ist bereits auf dem neuesten Stand.");
      }
    } catch {
      toast.error("Fehler beim Abrufen der Live-Vorlagen.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter logic
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    if (selectedCategory !== "Alle") {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        p.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        p.prompt.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.prompt.toLowerCase().includes(query) ||
          p.creatorName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [prompts, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Baustein 7 · Stilbibliothek & Ideen
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Kuratierte Stile & Vorlagen
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Über 220 kuratierte Bildstile mit 1-Klick-Übernahme direkt ins Karussell- oder Einzelbild-Studio.
          </p>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={handleLiveSync}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-[#FF4D17]", isRefreshing && "animate-spin")} />
          <span>{isRefreshing ? "Aktualisiere…" : "Stile synchronisieren"}</span>
        </button>
      </div>

      {/* ── Filter-Tabs & Suche ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Kategorien */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                  isSel
                    ? "bg-[#FF4D17] text-white border-[#FF4D17] shadow-sm"
                    : "border-white/[0.06] bg-black/40 text-zinc-400 hover:text-white hover:bg-white/[0.04]",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Suchfeld */}
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Stil oder Stichwort suchen…"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Visual Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPrompts.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <div
              key={item.id}
              className="group rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div
                onClick={() => setActiveModalPrompt(item)}
                className="relative aspect-[4/5] bg-black/80 overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Persona-Tauglichkeits-Badge (PDF Kap 7.5) */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Persona-tauglich</span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModalPrompt(item);
                    }}
                    className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-transform hover:scale-110"
                    title="Details ansehen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#FF4D17] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                  {onUseInCarousel && (
                    <button
                      type="button"
                      onClick={() => onUseInCarousel(item.prompt, item.title)}
                      className="py-1.5 px-3 rounded-xl bg-[#FF4D17]/15 hover:bg-[#FF4D17]/25 text-[#FF4D17] text-xs font-bold transition-colors cursor-pointer flex-1 flex items-center justify-center gap-1"
                      title="Im Karussell-Studio als Stil laden"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Karussell</span>
                    </button>
                  )}

                  {onUseInDirectPrompt && (
                    <button
                      type="button"
                      onClick={() => onUseInDirectPrompt(item.prompt)}
                      className="py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold transition-colors cursor-pointer flex-1 flex items-center justify-center gap-1"
                      title="Als Einzelbild generieren"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                      <span>Einzelbild</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleCopy(item, e)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Prompt kopieren"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────── */}
      {activeModalPrompt && (
        <div
          onClick={() => setActiveModalPrompt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#0C0910] border border-white/15 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white">{activeModalPrompt.title}</h3>
                <p className="text-xs text-zinc-400">Kuratierte Prompt-Vorlage</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalPrompt(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-black">
                <img
                  src={activeModalPrompt.image}
                  alt={activeModalPrompt.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Vollständiger Prompt:
                  </span>
                  <p className="text-xs text-zinc-300 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                    {activeModalPrompt.prompt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeModalPrompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-zinc-400 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {onUseInCarousel && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseInCarousel(activeModalPrompt.prompt, activeModalPrompt.title);
                        setActiveModalPrompt(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FF4D17] hover:brightness-110 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Im Karussell-Studio verwenden</span>
                    </button>
                  )}

                  {onUseInDirectPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseInDirectPrompt(activeModalPrompt.prompt);
                        setActiveModalPrompt(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <ImageIcon className="h-4 w-4 text-blue-400" />
                      <span>Als Einzelbild öffnen</span>
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
