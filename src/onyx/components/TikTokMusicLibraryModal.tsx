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
  CheckCircle2,
  ArrowRight,
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

  // Staged selection inside the modal
  const [activeSelection, setActiveSelection] = useState<TikTokSoundItem | null>(selectedSound);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<any[]>([]);
  const synthTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize internal selection whenever modal opens or parent changes
  useEffect(() => {
    if (isOpen) {
      setActiveSelection(selectedSound);
    }
  }, [isOpen, selectedSound]);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

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

  // Fallback Harmonic Web Audio Synthesizer
  const playWebAudioSynthFallback = (category: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      synthCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const chordPitches: Record<string, number[]> = {
        trending: [220, 277.18, 329.63, 440],
        business: [261.63, 329.63, 392.0, 523.25],
        lofi: [174.61, 220.0, 261.63, 329.63],
        synthwave: [146.83, 220.0, 261.63, 293.66],
        upbeat: [293.66, 369.99, 440.0, 587.33],
        acoustic: [196.0, 246.94, 293.66, 392.0],
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

    if (sound.previewUrl) {
      try {
        const audio = new Audio(sound.previewUrl);
        audio.volume = 0.85;
        audio.onended = () => stopAllAudio();
        audio.onerror = () => {
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

  // Toggle selection inside modal
  const handleSelectSoundItem = (sound: TikTokSoundItem) => {
    if (activeSelection?.id === sound.id) {
      setActiveSelection(null);
    } else {
      setActiveSelection(sound);
    }
  };

  // Confirm final selection & close
  const handleConfirmSelection = (soundToApply: TikTokSoundItem | null) => {
    onSelectSound(soundToApply);
    if (soundToApply) {
      toast.success(`Sound „${soundToApply.title}“ für Beitrag übernommen! 🎵`);
    } else {
      toast.info("Audio-Track entfernt.");
    }
    stopAllAudio();
    onClose();
  };

  // Handle Custom File Upload
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
        setActiveSelection(newSound);
        toast.success(`MP3 „${cleanName}“ hochgeladen & ausgewählt! 🎉`);
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
        setActiveSelection(newSound);
        toast.success(`MP3 „${cleanName}“ hinzugefügt & ausgewählt! 🎉`);
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
    setActiveSelection(newSound);
    toast.success(`Sound „${title}“ per URL hinterlegt & ausgewählt! 🎵`);
  };

  // Delete custom sound
  const handleDeleteCustomSound = (id: string) => {
    const updated = customSounds.filter((s) => s.id !== id);
    saveCustomSounds(updated);
    if (activeSelection?.id === id) {
      setActiveSelection(null);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F0D15] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Music className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Audio & Musik-Bibliothek
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {customSounds.length} Eigene • {TIKTOK_MUSIC_LIBRARY.length} Commercial
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Eigene MP3s hochladen oder lizenzfreie TikTok- & Social-Sounds auswählen.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Upload File & URL Buttons */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
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
              className="flex-1 min-w-[150px] py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? "Lade Audio hoch..." : "Eigene MP3 hochladen"}</span>
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
            <form onSubmit={handleAddUrlSound} className="mt-3 p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="Sound-Titel (z. B. Brand Jingle)"
                  className="bg-[#120F17] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="url"
                  required
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://domain.de/sound.mp3"
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
          <div className="space-y-2.5 mt-3">
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
                    type="button"
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
        </div>

        {/* Sound List Container */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-2 space-y-2 pr-2 min-h-[220px]">
          {filteredSounds.map((sound) => {
            const isPlaying = playingId === sound.id;
            const isSelected = activeSelection?.id === sound.id;

            return (
              <div
                key={sound.id}
                onClick={() => handleSelectSoundItem(sound)}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer group",
                  isSelected
                    ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500"
                    : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePlay(sound);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md",
                      isPlaying
                        ? "bg-cyan-400 text-black shadow-cyan-400/50 animate-pulse"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isPlaying ? "Pausieren" : "Vorschau abspielen"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Sound Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "text-xs font-bold truncate transition-colors",
                        isSelected ? "text-cyan-300" : "text-white group-hover:text-cyan-200"
                      )}>
                        {sound.title}
                      </h4>
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

                {/* Right Selection Control */}
                <div className="flex items-center gap-2 shrink-0">
                  {sound.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomSound(sound.id);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
                      title="Eigene MP3 löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition",
                      isSelected
                        ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                        : "bg-white/5 group-hover:bg-white/15 text-zinc-300 group-hover:text-white border border-white/10"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Gewählt</span>
                      </>
                    ) : (
                      <span>Auswählen</span>
                    )}
                  </div>
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

        {/* ── STICKY BOTTOM ACTION FOOTER ───────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0A080F] space-y-3">
          {/* Active selection bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white/[0.04] p-2.5 sm:p-3 rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                activeSelection
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              )}>
                {activeSelection ? "🎵" : "🔇"}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 font-medium block">
                  {activeSelection ? "Ausgewählter Track:" : "Kein Sound ausgewählt"}
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {activeSelection ? `${activeSelection.title} (${activeSelection.artist})` : "Standard Stumm / Kein Audio"}
                </p>
              </div>
            </div>

            {/* Quick Play & Deselect for Active Selection */}
            {activeSelection && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePlay(activeSelection)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {playingId === activeSelection.id ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Anhören</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSelection(null)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 underline cursor-pointer"
                >
                  Sound abwählen
                </button>
              </div>
            )}
          </div>

          {/* Action Confirmation Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Kommerziell freigegeben für TikTok, Reels & Ads.</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  stopAllAudio();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer transition"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSelection(activeSelection)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {activeSelection
                    ? `Diesen Sound übernehmen`
                    : "Ohne Musik fortfahren"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

