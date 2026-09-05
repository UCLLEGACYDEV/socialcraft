import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Eye,
  ImageIcon,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
  Trash2,
  Upload,
  User,
  UserCheck,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User as AuthUser } from "../auth";
import {
  DEFAULT_API_SETTINGS,
  DEFAULT_CLONE_PROFILES,
} from "../defaults";
import { generateImageUnified } from "../mock-api";
import {
  analyzeInspirationAndFuseWithClone,
  type InspirationFusionResult,
  type PersonaAnalysisProgress,
} from "../persona-analyzer";
import { saveImageToS4, type S4CloudImage } from "../s4-storage";
import { LS, readLS, usePersistentState, writeLS } from "../storage";
import type { AiCloneProfile, ApiSettings } from "../types";

export interface DirectPromptImageRecord {
  id: string;
  url: string;
  s4Url?: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  createdAt: string;
  cloneUsed?: string;
  savedToCloud?: boolean;
  inspirationUsed?: string;
}

interface DirectPromptViewProps {
  initialPrompt?: string;
  currentUser?: AuthUser | null;
  onNavigateToClone?: () => void;
  onDeductCredits?: (amount: number) => void;
}

const ASPECT_RATIOS = [
  { id: "4:5", label: "4:5", sub: "Instagram Porträt (Standard)", widthClass: "h-8 w-6.5" },
  { id: "1:1", label: "1:1", sub: "Quadrat", widthClass: "h-7 w-7" },
  { id: "16:9", label: "16:9", sub: "Querformat / Banner", widthClass: "h-6 w-9" },
  { id: "9:16", label: "9:16", sub: "Story / Reels", widthClass: "h-9 w-5" },
];

const INSPIRATION_PRESETS = [
  {
    title: "Italienischer Wollmantel",
    subtitle: "Dunkler Mantel & Penthouse",
    desc: "Schwarzer taillierter Mantel, anthrazit Rollkragen, Penthouse bei Nacht",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
  },
  {
    title: "Cyberpunk Techwear",
    subtitle: "Tech-Bomberjacke & Rimlight",
    desc: "Mattschwarze Techwear-Jacke, futuristischer Kragen, violettes Kantenlicht",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80",
  },
  {
    title: "Editorial Blazer",
    subtitle: "Oversize-Wollblazer & Studio",
    desc: "Dunkelgrauer Blazer, weiches Studio-Licht, cleanes Editorial",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
  },
  {
    title: "Lederjacke & Ember-Rim",
    subtitle: "Biker-Leder & warmes Licht",
    desc: "Schwarze strukturierte Lederjacke, intensives orangenes Seitenlicht",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  },
];

