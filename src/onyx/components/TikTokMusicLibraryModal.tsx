import React, { useState, useRef, useEffect } from "react";
import {
  Music,
  Play,
  Pause,
  Search,
  Check,
  Sparkles,
  Volume2,
  X,
  ExternalLink,
  Flame,
  Radio,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { TIKTOK_MUSIC_LIBRARY, type TikTokSoundItem } from "../data/tiktok-sounds";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TikTokMusicLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSound: TikTokSoundItem | null;
  onSelectSound: (sound: TikTokSoundItem | null) => void;
}

const CATEGORIES = [
  { id: "all", label: "Alle Sounds" },
  { id: "trending", label: "🔥 Trending" },
  { id: "business", label: "💼 Business" },
  { id: "lofi", label: "☕ Lo-Fi" },
  { id: "upbeat", label: "⚡ Upbeat" },
  { id: "synthwave", label: "🌌 Synthwave" },
  { id: "acoustic", label: "🎸 Acoustic" },
];

export function TikTokMusicLibraryModal({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
}: TikTokMusicLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = (sound: TikTokSoundItem) => {
    if (playingId === sound.id) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      // Play new track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(sound.previewUrl);
      audio.volume = 0.8;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        toast.error("Audio-Vorschau konnte nicht abgespielt werden.");
        setPlayingId(null);
      };
      audio.play().catch(() => {
        toast.info("Klicke erneut zum Abspielen (Browser-Autoplay).");
        setPlayingId(null);
      });
      audioRef.current = audio;
      setPlayingId(sound.id);
    }
  };

  const handlePickSound = (sound: TikTokSoundItem) => {
    if (selectedSound?.id === sound.id) {
      onSelectSound(null);
      toast.info("TikTok Sound entfernt.");
    } else {
      onSelectSound(sound);
      toast.success(`Sound „${sound.title}“ für TikTok ausgewählt! 🎵`);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingId(null);
    onClose();
  };

  const filteredSounds = TIKTOK_MUSIC_LIBRARY.filter((s) => {
    const matchesCat = activeCategory === "all" || s.category === activeCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F0D15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 text-white flex flex-col max-h-[88vh]">
        {/* Close button */}
        <button
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Music className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              TikTok Commercial Music Library
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Lizenzfrei & Monetarisierbar
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Wähle aus kommerziell freigegebenen TikTok-Trendsounds oder lasse die Socialcraft Engine passende Musik automatisch hinterlegen.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Sound, Künstler oder Genre suchen..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer",
                  activeCategory === c.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[260px]">
          {filteredSounds.map((sound) => {
            const isPlaying = playingId === sound.id;
            const isSelected = selectedSound?.id === sound.id;

            return (
              <div
                key={sound.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200",
                  isSelected
                    ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePlay(sound)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md",
                      isPlaying
                        ? "bg-cyan-500 text-black shadow-cyan-500/40 animate-pulse"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isPlaying ? "Pausieren" : "Vorschau abspielen"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  {/* Sound Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{sound.title}</h4>
                      {sound.tag && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                          {sound.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="truncate">{sound.artist}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{sound.duration}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{sound.plays} Aufrufe</span>
                    </div>
                  </div>
                </div>

                {/* Select / Active Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePickSound(sound)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer",
                      isSelected
                        ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                        : "bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Aktiv</span>
                      </>
                    ) : (
                      <span>Auswählen</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSounds.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Keine passenden Sounds gefunden für „{searchQuery}“.
            </div>
          )}
        </div>

        {/* Footer info & Remove Selection */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alle Tracks sind 100% kommerziell für TikTok-Werbung & Creator-Posts freigegeben.</span>
          </div>

          {selectedSound && (
            <button
              type="button"
              onClick={() => {
                onSelectSound(null);
                toast.info("TikTok Sound entfernt.");
                if (audioRef.current) audioRef.current.pause();
                onClose();
              }}
              className="text-xs text-red-400 hover:underline cursor-pointer"
            >
              Sound abwählen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
