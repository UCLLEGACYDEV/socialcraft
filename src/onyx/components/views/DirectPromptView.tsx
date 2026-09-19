import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  UserCheck,
  Zap,
  Check,
  ChevronDown,
  Clock,
  Download,
  Share2,
  Calendar,
  Maximize2,
  Trash2,
  SlidersHorizontal,
  Cloud,
  Eye,
  Camera,
  Wand2,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User as AuthUser } from "@/onyx/auth";
import {
  DEFAULT_API_SETTINGS,
  DEFAULT_CLONE_PROFILES,
} from "@/onyx/defaults";
import { EngineSelector } from "@/onyx/components/widgets/EngineSelector";
import { GenerationProgress } from "@/onyx/components/widgets/GenerationProgress";
import { generateImageUnified } from "@/onyx/mock-api";
import { listS4Images, saveImageToS4, type S4CloudImage } from "@/onyx/s4-storage";
import { LS, readLS, usePersistentState, writeLS } from "@/onyx/storage";
import type { AiCloneProfile, ApiSettings } from "@/onyx/types";

export interface DirectPromptImageRecord {
  id: string;
  url: string;
  s4Url?: string | undefined;
  s4Key?: string | undefined;
  prompt: string;
  negativePrompt?: string | undefined;
  aspectRatio: string;
  createdAt: string;
  cloneUsed?: string | undefined;
  savedToCloud?: boolean | undefined;
  inspirationUsed?: string | undefined;
}