export function DirectPromptView({
  initialPrompt = "",
  currentUser,
  onNavigateToClone,
  onDeductCredits,
}: DirectPromptViewProps) {
  // Main inputs
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState(
    "Keine Pickel, keine Hautunreinheiten, keine Rötungen, kein Cartoon, kein Plastik-Look, schlechte Anatomie, unscharf",
  );
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync external prompt when it arrives
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && initialPrompt !== prompt) {
      setPrompt(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // KI-Klon State
  const [useClone, setUseClone] = usePersistentState<boolean>(
    LS.directPromptUseClone,
    true,
  );
  const [profiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeCloneId, setActiveCloneId] = usePersistentState<string>(
    LS.activeCloneId,
    DEFAULT_CLONE_PROFILES[0]?.id ?? "",
  );

  const fallbackProfile: AiCloneProfile = DEFAULT_CLONE_PROFILES[0]!;
  const activeClone: AiCloneProfile = useMemo(() => {
    return (
      profiles.find((p) => p.id === activeCloneId) ??
      profiles[0] ??
      fallbackProfile
    );
  }, [profiles, activeCloneId, fallbackProfile]);

  // Multi-Inspiration Images State
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // 1-Click Fast-Flow & Blitz-Modus State
  const [autoBlitzMode, setAutoBlitzMode] = useState<boolean>(false);
  const [isOneClickRunning, setIsOneClickRunning] = useState(false);
  const [oneClickStage, setOneClickStage] = useState<
    "idle" | "scanning" | "fusing" | "rendering" | "uploading" | "done"
  >("idle");

  // Fusion Progress & Results State
  const [isFusing, setIsFusing] = useState(false);
  const [fusionProgress, setFusionProgress] = useState<PersonaAnalysisProgress | null>(
    null,
  );
  const [fusionResult, setFusionResult] = useState<InspirationFusionResult | null>(
    null,
  );

  // Gallery & Spotlight State
  const [historyImages, setHistoryImages] = usePersistentState<
    DirectPromptImageRecord[]
  >(LS.directPromptImages, []);
  const [spotlightRecord, setSpotlightRecord] = useState<DirectPromptImageRecord | null>(
    () => (historyImages.length > 0 ? historyImages[0] : null),
  );
  const [previewImage, setPreviewImage] = useState<DirectPromptImageRecord | null>(
    null,
  );

  // File upload handler (supports multiple files simultaneously)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxFiles = 6;
    const currentCount = inspirationImages.length;
    const remainingSlots = Math.max(0, maxFiles - currentCount);

    if (remainingSlots <= 0) {
      toast.warning("Maximal 6 Inspirationsbilder gleichzeitig möglich.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const readUrls: string[] = [];
    let completed = 0;

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" ist keine gültige Bilddatei.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          readUrls.push(result);
          setInspirationImages((prev) => [...prev, result]);
          toast.success(`Inspiration hinzugefügt: ${file.name}`);
        }
        completed++;
        if (completed === filesToProcess.length && autoBlitzMode && readUrls.length > 0) {
          void handleOneClickFlow([...inspirationImages, ...readUrls]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("Bitte gib eine gültige Bild-URL ein.");
      return;
    }
    const nextImages = [...inspirationImages, trimmed];
    setInspirationImages(nextImages);
    setUrlInput("");
    setShowUrlInput(false);
    toast.success("Inspirations-URL hinzugefügt!");
    if (autoBlitzMode) {
      void handleOneClickFlow(nextImages);
    }
  };

  const handleSelectPreset = (url: string, title: string) => {
    const nextImages = [url];
    setInspirationImages(nextImages);
    toast.success(`Preset „${title}“ geladen.`);
    if (autoBlitzMode) {
      void handleOneClickFlow(nextImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    setInspirationImages((prev) => prev.filter((_, i) => i !== index));
  };

  // STEP-BY-STEP: Vision Style-Transfer Only
  const handleAnalyzeAndFuseOnly = async () => {
    if (inspirationImages.length === 0) {
      toast.error("Bitte lade zuerst mindestens ein Inspirationsbild hoch.");
      return;
    }

    setIsFusing(true);
    setFusionResult(null);

    try {
      const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);
      const result = await analyzeInspirationAndFuseWithClone(
        inspirationImages,
        activeClone,
        {
          apiKey: settings.kieApiKey,
          onProgress: (p) => setFusionProgress(p),
        },
      );

      setFusionResult(result);
      setPrompt(result.fusedPrompt);
      if (result.negativePrompt) {
        setNegativePrompt(result.negativePrompt);
      }
      toast.success(
        `Style erfolgreich auf KI-Klon „${activeClone.name}“ adaptiert!`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Fehler beim Analysieren der Inspiration.";
      toast.error(msg);
    } finally {
      setIsFusing(false);
      setFusionProgress(null);
    }
  };

  // THE ULTIMATE 1-CLICK ALL-IN-ONE FLOW
  // Combines: Gemini/Vision Analysis -> Persona Fusion -> Instant Generation -> Mega S4 Cloud Save
  const handleOneClickFlow = async (overrideImages?: string[]) => {
    const imagesToUse = overrideImages || inspirationImages;
    if (imagesToUse.length === 0) {
      toast.error("Bitte lade zuerst mindestens ein Inspirationsbild hoch oder wähle ein Preset.");
      return;
    }

    setIsOneClickRunning(true);
    setOneClickStage("scanning");
    setFusionResult(null);

    try {
      const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);

      // Phase 1 & 2: Multi-Inspiration Vision Scan & Clone Style Adaptation
      setOneClickStage("fusing");
      const fusion = await analyzeInspirationAndFuseWithClone(
        imagesToUse,
        activeClone,
        {
          apiKey: settings.kieApiKey,
          onProgress: (p) => setFusionProgress(p),
        },
      );

      setFusionResult(fusion);
      setPrompt(fusion.fusedPrompt);
      if (fusion.negativePrompt) {
        setNegativePrompt(fusion.negativePrompt);
      }

      // Phase 3: Immediate High-End Rendering (Nano-Banana 2 / KIE Unified)
      setOneClickStage("rendering");
      const res = await generateImageUnified({
        slideNumber: historyImages.length + 1,
        prompt: fusion.fusedPrompt,
        settings,
      });

      const generatedUrl = res.imageUrl;

      // Phase 4: Automatic Mega S4 Cloud Storage Upload
      setOneClickStage("uploading");
      let s4Result: S4CloudImage | null = null;
      try {
        s4Result = await saveImageToS4({
          imageUrl: generatedUrl,
          prompt: fusion.fusedPrompt,
          category: "direct-prompt",
          aspectRatio,
          user: currentUser || null,
        });
      } catch (s4Err) {
        console.warn("[OneClickFlow] S4 upload failed:", s4Err);
      }

      const newRecord: DirectPromptImageRecord = {
        id: `dp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: s4Result?.url || generatedUrl,
        s4Url: s4Result?.url,
        prompt: fusion.fusedPrompt,
        negativePrompt: fusion.negativePrompt,
        aspectRatio,
        createdAt: new Date().toISOString(),
        cloneUsed: useClone ? activeClone.name : undefined,
        savedToCloud: !!s4Result,
        inspirationUsed: imagesToUse[0],
      };

      setHistoryImages((prev) => [newRecord, ...prev]);
      setSpotlightRecord(newRecord);

      if (onDeductCredits) {
        onDeductCredits(5);
      }

      setOneClickStage("done");
      toast.success(
        `⚡ 1-Click Klon-Flow abgeschlossen! Bild fertig gerendert & in Mega S4 Cloud gesichert! 🎉`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Fehler während des 1-Click Flows";
      toast.error(msg);
    } finally {
      setIsOneClickRunning(false);
      setFusionProgress(null);
    }
  };

  // Manual Generate Image
  const handleGenerateManual = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Bitte gib zuerst einen Bild-Prompt ein.");
      return;
    }

    setIsGenerating(true);
    const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);

    try {
      const res = await generateImageUnified({
        slideNumber: historyImages.length + 1,
        prompt: trimmed,
        settings,
      });

      const generatedUrl = res.imageUrl;

      let s4Result: S4CloudImage | null = null;
      try {
        s4Result = await saveImageToS4({
          imageUrl: generatedUrl,
          prompt: trimmed,
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
        prompt: trimmed,
        negativePrompt,
        aspectRatio,
        createdAt: new Date().toISOString(),
        cloneUsed: useClone ? activeClone.name : undefined,
        savedToCloud: !!s4Result,
        inspirationUsed: inspirationImages[0],
      };

      setHistoryImages((prev) => [newRecord, ...prev]);
      setSpotlightRecord(newRecord);

      if (onDeductCredits) {
        onDeductCredits(5);
      }

      toast.success("Einzelbild gerendert & in Mega S4 gesichert! ☁️");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopy = (text: string, label = "Prompt") => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} in Zwischenablage kopiert!`);
  };

  // Download image
  const handleDownload = (imageUrl: string, filename = "onyx-einzelbild.jpg") => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download gestartet!");
  };

  return (
    <div className="space-y-7 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#FF4D17]" />
              <span>Einzelbild-Studio & 1-Click Klon-Flow</span>
            </h1>
            <span className="rounded-full bg-gradient-to-r from-[#FF4D17]/20 to-amber-500/20 px-3 py-0.5 text-[10px] font-bold text-[#FF4D17] border border-[#FF4D17]/30 shadow-[0_0_15px_rgba(255,77,23,0.2)]">
              All-In-One Pipeline
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Inspirationsfoto reinwerfen → Die KI analysiert Outfit, Pose & Licht → adaptiert alles auf deinen Klon → rendert das Bild sofort mit Nano-Banana 2 in deine Mega S4 Cloud.
          </p>
        </div>

        {/* Global S4 Cloud status badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Mega S4 Cloud aktiv</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: KI-KLON AKTIVIERUNG & AUSWAHL */}
      <div className="cryptox-card relative overflow-hidden p-5 sm:p-6 border border-white/[0.08] transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all",
                useClone
                  ? "bg-[#FF4D17]/15 text-[#FF4D17] border border-[#FF4D17]/30 shadow-[0_0_20px_rgba(255,77,23,0.25)]"
                  : "bg-white/[0.04] text-zinc-500 border border-white/[0.06]",
              )}
            >
              {useClone ? <UserCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  KI-Klon Modus
                </h2>
                {useClone && (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                    Aktiv
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {useClone
                  ? `Jede Generation wird auf die feste Identität von „${activeClone.name}“ (Gesicht, Bart, Tattoos) angepasst.`
                  : "Freier Prompt-Modus ohne Klon-Bindung."}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="text-xs font-medium text-zinc-400">
              {useClone ? "Klon aktiviert" : "Klon deaktiviert"}
            </span>
            <button
              type="button"
              onClick={() => setUseClone(!useClone)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                useClone ? "bg-[#FF4D17]" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  useClone ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        {/* Clone Active Profile Details */}
        {useClone && (
          <div className="mt-4 pt-2 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              {/* Profile Card & Avatar */}
              <div className="flex items-start sm:items-center gap-3.5">
                {activeClone.avatarUrl ? (
                  <img
                    src={activeClone.avatarUrl}
                    alt={activeClone.name}
                    className="h-12 w-12 rounded-xl object-cover border border-[#FF4D17]/40 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {activeClone.name}
                    </span>
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                      {activeClone.genderAge || "Persona"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    {activeClone.hairFace}
                    {activeClone.tattoosFeatures
                      ? ` • ${activeClone.tattoosFeatures}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Profile Selector + Manage Link */}
              <div className="flex items-center gap-2">
                {profiles.length > 1 && (
                  <div className="relative">
                    <select
                      value={activeClone.id}
                      onChange={(e) => setActiveCloneId(e.target.value)}
                      className="field-input !py-1.5 !px-3 text-xs bg-black/40 border-white/10 text-white rounded-lg cursor-pointer"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                          Klon: {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {onNavigateToClone && (
                  <button
                    type="button"
                    onClick={onNavigateToClone}
                    className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 border border-white/10"
                  >
                    <span>Klon verwalten</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Editorial Skin & Blemish Guarantee Badge */}
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-2 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Hautfilter aktiv:</strong> Pickel, Rötungen und temporäre Hautunreinheiten werden eliminiert. Dein Gesicht, Bart und Tattoos bleiben 100% fotorealistisch und konsistent.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: INSPIRATIONS- & 1-CLICK KLON-FLOW */}
      <div className="cryptox-card relative overflow-hidden p-5 sm:p-6 border border-[#FF4D17]/25 shadow-[0_0_40px_rgba(255,77,23,0.06)]">
        {/* Glow ambient background accent */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#FF4D17]/10 blur-3xl" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF4D17] to-amber-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  Inspirations- & Style-Transfer
                </h2>
                <span className="rounded bg-[#FF4D17]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF4D17] border border-[#FF4D17]/40">
                  Automatisierter Flow
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Lade ein oder mehrere Fotos einer Person/Vorlage hoch. Die KI adaptiert Kleidung, Schnitt, Pose & Licht auf deinen Klon.
              </p>
            </div>
          </div>

          {/* Action buttons & Blitz-Modus Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Blitz-Modus Toggle */}
            <label
              className="flex items-center gap-2 cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
              title="Wenn aktiv: Uploading startet sofort die automatische Analyse & Bildgenerierung"
            >
              <input
                type="checkbox"
                checked={autoBlitzMode}
                onChange={(e) => setAutoBlitzMode(e.target.checked)}
                className="rounded border-white/20 bg-zinc-900 text-[#FF4D17] focus:ring-[#FF4D17] h-3.5 w-3.5"
              />
              <span className="text-zinc-300 font-medium flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>Blitz-Modus (Auto-Render)</span>
              </span>
            </label>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-300 border border-white/10 hover:text-white"
            >
              <span>+ URL</span>
            </button>
            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              className="cryptox-orange-btn !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Fotos wählen</span>
            </button>
          </div>
        </div>

        {/* Hidden Multi-file input */}
        <input
          ref={multiFileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* Optional URL input row */}
        {showUrlInput && (
          <div className="mt-4 flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-xyz... eingeben"
              className="field-input text-xs flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="cryptox-orange-btn !py-1.5 !px-3 text-xs"
            >
              Hinzufügen
            </button>
          </div>
        )}

        {/* Uploaded Inspiration Images Preview Bar */}
        <div className="mt-4 space-y-4">
          {inspirationImages.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    {inspirationImages.length} Inspirationsbild
                    {inspirationImages.length > 1 ? "er" : ""} bereit zur Klon-Fusion:
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setInspirationImages([])}
                  className="text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  Alle entfernen
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {inspirationImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-sm"
                  >
                    <img
                      src={img}
                      alt={`Inspiration ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                      <span className="text-[10px] text-white font-mono font-medium">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="h-6 w-6 rounded-md bg-rose-500/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                        title="Entfernen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add more tile */}
                {inspirationImages.length < 6 && (
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center aspect-square rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#FF4D17]/40 text-zinc-400 hover:text-white transition-all gap-1 text-xs"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px]">Weiteres Foto</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Drag & Drop Empty Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => multiFileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[#FF4D17]/40 cursor-pointer transition-all text-center gap-3"
            >
              <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#FF4D17]">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Klicke hier oder ziehe 1 bis 6 Inspirationsfotos hinein
                </p>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Fotos von Models, Outfits, Schnitten, Posen oder Beleuchtungen, deren Style du 1:1 auf deinen KI-Klon übertragen willst.
                </p>
              </div>
            </div>
          )}

          {/* Quick Presets for Instant 1-Click Testing */}
          <div className="pt-2">
            <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span>Oder klicke ein High-End Style-Preset:</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {INSPIRATION_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url, preset.title)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#FF4D17]/40 transition-all text-left group"
                >
                  <img
                    src={preset.url}
                    alt={preset.title}
                    className="h-10 w-10 rounded-md object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {preset.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {preset.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* THE HERO ACTIONS: 1-CLICK FLOW vs. STEP-BY-STEP */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/[0.06]">
            <div className="text-xs text-zinc-400">
              {useClone ? (
                <span>
                  Ziel-Identität: <strong className="text-white">{activeClone.name}</strong> (Gesicht, Bart & Tattoos geschützt)
                </span>
              ) : (
                <span>Freier Style-Transfer ohne Persona-Bindung</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              {/* Option A: Only Analyze and place prompt in textarea */}
              <button
                type="button"
                onClick={handleAnalyzeAndFuseOnly}
                disabled={isOneClickRunning || isFusing || inspirationImages.length === 0}
                className="w-full sm:w-auto cryptox-ghost-btn !py-2.5 !px-4 text-xs text-zinc-300 hover:text-white border border-white/10 disabled:opacity-30"
              >
                {isFusing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analysiere…</span>
                  </span>
                ) : (
                  <span>Nur Prompt analysieren</span>
                )}
              </button>

              {/* Option B: THE 1-CLICK FLOW (Analyzes, Fuses, Generates & Saves in S4) */}
              <button
                type="button"
                onClick={() => void handleOneClickFlow()}
                disabled={isOneClickRunning || isFusing || inspirationImages.length === 0}
                className="w-full sm:w-auto cryptox-orange-btn !py-2.5 !px-6 text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,77,23,0.45)] bg-gradient-to-r from-[#FF4D17] to-amber-500 hover:from-[#ff6229] hover:to-amber-400"
              >
                {isOneClickRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {oneClickStage === "scanning" && "1/4 Scanne Inspiration…"}
                      {oneClickStage === "fusing" && "2/4 Fusiere mit Klon…"}
                      {oneClickStage === "rendering" && "3/4 Rendere Bild (Nano-Banana 2)…"}
                      {oneClickStage === "uploading" && "4/4 Speichere in Mega S4…"}
                      {oneClickStage === "done" && "Fertiggestellt!"}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-white" />
                    <span>⚡ 1-Click Klon-Flow: Analysieren & Sofort Rendern</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live One-Click Multi-Step Progress Tracker */}
          {isOneClickRunning && (
            <div className="mt-4 p-4 rounded-xl border border-[#FF4D17]/40 bg-[#FF4D17]/[0.08] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-white">
                <span className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF4D17] animate-pulse" />
                  <span>
                    {oneClickStage === "scanning" && "Phase 1: Kleidung, Schnitt & Pose der Vorlage scannen…"}
                    {oneClickStage === "fusing" && `Phase 2: Auf Klon-Profil (${activeClone.name}) übertragen & Hautfilter anwenden…`}
                    {oneClickStage === "rendering" && "Phase 3: High-Res Bild mit Nano-Banana 2 Engine berechnen…"}
                    {oneClickStage === "uploading" && "Phase 4: Automatisch in Mega S4 Cloud sichern…"}
                    {oneClickStage === "done" && "Erfolgreich abgeschlossen!"}
                  </span>
                </span>
                <span className="font-mono text-[#FF4D17] font-bold">
                  {oneClickStage === "scanning" && "25%"}
                  {oneClickStage === "fusing" && "50%"}
                  {oneClickStage === "rendering" && "75%"}
                  {oneClickStage === "uploading" && "95%"}
                  {oneClickStage === "done" && "100%"}
                </span>
              </div>

              <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D17] via-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{
                    width:
                      oneClickStage === "scanning"
                        ? "25%"
                        : oneClickStage === "fusing"
                          ? "50%"
                          : oneClickStage === "rendering"
                            ? "75%"
                            : oneClickStage === "uploading"
                              ? "95%"
                              : "100%",
                  }}
                />
              </div>

              {/* Progress Steps Indicators */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-zinc-400">
                <div className={cn("flex items-center gap-1", oneClickStage !== "idle" && "text-white")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D17]" />
                  <span>1. Vision Scan</span>
                </div>
                <div className={cn("flex items-center gap-1", (oneClickStage === "fusing" || oneClickStage === "rendering" || oneClickStage === "uploading" || oneClickStage === "done") && "text-white")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D17]" />
                  <span>2. Klon-Fusion</span>
                </div>
                <div className={cn("flex items-center gap-1", (oneClickStage === "rendering" || oneClickStage === "uploading" || oneClickStage === "done") && "text-white")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>3. Render Engine</span>
                </div>
                <div className={cn("flex items-center gap-1", (oneClickStage === "uploading" || oneClickStage === "done") && "text-emerald-400 font-semibold")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>4. Mega S4 Cloud</span>
                </div>
              </div>
            </div>
          )}

          {/* Fusion Result Card */}
          {fusionResult && (
            <div className="mt-4 p-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">
                    Style erfolgreich auf deinen Klon adaptiert
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Prompt auto-ausgefüllt
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF4D17]">
                    <Shirt className="h-3.5 w-3.5" />
                    <span>Garderobe & Schnitt</span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-3">
                    {fusionResult.extractedWardrobe}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <User className="h-3.5 w-3.5" />
                    <span>Pose & Haltung</span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-3">
                    {fusionResult.extractedPose}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                    <SunMedium className="h-3.5 w-3.5" />
                    <span>Licht & Ambiente</span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-3">
                    {fusionResult.extractedLighting}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Klon-Identität & Haut</span>
                  </div>
                  <p className="text-xs text-emerald-200 line-clamp-3">
                    {activeClone.name}: Gesicht, Haare & Tattoos unverändert. Pickel & Unreinheiten gefiltert.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FEATURED SPOTLIGHT: SOFORT-ERGEBNIS DES 1-CLICK FLOWS */}
      {spotlightRecord && (
        <div className="cryptox-card relative overflow-hidden p-6 border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-black/40 to-black/60 shadow-[0_0_50px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                Aktuelles Klon-Ergebnis (Live Spotlight)
              </h2>
              {spotlightRecord.savedToCloud && (
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  ☁️ Gesichert in Mega S4
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewImage(spotlightRecord)}
                className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-300 border border-white/10 hover:text-white flex items-center gap-1.5"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Vollbild</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(spotlightRecord.url, `spotlight_${spotlightRecord.id}.jpg`)}
                className="cryptox-orange-btn !py-1.5 !px-3 text-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Spotlight Content: Side-by-Side Comparison if Inspiration was used */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Original Inspiration (if available) */}
            {spotlightRecord.inspirationUsed ? (
              <div className="md:col-span-4 flex flex-col gap-2">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Original-Inspiration:</span>
                </span>
                <div className="aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-md">
                  <img
                    src={spotlightRecord.inspirationUsed}
                    alt="Inspiration"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            {/* Right / Main: Fused Clone Visual */}
            <div
              className={cn(
                "flex flex-col gap-2",
                spotlightRecord.inspirationUsed ? "md:col-span-8" : "md:col-span-12",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Dein KI-Klon im adaptierten Look:</span>
                </span>
                {spotlightRecord.cloneUsed && (
                  <span className="text-[11px] text-zinc-400">
                    Klon: <strong className="text-white">{spotlightRecord.cloneUsed}</strong>
                  </span>
                )}
              </div>

              <div className="relative aspect-[4/5] max-h-[500px] rounded-xl overflow-hidden border border-emerald-500/30 bg-zinc-950 shadow-2xl group cursor-pointer">
                <img
                  src={spotlightRecord.url}
                  alt={spotlightRecord.prompt}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onClick={() => setPreviewImage(spotlightRecord)}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <div className="max-w-md">
                    <p className="text-xs text-white line-clamp-2 leading-relaxed">
                      {spotlightRecord.prompt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(spotlightRecord.prompt)}
                    className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-[#FF4D17] transition-colors"
                    title="Prompt kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions below spotlight */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleOneClickFlow()}
                    disabled={isOneClickRunning || inspirationImages.length === 0}
                    className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-300 border border-white/10 hover:text-white flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Nochmal rendern (Reroll)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(spotlightRecord.prompt)}
                    className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-300 border border-white/10 hover:text-white flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Prompt kopieren</span>
                  </button>
                </div>

                <span className="text-[11px] text-zinc-500 font-mono">
                  {spotlightRecord.aspectRatio} • Nano-Banana 2 • KIE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PROMPT EDITOR & GENERATION CONTROLS (EXPANDABLE/FINE-TUNE) */}
      <div className="cryptox-card relative overflow-hidden p-5 sm:p-6 border border-white/[0.08] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#FF4D17]" />
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Prompt & Rendering Feintuning
            </h2>
            <span className="text-xs text-zinc-400">
              (Nano-Banana 2 • KIE AI Engine)
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(prompt, "Bild-Prompt")}
            disabled={!prompt.trim()}
            className="cryptox-ghost-btn !py-1 !px-2.5 text-xs text-zinc-400 hover:text-white disabled:opacity-30 flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Prompt kopieren</span>
          </button>
        </div>

        {/* Positive Prompt Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span>Positiver Bild-Prompt (Detailbeschreibung):</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {prompt.length} Zeichen
            </span>
          </label>
          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Photorealistic portrait of recurring persona, clean editorial skin, 85mm lens, ember rim light…"
            className="field-input text-xs sm:text-sm leading-relaxed font-mono w-full"
          />
        </div>

        {/* Negative Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span>Negativer Prompt (Ausschließen):</span>
            <span className="text-[10px] text-emerald-400">
              Filtert Pickel, Rötungen, schlechte Proportionen
            </span>
          </label>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="field-input text-xs font-mono w-full"
          />
        </div>

        {/* Aspect Ratio Selector & Render Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
          {/* Aspect ratios */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 mr-1">Format:</span>
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                type="button"
                onClick={() => setAspectRatio(ar.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  aspectRatio === ar.id
                    ? "bg-[#FF4D17]/20 border-[#FF4D17] text-[#FF4D17] font-semibold"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:border-white/20",
                )}
                title={ar.sub}
              >
                <span>{ar.label}</span>
              </button>
            ))}
          </div>

          {/* Action: Generate Manual */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Kosten: 5 Credits</span>
            <button
              type="button"
              onClick={handleGenerateManual}
              disabled={isGenerating || !prompt.trim()}
              className="cryptox-orange-btn !py-2.5 !px-6 text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,23,0.3)] min-w-[170px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Rendere Bild…</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  <span>Manuell rendern</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: GENERATED IMAGES GALLERY */}
      {historyImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Bisherige Einzelbilder ({historyImages.length})
              </h2>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                In Mega S4 Cloud
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm("Möchtest du die lokale Einzelbild-Historie leeren?")) {
                  setHistoryImages([]);
                  setSpotlightRecord(null);
                  toast.success("Historie geleert.");
                }
              }}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Historie leeren</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {historyImages.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 shadow-lg flex flex-col"
              >
                {/* Image display */}
                <div className="relative aspect-[4/5] bg-zinc-900 overflow-hidden cursor-pointer">
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onClick={() => setPreviewImage(item)}
                  />

                  {/* S4 Cloud Badge */}
                  {item.savedToCloud && (
                    <div className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span>Mega S4</span>
                    </div>
                  )}

                  {/* Clone Badge if used */}
                  {item.cloneUsed && (
                    <div className="absolute top-2 right-2 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[9px] font-semibold text-[#FF4D17] border border-[#FF4D17]/30 flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      <span>{item.cloneUsed}</span>
                    </div>
                  )}

                  {/* Overlay Actions on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(item)}
                        className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#FF4D17] transition-colors"
                        title="Vollbild"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(item.url, `einzelbild_${item.id}.jpg`)}
                        className="flex-1 py-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white text-xs font-medium hover:bg-white/25 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpotlightRecord(item);
                          toast.success("Im Spotlight geöffnet!");
                        }}
                        className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#FF4D17] transition-colors"
                        title="Im Spotlight anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card footer details */}
                <div className="p-3 border-t border-white/[0.06] space-y-1 bg-white/[0.01]">
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>{item.aspectRatio}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.prompt)}
                      className="hover:text-white transition-colors"
                    >
                      Prompt kopieren
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  Einzelbild Vorschau
                </span>
                {previewImage.cloneUsed && (
                  <span className="rounded bg-[#FF4D17]/15 px-2 py-0.5 text-[10px] font-semibold text-[#FF4D17] border border-[#FF4D17]/30">
                    Klon: {previewImage.cloneUsed}
                  </span>
                )}
                {previewImage.savedToCloud && (
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                    Mega S4 Cloud
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="h-8 w-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative max-h-[70vh] overflow-hidden flex items-center justify-center bg-black">
              <img
                src={previewImage.url}
                alt={previewImage.prompt}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-zinc-900 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-zinc-300 font-mono line-clamp-2 max-w-xl">
                {previewImage.prompt}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(previewImage.prompt)}
                  className="cryptox-ghost-btn !py-2 !px-3 text-xs text-white border border-white/10"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  <span>Prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(previewImage.url, `onyx_einzelbild_${previewImage.id}.jpg`)
                  }
                  className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
