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
  Upload,
  Trash2,
  Plus,
  Radio,
  Clock,
  ShieldCheck,
  Link as LinkIcon,
  FileAudio,
} from "lucide-react";
import { TIKTOK_MUSIC_LIBRARY, type TikTokSoundItem } from "../data/tiktok-sounds";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CustomSoundItem extends TikTokSoundItem {
  isCustom?: boolean;
  audioData?: string;
}

interface TikTokMusicLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSound: TikTokSoundItem | null;
  onSelectSound: (sound: TikTokSoundItem | null) => void;
}

const CATEGORIES = [
  { id: "all", label: "Alle Sounds" },
  { id: "custom", label: "💾 Meine MP3s" },
  { id: "trending", label: "🔥 Trending" },
  { id: "business", label: "💼 Business" },
  { id: "lofi", label: "☕ Lo-Fi" },
  { id: "upbeat", label: "⚡ Upbeat" },
  { id: "synthwave", label: "🌌 Synthwave" },
  { id: "acoustic", label: "🎸 Acoustic" },
];

const LOCAL_STORAGE_KEY = "socialcraft_custom_mp3_library";

export function TikTokMusicLibraryModal({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
}: TikTokMusicLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [customSounds, setCustomSounds] = useState<CustomSoundItem[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<any[]>([]);
  const synthTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load custom sounds from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomSounds(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save custom sounds to LocalStorage
  const saveCustomSounds = (updated: CustomSoundItem[]) => {
    setCustomSounds(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Quota exceeded fallback
    }
  };

  const stopAllAudio = () => {
    // 1. Stop standard HTML Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // 2. Stop Web Audio Synth
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    synthNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {}
    });
    synthNodesRef.current = [];

    if (synthCtxRef.current && synthCtxRef.current.state !== "closed") {
      synthCtxRef.current.close().catch(() => {});
      synthCtxRef.current = null;
    }

    setPlayingId(null);
  };

  // Stop audio on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
    }
  }, [isOpen]);

  // Fallback Harmonic Web Audio Synthesizer (Zero network required)
  const playWebAudioSynthFallback = (category: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      synthCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Chords per category
      const chordPitches: Record<string, number[]> = {
        trending: [220, 277.18, 329.63, 440], // A Major / Tech
        business: [261.63, 329.63, 392.0, 523.25], // C Major / Uplifting
        lofi: [174.61, 220.0, 261.63, 329.63], // F Maj7 / Chill
        synthwave: [146.83, 220.0, 261.63, 293.66], // D Minor 80s
        upbeat: [293.66, 369.99, 440.0, 587.33], // D Major / Energy
        acoustic: [196.0, 246.94, 293.66, 392.0], // G Major / Warm
      };

      const baseNotes = chordPitches[category] || chordPitches["trending"] || [220, 277.18, 329.63, 440];
      let step = 0;

      const playStep = () => {
        if (!synthCtxRef.current || synthCtxRef.current.state === "closed") return;
        const noteFreq = baseNotes[step % baseNotes.length];
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = category === "synthwave" ? "sawtooth" : category === "lofi" ? "sine" : "triangle";
        osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);

        noteGain.gain.setValueAtTime(0.18, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.48);

        synthNodesRef.current.push(osc);
        step++;
      };

      playStep();
      synthTimerRef.current = setInterval(playStep, 300);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleTogglePlay = (sound: TikTokSoundItem) => {
    if (playingId === sound.id) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    setPlayingId(sound.id);

    // If it's a custom sound with audio data or valid URL
    if (sound.previewUrl) {
      try {
        const audio = new Audio(sound.previewUrl);
        audio.volume = 0.85;
        audio.onended = () => stopAllAudio();
        audio.onerror = () => {
          // If remote fails, fallback smoothly to Web Audio synthesizer
          playWebAudioSynthFallback(sound.category || "trending");
        };
        audio.play().catch(() => {
          playWebAudioSynthFallback(sound.category || "trending");
        });
        audioRef.current = audio;
      } catch {
        playWebAudioSynthFallback(sound.category || "trending");
      }
    } else {
      playWebAudioSynthFallback(sound.category || "trending");
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
    stopAllAudio();
    onClose();
  };

  // Handle Custom File Upload (.mp3, .wav, .m4a, etc.)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Audio-Datei ist zu groß (max. 25 MB).");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      // Measure audio duration
      const tempAudio = new Audio(dataUrl);
      tempAudio.onloadedmetadata = () => {
        const totalSec = Math.round(tempAudio.duration || 30);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const durStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

        const newSound: CustomSoundItem = {
          id: `custom-sound-${Date.now()}`,
          title: cleanName,
          artist: "Eigener Upload",
          duration: durStr,
          category: "trending",
          categoryLabel: "💾 Eigene MP3",
          previewUrl: dataUrl,
          commercialApproved: true,
          plays: "Lokal",
          tag: "💾 MP3",
          isCustom: true,
          audioData: dataUrl,
        };

        const updated = [newSound, ...customSounds];
        saveCustomSounds(updated);
        setIsUploading(false);
        setActiveCategory("custom");
        toast.success(`MP3 „${cleanName}“ erfolgreich hinterlegt! 🎉`);
      };

      tempAudio.onerror = () => {
        const newSound: CustomSoundItem = {
          id: `custom-sound-${Date.now()}`,
          title: cleanName,
          artist: "Eigener Upload",
          duration: "0:30",
          category: "trending",
          categoryLabel: "💾 Eigene MP3",
          previewUrl: dataUrl,
          commercialApproved: true,
          plays: "Lokal",
          tag: "💾 MP3",
          isCustom: true,
          audioData: dataUrl,
        };
        const updated = [newSound, ...customSounds];
        saveCustomSounds(updated);
        setIsUploading(false);
        setActiveCategory("custom");
        toast.success(`MP3 „${cleanName}“ hinzugefügt! 🎉`);
      };
    };

    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Fehler beim Einlesen der Audiodatei.");
    };

    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  // Handle Custom MP3 URL
  const handleAddUrlSound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    const title = customTitleInput.trim() || "Eigener Web-Sound";
    const newSound: CustomSoundItem = {
      id: `custom-url-${Date.now()}`,
      title,
      artist: "Web Audio Stream",
      duration: "0:30",
      category: "trending",
      categoryLabel: "💾 Eigene MP3",
      previewUrl: customUrlInput.trim(),
      commercialApproved: true,
      plays: "Web Stream",
      tag: "🌐 URL",
      isCustom: true,
    };

    const updated = [newSound, ...customSounds];
    saveCustomSounds(updated);
    setCustomUrlInput("");
    setCustomTitleInput("");
    setShowUrlInput(false);
    setActiveCategory("custom");
    toast.success(`Sound „${title}“ per URL hinterlegt! 🎵`);
  };

  // Delete custom sound
  const handleDeleteCustomSound = (id: string) => {
    const updated = customSounds.filter((s) => s.id !== id);
    saveCustomSounds(updated);
    if (selectedSound?.id === id) {
      onSelectSound(null);
    }
    if (playingId === id) {
      stopAllAudio();
    }
    toast.info("Eigene MP3 entfernt.");
  };

  // Combine Library Sounds + Custom Sounds
  const allAvailableSounds: CustomSoundItem[] = [...customSounds, ...TIKTOK_MUSIC_LIBRARY];

  const filteredSounds = allAvailableSounds.filter((s) => {
    const matchesCat =
      activeCategory === "all"
        ? true
        : activeCategory === "custom"
        ? s.isCustom
        : !s.isCustom && s.category === activeCategory;

    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F0D15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 text-white flex flex-col max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={() => {
            stopAllAudio();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Music className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              TikTok Music & Eigene MP3s
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {customSounds.length} Eigene • {TIKTOK_MUSIC_LIBRARY.length} Commercial
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Lade eigene MP3s hoch oder wähle aus kommerziell freigegebenen TikTok-Trendsounds.
          </p>
        </div>

        {/* Action Bar: Upload File & URL Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/*"
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 min-w-[150px] py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? "Lade hoch..." : "Eigene MP3 hochladen"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput((p) => !p)}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>MP3-URL</span>
          </button>
        </div>

        {/* Inline URL Input Form */}
        {showUrlInput && (
          <form onSubmit={handleAddUrlSound} className="p-3 mb-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={customTitleInput}
                onChange={(e) => setCustomTitleInput(e.target.value)}
                placeholder="Sound-Titel (z. B. Mein Brand Jingle)"
                className="bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="url"
                required
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://meine-domain.de/sound.mp3"
                className="bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-lg hover:bg-cyan-400 cursor-pointer"
              >
                URL speichern
              </button>
            </div>
          </form>
        )}

        {/* Search & Category Filter */}
        <div className="space-y-2.5 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Sound, MP3 oder Genre suchen..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((c) => {
              const count =
                c.id === "custom"
                  ? customSounds.length
                  : c.id === "all"
                  ? allAvailableSounds.length
                  : TIKTOK_MUSIC_LIBRARY.filter((s) => s.category === c.id).length;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5",
                    activeCategory === c.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
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
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0",
                          sound.isCustom
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                        )}>
                          {sound.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="truncate">{sound.artist}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{sound.duration}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{sound.plays}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Delete Custom or Select Sound */}
                <div className="flex items-center gap-2 shrink-0">
                  {sound.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSound(sound.id)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
                      title="Eigene MP3 löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

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
            <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
              <p>Keine passenden Sounds gefunden.</p>
              {activeCategory === "custom" && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-cyan-400 underline cursor-pointer"
                >
                  Jetzt erste MP3 hochladen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info & Remove Selection */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Eigene MP3s & lizenzfreie Commercial Sounds für TikTok-Posts & Ads.</span>
          </div>

          {selectedSound && (
            <button
              type="button"
              onClick={() => {
                onSelectSound(null);
                toast.info("TikTok Sound entfernt.");
                stopAllAudio();
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
