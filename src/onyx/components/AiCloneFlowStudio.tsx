import React, { useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_API_SETTINGS,
  DEFAULT_CLONE_PROFILES,
} from "../defaults";
import { generateImageUnified, makeId } from "../mock-api";
import {
  analyzeInspirationAndFuseWithClone,
  analyzePersonaPhoto,
  type InspirationFusionResult,
  type PersonaAnalysisProgress,
} from "../persona-analyzer";
import { saveImageToS4, type S4CloudImage } from "../s4-storage";
import { LS, readLS, usePersistentState, writeLS } from "../storage";
import type {
  AiCloneProfile,
  ApiSettings,
  ImageProvider,
  KieModel,
  SlideContent,
} from "../types";
import type { User as AuthUser } from "../auth";
import { cn } from "@/lib/utils";

export const CURATED_STYLES = [
  {
    id: "wollmantel",
    title: "Italienischer Wollmantel",
    subtitle: "Dunkler Mantel & Penthouse",
    desc: "Schwarzer taillierter Mantel, anthrazitfarbener Rollkragen, Penthouse-Bokeh bei Nacht",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
    icon: "🧥",
  },
  {
    id: "techwear",
    title: "Cyberpunk Techwear",
    subtitle: "Tech-Bomberjacke & Violettes Rim",
    desc: "Mattschwarze Techwear-Jacke, futuristischer Stehkragen, violettes Kantenlicht",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80",
    icon: "🕶️",
  },
  {
    id: "blazer",
    title: "Editorial Blazer",
    subtitle: "Oversize-Wollblazer & Studio",
    desc: "Dunkelgrauer Designer-Blazer, weiches Rembrandt Studio-Licht, cleanes High-Fashion Editorial",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    icon: "👔",
  },
  {
    id: "lederjacke",
    title: "Lederjacke & Ember-Rim",
    subtitle: "Biker-Leder & warmes Rimlight",
    desc: "Schwarze strukturierte Lederjacke, intensives warmes orange-rotes Seitenlicht",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    icon: "🏍️",
  },
];

export const ENGINE_SELECT_OPTIONS = [
  {
    id: "nano-banana-2",
    provider: "kie-ai" as ImageProvider,
    kieModel: "nano-banana-2" as KieModel,
    name: "🍌 Nano-Banana 2 (KIE AI)",
    badge: "Empfohlen • Extrem fotorealistisch für Gesichter",
  },
  {
    id: "nano-banana-pro",
    provider: "kie-ai" as ImageProvider,
    kieModel: "nano-banana-pro" as KieModel,
    name: "🍌 Nano-Banana Pro (KIE Pro)",
    badge: "Ultra 8K • Höchste Detailtiefe",
  },
  {
    id: "gpt-image-2-text-to-image",
    provider: "kie-ai" as ImageProvider,
    kieModel: "gpt-image-2-text-to-image" as KieModel,
    name: "🤖 GPT-Image 2 (OpenAI via KIE)",
    badge: "OpenAI Image Engine",
  },
  {
    id: "flux-pro",
    provider: "ai33-pro" as ImageProvider,
    name: "⚡ Flux 1.1 Pro",
    badge: "Fashion & Editorial Look",
  },
  {
    id: "gemini-imagen",
    provider: "gemini-imagen" as ImageProvider,
    name: "💎 Google Imagen 3 (Google Flow)",
    badge: "Google DeepMind Imagen",
  },
];

export interface InspirationBatchItem {
  id: string;
  url: string;
  title: string;
  isCustom: boolean;
  status: "idle" | "fusing" | "ready" | "rendering" | "done" | "error";
  fusedPrompt?: string;
  extractedWardrobe?: string;
  generatedImageUrl?: string;
  errorMessage?: string;
}

interface AiCloneFlowStudioProps {
  currentUser?: AuthUser | null;
  onDeductCredits?: (amount: number) => void;
  onOpenDetailedDna?: () => void;
}