export function getDirectPromptImageSrc(url?: string, s4Url?: string): string {
  const target = url || s4Url || "";
  if (!target) return "";
  if (target.startsWith("data:") || target.startsWith("blob:") || target.startsWith("/api/")) {
    return target;
  }
  if (target.includes("USERCONTENT")) {
    const match = target.match(/(USERCONTENT\/[^\s?#]+)/);
    if (match && match[1]) {
      return `/api/cloud/file?key=${encodeURIComponent(match[1])}`;
    }
  }
  return target;
}

interface DirectPromptViewProps {
  initialPrompt?: string;
  currentUser?: AuthUser | null;
  onNavigateToClone?: () => void;
  onDeductCredits?: (amount: number) => void;
  onUseInCarousel?: (imageUrl: string, prompt: string) => void;
  onScheduleItem?: (item: { title: string; imageUrls: string[]; prompt?: string }) => void;
  onNavigateToScheduler?: () => void;
}

const ASPECT_RATIOS = [
  { id: "4:5", label: "4:5", sub: "Instagram Porträt (Standard)", icon: "📱" },
  { id: "1:1", label: "1:1", sub: "Quadrat", icon: "⏹️" },
  { id: "9:16", label: "9:16", sub: "Story & TikTok", icon: "🎬" },
  { id: "16:9", label: "16:9", sub: "Querformat & Header", icon: "🖥️" },
];

const CURATED_STYLES = [
  {
    id: "ember",
    title: "Ember Rimlight",
    desc: "Tiefes Studio-Schwarz mit warmem orangenem Kantenlicht",
    modifier: "dark cinematic studio aesthetic, dramatic orange ember rim lighting (#FF4D17), high contrast, 8k resolution, photorealistic",
  },
  {
    id: "editorial",
    title: "Dark Editorial",
    desc: "Vogue-Stil, monochrom, scharfer Fokus & weiche Schatten",
    modifier: "editorial fashion magazine portrait, moody studio shadows, fine depth of field, high-end texture, sharp eyes",
  },
  {
    id: "minimalist",
    title: "Modern Minimalist",
    desc: "Clean, architektonisch, neutrale Töne & perfektes Licht",
    modifier: "minimalist modern design aesthetic, soft directional daylight, clean background, balanced composition, serene atmosphere",
  },
  {
    id: "cyberpunk",
    title: "Cinematic Neon",
    desc: "Dunkle Metropole, violette & blaue Akzente, feine Regentropfen",
    modifier: "cinematic sci-fi night ambience, subtle purple neon accents, wet dark reflective pavement, moody atmosphere, anamorphic bokeh",
  },
];

export function DirectPromptView({
  initialPrompt = "",
  currentUser,
  onNavigateToClone,
  onDeductCredits,
  onUseInCarousel,
  onScheduleItem,
  onNavigateToScheduler,
}: DirectPromptViewProps) {
  // Input State
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState(
    "Keine Verzerrungen, keine schlechte Anatomie, kein Plastik-Look, keine Unschärfe, keine Tippfehler",
  );
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [useClone, setUseClone] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Clones
  const [profiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeCloneId] = usePersistentState<string>(LS.activeCloneId, "");
  const activeClone = useMemo(() => {
    return profiles.find((p) => p.id === activeCloneId) || profiles[0];
  }, [profiles, activeCloneId]);

  // Image History
  const [historyImages, setHistoryImages] = usePersistentState<DirectPromptImageRecord[]>(
    "onyx.directPrompt.history",
    [],
  );
  const [spotlightRecord, setSpotlightRecord] = useState<DirectPromptImageRecord | null>(
    () => historyImages[0] || null,
  );
  const [zoomModalImage, setZoomModalImage] = useState<DirectPromptImageRecord | null>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && initialPrompt !== prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (!spotlightRecord && historyImages.length > 0) {
      setSpotlightRecord(historyImages[0]);
    }
  }, [historyImages, spotlightRecord]);

  // Prompt Enhancer
  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      toast.error("Bitte gib zuerst eine Idee ein, die veredelt werden soll.");
      return;
    }
    const enhanced = `${prompt.trim()}, high-end cinematic studio lighting, volumetric depth, photorealistic textures, 8k resolution, masterful composition`;
    setPrompt(enhanced);
    toast.success("Prompt mit Studio-Details veredelt! ✨");
  };

  // Generate Single Image
  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Bitte gib eine Bildbeschreibung (Prompt) ein.");
      return;
    }

    setIsGenerating(true);
    const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);

    // Build final prompt
    let finalPrompt = trimmed;
    if (selectedStyleId) {
      const style = CURATED_STYLES.find((s) => s.id === selectedStyleId);
      if (style) finalPrompt += `, ${style.modifier}`;
    }
    if (useClone && activeClone) {
      finalPrompt = `${activeClone.name}, ${activeClone.wardrobe || ""}, ${finalPrompt}`;
    }

    try {
      const res = await generateImageUnified({
        slideNumber: historyImages.length + 1,
        prompt: finalPrompt,
        settings,
      });

      const generatedUrl = res.imageUrl;
      let s4Result: S4CloudImage | null = null;
      try {
        s4Result = await saveImageToS4({
          imageUrl: generatedUrl,
          prompt: finalPrompt,
          category: "direct-prompt",
          aspectRatio,
          user: currentUser || null,
        });
      } catch (s4Err) {
        console.warn("[DirectPrompt] S4 upload failed:", s4Err);
      }

      const newRecord: DirectPromptImageRecord = {
        id: `dp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: s4Result?.url || generatedUrl,
        s4Url: s4Result?.url,
        s4Key: s4Result?.key,
        prompt: finalPrompt,
        negativePrompt,
        aspectRatio,
        createdAt: new Date().toISOString(),
        cloneUsed: useClone && activeClone ? activeClone.name : undefined,
        savedToCloud: !!s4Result,
      };

      setHistoryImages((prev) => [newRecord, ...prev]);
      setSpotlightRecord(newRecord);

      if (onDeductCredits) {
        onDeductCredits(useClone ? 2 : 1);
      }

      toast.success("Einzelbild erfolgreich generiert & gesichert! ✨");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryImages((prev) => prev.filter((item) => item.id !== id));
    if (spotlightRecord?.id === id) {
      setSpotlightRecord(historyImages.find((item) => item.id !== id) || null);
    }
    toast.info("Bild aus Verlauf entfernt.");
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download gestartet!");
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Einzelbild-Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Einzelnes Visual
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Auf den Punkt gestaltete Grafiken, Porträts und Visuals für Postings, Header und Ads.
          </p>
        </div>

        {/* Persona Pill */}
        {activeClone && (
          <button
            type="button"
            onClick={onNavigateToClone}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-white transition-all cursor-pointer"
            title="Zu Mein Gesicht (Persona-Studio)"
          >
            <UserCheck className="h-3.5 w-3.5 text-[#FF4D17]" />
            <span className="font-semibold">{activeClone.name}</span>
          </button>
        )}
      </div>

      {/* ── Während Generierung: Fortschrittsbalken ─────────────────── */}
      {isGenerating && (
        <div className="rounded-3xl border border-[#FF4D17]/30 bg-black/60 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(255,77,23,0.15)]">
          <GenerationProgress
            isGenerating={true}
            title="Visual wird generiert"
            totalItems={1}
            onCancel={() => setIsGenerating(false)}
          />
        </div>
      )}

      {/* ── 2-Spalten Hauptbereich ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Linke Spalte: Konfiguration (6 Spalten) ───────────────── */}
        <div className="lg:col-span-6 space-y-5">
          {/* Prompt Box */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#FF4D17]" />
                <span>Bildbeschreibung (Prompt)</span>
              </h3>

              <button
                type="button"
                onClick={handleEnhancePrompt}
                className="text-xs font-semibold text-[#FF4D17] hover:brightness-125 flex items-center gap-1.5 cursor-pointer bg-[#FF4D17]/10 px-2.5 py-1 rounded-lg border border-[#FF4D17]/20 transition-all"
                title="Fügt automatisch Studio-Details hinzu"
              >
                <Wand2 className="h-3 w-3" />
                <span>KI veredeln</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="z. B. Hochauflösendes Editorial-Porträt in mattschwarzem Rollkragenpullover, Studio-Kantenbeleuchtung, selbstbewusster Blick in die Kamera…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-[#FF4D17] focus:outline-none transition-all leading-relaxed"
            />

            {/* Persona-Anker Toggle */}
            {activeClone ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF4D17]/15 text-[#FF4D17] border border-[#FF4D17]/30">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      Persona: {activeClone.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Nutzt dein Gesicht & Styling-Merkmale
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUseClone(!useClone)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    useClone
                      ? "bg-[#FF4D17] text-white shadow-sm"
                      : "bg-white/10 text-zinc-400 hover:text-white",
                  )}
                >
                  {useClone ? "Aktiv" : "Aus"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-3 flex items-center justify-between text-xs text-zinc-400">
                <span>Keine Persona eingerichtet.</span>
                <button
                  type="button"
                  onClick={onNavigateToClone}
                  className="text-[#FF4D17] font-semibold hover:underline"
                >
                  Persona anlegen
                </button>
              </div>
            )}

            {/* Format-Auswahl */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Seitenverhältnis
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSel = aspectRatio === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer space-y-1",
                        isSel
                          ? "border-[#FF4D17] bg-[#FF4D17]/10 shadow-sm"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="text-base">{ratio.icon}</div>
                      <div className="text-xs font-bold text-white">{ratio.label}</div>
                      <div className="text-[9px] text-zinc-400 truncate">{ratio.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stil-Presets */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Kuratierte Ästhetik (Optional)
                </span>
                {selectedStyleId && (
                  <button
                    type="button"
                    onClick={() => setSelectedStyleId(null)}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CURATED_STYLES.map((style) => {
                  const isSel = selectedStyleId === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyleId(isSel ? null : style.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-0.5",
                        isSel
                          ? "border-[#FF4D17] bg-[#FF4D17]/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="text-xs font-bold text-white">{style.title}</div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1">{style.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Einklappbare Profi-Optionen */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Erweiterte Parameter (Negative Prompt)</span>
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")}
                />
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 animate-in fade-in-50">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block">Negativer Prompt:</label>
                    <textarea
                      rows={2}
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 p-2 text-xs text-white focus:border-[#FF4D17] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generieren Button & Kostenvorschau */}
            <div className="pt-3 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#FF4D17]" />
                  <span>Kosten vor Start:</span>
                </span>
                <span className="font-bold text-white">
                  {useClone ? "2 Credits (Persona-Anker)" : "1 Credit"} · ~12s
                </span>
              </div>

              <button
                type="button"
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-[0_0_30px_rgba(255,77,23,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer",
                  !prompt.trim()
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                    : "bg-[#FF4D17] hover:brightness-110 active:scale-[0.99]",
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span>Visual generieren</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Rechte Spalte: Spotlight & Verlauf (6 Spalten) ─────────── */}
        <div className="lg:col-span-6 space-y-5 lg:sticky lg:top-20">
          {/* Spotlight Image Card */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Aktuelles Visual
              </h3>
              {spotlightRecord && (
                <span className="text-[11px] font-mono text-zinc-400">
                  Format {spotlightRecord.aspectRatio}
                </span>
              )}
            </div>

            {spotlightRecord ? (
              <div className="space-y-4">
                <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-[4/5] max-h-[460px] flex items-center justify-center">
                  <img
                    src={getDirectPromptImageSrc(spotlightRecord.url, spotlightRecord.s4Url)}
                    alt={spotlightRecord.prompt}
                    className="w-full h-full object-contain"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => setZoomModalImage(spotlightRecord)}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-110"
                      title="Vollbild ansehen"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  {spotlightRecord.prompt}
                </p>

                {/* 1-Klick Aktionen */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {onUseInCarousel && (
                    <button
                      type="button"
                      onClick={() =>
                        onUseInCarousel(
                          getDirectPromptImageSrc(spotlightRecord.url, spotlightRecord.s4Url),
                          spotlightRecord.prompt,
                        )
                      }
                      className="py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="h-3.5 w-3.5 text-[#FF4D17]" />
                      <span>Ins Karussell</span>
                    </button>
                  )}

                  {onScheduleItem && onNavigateToScheduler && (
                    <button
                      type="button"
                      onClick={() => {
                        onScheduleItem({
                          title: spotlightRecord.prompt.slice(0, 40),
                          imageUrls: [
                            getDirectPromptImageSrc(spotlightRecord.url, spotlightRecord.s4Url),
                          ],
                          prompt: spotlightRecord.prompt,
                        });
                        onNavigateToScheduler();
                        toast.success("Im Planer vorbereitet!");
                      }}
                      className="py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>Planen</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        getDirectPromptImageSrc(spotlightRecord.url, spotlightRecord.s4Url),
                        `visual_${spotlightRecord.id}.jpg`,
                      )
                    }
                    className="py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-500 space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-zinc-600" />
                <p className="text-xs">Noch kein Einzelbild generiert.</p>
                <p className="text-[11px] text-zinc-600">
                  Gib links eine Beschreibung ein und klicke auf „Visual generieren“.
                </p>
              </div>
            )}
          </div>

          {/* Verlauf der letzten Kreationen */}
          {historyImages.length > 0 && (
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Letzte Visuals ({historyImages.length})
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {historyImages.slice(0, 8).map((rec) => {
                  const isSpotlight = spotlightRecord?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSpotlightRecord(rec)}
                      className={cn(
                        "relative group aspect-[4/5] rounded-xl overflow-hidden border transition-all cursor-pointer bg-black/50",
                        isSpotlight
                          ? "border-[#FF4D17] ring-2 ring-[#FF4D17]/40 shadow-sm"
                          : "border-white/10 hover:border-white/30",
                      )}
                    >
                      <img
                        src={getDirectPromptImageSrc(rec.url, rec.s4Url)}
                        alt={rec.prompt}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecord(rec.id, e)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Löschen"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Zoom Modal ──────────────────────────────────────────────── */}
      {zoomModalImage && (
        <div
          onClick={() => setZoomModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center space-y-4"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[80vh]">
              <img
                src={getDirectPromptImageSrc(zoomModalImage.url, zoomModalImage.s4Url)}
                alt={zoomModalImage.prompt}
                className="max-h-[80vh] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setZoomModalImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 text-center max-w-2xl bg-black/60 p-3 rounded-2xl border border-white/10">
              {zoomModalImage.prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