export function AiCloneFlowStudio({
  currentUser,
  onDeductCredits,
  onOpenDetailedDna,
}: AiCloneFlowStudioProps) {
  // Profiles
  const [profiles, setProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeId, setActiveId] = usePersistentState<string>(
    LS.activeCloneId,
    DEFAULT_CLONE_PROFILES[0]?.id ?? "",
  );

  const activeClone: AiCloneProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeId) ?? profiles[0] ?? DEFAULT_CLONE_PROFILES[0]!;
  }, [profiles, activeId]);

  // Settings
  const [settings, setSettings] = usePersistentState<ApiSettings>(
    LS.apiSettings,
    DEFAULT_API_SETTINGS,
  );

  // Batch Inspiration Items (Pinterest Board)
  const [inspirationItems, setInspirationItems] = useState<InspirationBatchItem[]>([
    {
      id: "curated_1",
      url: CURATED_STYLES[0]!.url,
      title: CURATED_STYLES[0]!.title,
      isCustom: false,
      status: "idle",
    },
    {
      id: "curated_2",
      url: CURATED_STYLES[1]!.url,
      title: CURATED_STYLES[1]!.title,
      isCustom: false,
      status: "idle",
    },
  ]);

  const inspirationFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Clone Creator from Photo State
  const [showCloneCreator, setShowCloneCreator] = useState(false);
  const [newCloneName, setNewCloneName] = useState("");
  const [isAnalyzingNewClone, setIsAnalyzingNewClone] = useState(false);
  const [cloneAnalysisProgress, setCloneAnalysisProgress] = useState<PersonaAnalysisProgress | null>(null);
  const clonePhotoInputRef = useRef<HTMLInputElement>(null);

  // Batch Execution State
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState<number>(-1);
  const [batchTotal, setBatchTotal] = useState<number>(0);

  // 1. Photo Upload to Create a Brand New Clone
  const handleNewClonePhotoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte lade eine gültige Bilddatei (JPG, PNG, WebP) hoch.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setIsAnalyzingNewClone(true);
      try {
        const analysis = await analyzePersonaPhoto(dataUrl, {
          apiKey: settings.kieApiKey,
          onProgress: (p) => setCloneAnalysisProgress(p),
        });

        const name = newCloneName.trim() || `Klon (${analysis.genderAge.split(",")[0] || "Persona"})`;
        const newProfile: AiCloneProfile = {
          id: `clone_${makeId()}`,
          name,
          isActive: true,
          avatarUrl: dataUrl,
          referenceImages: [dataUrl],
          genderAge: analysis.genderAge,
          hairFace: analysis.hairFace,
          tattoosFeatures: analysis.tattoosFeatures,
          wardrobe: analysis.wardrobe,
          lightingLook: analysis.lightingLook,
          framingCamera: analysis.framingCamera,
          negativePrompt: analysis.negativePrompt,
          customPrefix: analysis.customPrefix,
          placement: "hook_closing",
          updatedAt: new Date().toISOString(),
        };

        setProfiles((prev) => [newProfile, ...prev]);
        setActiveId(newProfile.id);
        setShowCloneCreator(false);
        setNewCloneName("");
        toast.success(`🎉 Neuer KI-Klon „${name}“ erfolgreich erstellt und aktiviert!`);
      } catch (err: unknown) {
        toast.error("Fehler bei der Fotoanalyse: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
      } finally {
        setIsAnalyzingNewClone(false);
        setCloneAnalysisProgress(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. Multi-Inspiration Upload (Pinterest Drag & Drop / Multi-File)
  const handleAddInspirationFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.error("Bitte wähle Bilddateien (JPG, PNG, WebP) aus.");
      return;
    }

    let loadedCount = 0;
    const newItems: InspirationBatchItem[] = [];

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        newItems.push({
          id: `insp_${makeId()}_${index}`,
          url: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, "") || `Pinterest Inspiration #${inspirationItems.length + index + 1}`,
          isCustom: true,
          status: "idle",
        });
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setInspirationItems((prev) => [...prev, ...newItems]);
          toast.success(`📸 ${loadedCount} Inspirationsbild(er) hinzugefügt!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add a curated style to inspiration list
  const handleAddCuratedStyle = (style: typeof CURATED_STYLES[0]) => {
    const newItem: InspirationBatchItem = {
      id: `curated_${makeId()}`,
      url: style.url,
      title: style.title,
      isCustom: false,
      status: "idle",
    };
    setInspirationItems((prev) => [...prev, newItem]);
    toast.success(`Style „${style.title}“ hinzugefügt!`);
  };

  // Remove inspiration item
  const handleRemoveInspiration = (id: string) => {
    setInspirationItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear all inspirations
  const handleClearAllInspirations = () => {
    setInspirationItems([]);
    toast.info("Inspirationsliste geleert.");
  };

  // 3. Generate a SINGLE Inspiration Card
  const handleGenerateSingleItem = async (itemId: string) => {
    const item = inspirationItems.find((i) => i.id === itemId);
    if (!item) return;

    // Update item to fusing
    setInspirationItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: "fusing", errorMessage: undefined } : i)),
    );

    try {
      // Step A: Vision Fusion with Active Clone
      const fusion = await analyzeInspirationAndFuseWithClone([item.url], activeClone, {
        apiKey: settings.kieApiKey,
        fastMode: true,
      });

      // Update item to rendering
      setInspirationItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: "rendering",
                fusedPrompt: fusion.fusedPrompt,
                extractedWardrobe: fusion.extractedWardrobe,
              }
            : i,
        ),
      );

      // Step B: Unified Generation with face reference
      const faceRef = activeClone.avatarUrl || activeClone.referenceImages?.[0];
      const res = await generateImageUnified({
        slideNumber: 1,
        prompt: fusion.fusedPrompt,
        settings,
        referenceImages: faceRef ? [faceRef] : undefined,
        aspectRatio: aspectRatio as any,
      });

      // Step C: Cloud Backup to S4
      let s4Result: S4CloudImage | null = null;
      try {
        s4Result = await saveImageToS4({
          imageUrl: res.imageUrl,
          prompt: fusion.fusedPrompt,
          category: "ai-clone",
          aspectRatio,
          user: currentUser || null,
        });
      } catch (s4Err) {
        console.warn("[CloneStudio] S4 upload:", s4Err);
      }

      const finalUrl = s4Result?.url || res.imageUrl;

      // Update item to done
      setInspirationItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: "done",
                generatedImageUrl: finalUrl,
              }
            : i,
        ),
      );

      if (onDeductCredits) {
        onDeductCredits(5);
      }

      toast.success(`✨ Klon im Style „${item.title}“ fertig generiert!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      setInspirationItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: "error", errorMessage: msg } : i)),
      );
      toast.error(msg);
    }
  };

  // 4. Batch Generate ALL pending Inspiration Cards
  const handleRunBatchFlow = async () => {
    const pendingItems = inspirationItems.filter((i) => i.status !== "done" && i.status !== "rendering");
    if (pendingItems.length === 0) {
      if (inspirationItems.length === 0) {
        toast.error("Bitte lade zuerst mindestens 1 Inspirationsbild (z. B. von Pinterest) hoch.");
      } else {
        toast.info("Alle Bilder sind bereits fertig generiert! Lade neue Bilder hoch oder nutze 'Neu rendern'.");
      }
      return;
    }

    setIsBatchRunning(true);
    setBatchTotal(pendingItems.length);

    for (let index = 0; index < pendingItems.length; index++) {
      const item = pendingItems[index]!;
      setBatchCurrentIndex(index + 1);

      // Execute single item
      await handleGenerateSingleItem(item.id);
    }

    setIsBatchRunning(false);
    setBatchCurrentIndex(-1);
    toast.success(`🎉 Batch abgeschlossen: Alle ${pendingItems.length} Inspirationen erfolgreich generiert!`);
  };

  // 5. Apply Image to Carousel Slide
  const handleApplyToSlide = (imageUrl: string, slideIndex: number) => {
    const currentSlides = readLS<SlideContent[]>(LS.activeSlides, []);
    if (currentSlides.length > 0 && currentSlides[slideIndex]) {
      const updated = [...currentSlides];
      updated[slideIndex] = {
        ...updated[slideIndex]!,
        imageUrl,
      };
      writeLS(LS.activeSlides, updated);
      window.dispatchEvent(new Event("storage"));
      toast.success(`🎉 Bild als Karussell-Folie ${slideIndex + 1} übernommen!`);
    } else {
      const newSlide: SlideContent = {
        id: `slide_${makeId()}`,
        slideNumber: (currentSlides.length || 0) + 1,
        role: "hook",
        roleLabel: "HOOK",
        headline: "Dein KI-Klon Style",
        subtext: "Automatisch generiert mit der SocialCraft Ultra Vision Pipeline.",
        coreMetaphor: "KI Klon Inspiration",
        primaryProps: ["Portrait", "Style Transfer"],
        visualPrompt: "AI Clone Persona Editorial",
        imageUrl,
      };
      const updated = [...currentSlides, newSlide];
      writeLS(LS.activeSlides, updated);
      window.dispatchEvent(new Event("storage"));
      toast.success(`🎉 Neue Karussell-Folie mit deinem Klon-Bild erstellt!`);
    }
  };

  const handleDownload = (imageUrl: string, title: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `klon_${activeClone.name.toLowerCase().replace(/\s+/g, "_")}_${title.toLowerCase().replace(/\s+/g, "_")}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPrompt = (text?: string) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    toast.success("Prompt in Zwischenablage kopiert!");
  };

  const completedCount = inspirationItems.filter((i) => i.status === "done").length;
  const readyCount = inspirationItems.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── MODAL: CREATE NEW CLONE FROM 1 PHOTO ───────────────────── */}
      {showCloneCreator && (
        <div className="p-6 rounded-2xl border border-[#FF4D17]/40 bg-gradient-to-b from-[#FF4D17]/10 via-black/90 to-black space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-[#FF4D17] text-white flex items-center justify-center font-bold shadow-md">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Eigenen KI-Klon aus 1 Foto erstellen (10 Sekunden)
                </h3>
                <p className="text-xs text-zinc-400">
                  Lade ein Porträtfoto hoch. Gesichtszüge, Haare, Bart & Tattoos werden automatisch gespeichert.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCloneCreator(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Klon-Name (z. B. dein Vorname):
              </label>
              <input
                type="text"
                value={newCloneName}
                onChange={(e) => setNewCloneName(e.target.value)}
                placeholder="z. B. Michael (Mein KI-Klon)"
                className="field-input text-xs w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Porträtfoto hochladen:
              </label>
              <input
                ref={clonePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleNewClonePhotoUpload(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => clonePhotoInputRef.current?.click()}
                disabled={isAnalyzingNewClone}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#FF4D17]/50 bg-[#FF4D17]/[0.05] hover:bg-[#FF4D17]/15 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzingNewClone ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF4D17]" />
                    <span>Analysiere Gesicht & DNA…</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-[#FF4D17]" />
                    <span>Foto auswählen & Klon speichern</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isAnalyzingNewClone && cloneAnalysisProgress && (
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs text-white">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3 w-3 text-[#FF4D17] animate-pulse" />
                  {cloneAnalysisProgress.label}
                </span>
                <span className="font-mono text-[#FF4D17]">{cloneAnalysisProgress.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D17] to-amber-400 transition-all duration-300"
                  style={{ width: `${cloneAnalysisProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCHRITT 1: AKTIVER KI-KLON ─────────────────────────────── */}
      <div className="cryptox-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[11px] font-bold text-[#FF4D17] items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Aktiver KI-Klon (Feste Identität)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCloneCreator(true)}
              className="cryptox-ghost-btn !py-1 !px-2.5 text-xs text-zinc-300 border border-white/10 hover:text-white flex items-center gap-1.5"
            >
              <Plus className="h-3 w-3 text-[#FF4D17]" />
              <span>Neuer Klon aus Foto</span>
            </button>
            {onOpenDetailedDna && (
              <button
                type="button"
                onClick={onOpenDetailedDna}
                className="cryptox-ghost-btn !py-1 !px-2.5 text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                title="Klon-Merkmale im Detail bearbeiten"
              >
                <span>DNA anpassen</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Clone Display & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-3.5">
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
                <span className="text-sm font-bold text-white">{activeClone.name}</span>
                <span className="rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.2 font-semibold">
                  Aktiv
                </span>
                <span className="rounded bg-[#FF4D17]/15 text-[#FF4D17] border border-[#FF4D17]/30 text-[10px] px-2 py-0.2 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Reine Haut (Filter aktiv)
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                {activeClone.hairFace}
                {activeClone.tattoosFeatures ? ` • ${activeClone.tattoosFeatures}` : ""}
              </p>
            </div>
          </div>

          {/* Switch Dropdown if multiple profiles exist */}
          {profiles.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 shrink-0">Klon wechseln:</span>
              <select
                value={activeClone.id}
                onChange={(e) => setActiveId(e.target.value)}
                className="field-input !py-1.5 !px-3 text-xs bg-black/60 border-white/10 text-white rounded-lg cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── SCHRITT 2: MULTI-INSPIRATION BOARD (PINTEREST FLOW) ───────── */}
      <div className="cryptox-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[11px] font-bold text-[#FF4D17] items-center justify-center">
              2
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span>Inspirationen (Pinterest, Moodboard & Styles)</span>
                <span className="rounded-full bg-[#FF4D17]/20 text-[#FF4D17] px-2 py-0.5 text-[10px] font-semibold">
                  {inspirationItems.length} Karte(n)
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {inspirationItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllInspirations}
                className="text-xs text-zinc-500 hover:text-rose-400 px-2 py-1 transition-colors"
              >
                Alle leeren
              </button>
            )}
            <button
              type="button"
              onClick={() => inspirationFileInputRef.current?.click()}
              className="cryptox-orange-btn !py-1.5 !px-3 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Pinterest-Bilder reinwerfen</span>
            </button>
          </div>
        </div>

        {/* Hidden Multi-file input */}
        <input
          ref={inspirationFileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleAddInspirationFiles(e.target.files);
          }}
        />

        {/* Multi-Dropzone Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) handleAddInspirationFiles(e.dataTransfer.files);
          }}
          onClick={() => inspirationFileInputRef.current?.click()}
          className={cn(
            "p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2",
            isDragOver
              ? "border-[#FF4D17] bg-[#FF4D17]/10 scale-[1.01]"
              : "border-white/10 hover:border-[#FF4D17]/50 bg-black/40 hover:bg-[#FF4D17]/[0.02]",
          )}
        >
          <div className="h-10 w-10 rounded-full bg-[#FF4D17]/10 border border-[#FF4D17]/30 flex items-center justify-center text-[#FF4D17]">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Ziehe 1, 3, 5 oder mehr Bilder hier rein (z. B. direkt von Pinterest)
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Oder klicke hier, um mehrere Dateien gleichzeitig vom Computer auszuwählen.
            </p>
          </div>
        </div>

        {/* Quick Add Curated Styles */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 block">
            Schnell-Vorlagen hinzufügen:
          </span>
          <div className="flex flex-wrap gap-2">
            {CURATED_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleAddCuratedStyle(st)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#FF4D17]/50 hover:bg-white/[0.06] text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{st.icon}</span>
                <span className="font-medium">{st.title}</span>
                <Plus className="h-3 w-3 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>

        {/* ── INSPIRATION CARDS GRID & RESULTS ──────────────────────── */}
        {inspirationItems.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
              <span>Deine Inspirations-Pipeline ({completedCount} von {readyCount} generiert):</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspirationItems.map((item, idx) => {
                const isItemRendering = item.status === "rendering" || item.status === "fusing";
                const hasResult = Boolean(item.generatedImageUrl);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all space-y-3 relative overflow-hidden",
                      hasResult
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : isItemRendering
                          ? "bg-[#FF4D17]/10 border-[#FF4D17]/50 animate-pulse"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20",
                    )}
                  >
                    {/* Top Row: Title & Remove button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="text-zinc-500 font-mono">#{idx + 1}</span>
                          <span className="truncate max-w-[180px]">{item.title}</span>
                        </span>
                        {hasResult ? (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.2 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Fertig
                          </span>
                        ) : isItemRendering ? (
                          <span className="text-[10px] font-semibold text-[#FF4D17] bg-[#FF4D17]/20 border border-[#FF4D17]/30 px-2 py-0.2 rounded-full flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {item.status === "fusing" ? "Vision Fusing…" : "Rendering…"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.2 rounded-full">
                            Bereit
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveInspiration(item.id)}
                        disabled={isItemRendering || isBatchRunning}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                        title="Karte entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Visual Comparison: Left = Inspiration | Right = Generated Clone */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Left: Inspiration Image */}
                      <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black/60">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-semibold text-zinc-300">
                          📌 Pinterest
                        </div>
                      </div>

                      {/* Right: Rendered Clone or Placeholder */}
                      <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black/60 flex flex-col items-center justify-center">
                        {hasResult ? (
                          <>
                            <img
                              src={item.generatedImageUrl!}
                              alt="Generierter Klon"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#FF4D17] text-[9px] font-bold text-white shadow">
                              ✨ Dein Klon
                            </div>
                          </>
                        ) : isItemRendering ? (
                          <div className="p-3 text-center space-y-2">
                            <Loader2 className="h-6 w-6 text-[#FF4D17] animate-spin mx-auto" />
                            <p className="text-[10px] text-zinc-300 font-medium">
                              {item.status === "fusing"
                                ? "Verschmelze Identität mit Style…"
                                : "Rendere mit Klon-Gesicht…"}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 text-center space-y-1 text-zinc-500">
                            <ImageIcon className="h-6 w-6 mx-auto opacity-40" />
                            <p className="text-[10px]">Noch nicht gerendert</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar for this Card */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/[0.06] text-xs">
                      {hasResult ? (
                        <>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownload(item.generatedImageUrl!, item.title)}
                              className="cryptox-ghost-btn !py-1 !px-2 text-[11px] text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1"
                              title="In voller Auflösung herunterladen"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyPrompt(item.fusedPrompt)}
                              className="cryptox-ghost-btn !py-1 !px-2 text-[11px] text-zinc-400 hover:text-white border border-white/10 flex items-center gap-1"
                              title="Prompt kopieren"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleApplyToSlide(item.generatedImageUrl!, 0)}
                              className="cryptox-ghost-btn !py-1 !px-2 text-[11px] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1"
                              title="Als Folie 1 ins Karussell einfügen"
                            >
                              <Layers className="h-3 w-3" />
                              <span>Ins Karussell</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleGenerateSingleItem(item.id)}
                              disabled={isItemRendering || isBatchRunning}
                              className="cryptox-ghost-btn !py-1 !px-2 text-[11px] text-zinc-400 hover:text-white border border-white/10 flex items-center gap-1"
                              title="Neu rendern"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500">
                            {item.errorMessage ? (
                              <span className="text-rose-400">{item.errorMessage}</span>
                            ) : (
                              "Bereit für 1-Click Generierung"
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleGenerateSingleItem(item.id)}
                            disabled={isItemRendering || isBatchRunning}
                            className="cryptox-orange-btn !py-1 !px-3 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Jetzt generieren</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── SCHRITT 3: BATCH-GENERIERUNG & ENGINE STEUERUNG ─────────── */}
      <div className="cryptox-card p-5 sm:p-6 rounded-2xl border border-[#FF4D17]/40 bg-gradient-to-b from-[#110F17]/95 via-black to-black space-y-4 shadow-[0_0_40px_rgba(255,77,23,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#FF4D17] text-[11px] font-bold text-white items-center justify-center shadow">
              3
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Batch-Generierung starten
              </h2>
              <p className="text-xs text-zinc-400">
                Ersetzt deinen Gemini Gem & Google Flow: Die KI analysiert jedes Bild & rendert deinen Klon.
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>Kosten: 5 Credits / Bild</span>
          </div>
        </div>

        {/* The Giant Glowing Batch Action Button */}
        <button
          type="button"
          onClick={() => void handleRunBatchFlow()}
          disabled={isBatchRunning || inspirationItems.length === 0}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FF4D17] via-amber-500 to-[#FF4D17] bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(255,77,23,0.5)] disabled:opacity-40 cursor-pointer"
        >
          {isBatchRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                Generiere Bild {batchCurrentIndex} von {batchTotal} ({settings.kieModel || "Nano-Banana 2"})…
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 fill-white animate-pulse" />
              <span>
                {inspirationItems.length > 1
                  ? `✨ Alle ${inspirationItems.length} Inspirationen mit meinem Klon generieren (Batch)`
                  : "✨ Inspiration mit meinem Klon generieren (1-Click)"}
              </span>
            </>
          )}
        </button>

        {/* Clean Controls Bar (Engine & Format) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs border-t border-white/[0.08]">
          {/* Engine Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 shrink-0 font-medium">KI-Engine:</span>
            <select
              value={settings.kieModel || "nano-banana-2"}
              onChange={(e) => {
                const val = e.target.value as KieModel;
                const updated: ApiSettings = {
                  ...settings,
                  provider: "kie-ai",
                  kieModel: val,
                };
                setSettings(updated);
                writeLS(LS.apiSettings, updated);
                toast.success(`Engine gewechselt zu ${val}`);
              }}
              className="field-input !py-1 !px-2.5 text-xs bg-black/60 border-white/10 text-white rounded-lg cursor-pointer font-medium"
            >
              {ENGINE_SELECT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.kieModel || opt.id} className="bg-zinc-900 text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 shrink-0 font-medium">Format:</span>
            <div className="flex gap-1">
              {[
                { id: "4:5", label: "4:5 Porträt" },
                { id: "1:1", label: "1:1 Quadrat" },
                { id: "16:9", label: "16:9 Banner" },
                { id: "9:16", label: "9:16 Story" },
              ].map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                    aspectRatio === ar.id
                      ? "bg-[#FF4D17]/20 border-[#FF4D17] text-[#FF4D17] font-semibold"
                      : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white",
                  )}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
