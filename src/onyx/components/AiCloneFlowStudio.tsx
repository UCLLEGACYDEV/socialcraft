import { useState, useRef, useMemo } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Shirt,
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
import { generateImageUnified, makeId } from "../mock-api";
import {
  analyzeInspirationAndFuseWithClone,
  analyzePersonaPhoto,
  type InspirationFusionResult,
  type PersonaAnalysisProgress,
} from "../persona-analyzer";
import { saveImageToS4, type S4CloudImage } from "../s4-storage";
import { LS, readLS, usePersistentState, writeLS } from "../storage";
import type { AiCloneProfile, ApiSettings, ImageProvider, KieModel } from "../types";

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
    badge: "Empfohlen • Sehr schnell & fotorealistisch",
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

  // Flow State
  const [selectedStyle, setSelectedStyle] = useState<string>(CURATED_STYLES[0]!.url);
  const [customInspirationUrl, setCustomInspirationUrl] = useState<string>("");
  const [customInspirationImages, setCustomInspirationImages] = useState<string[]>([]);
  const inspirationFileInputRef = useRef<HTMLInputElement>(null);

  // Clone Creator from Photo State
  const [showCloneCreator, setShowCloneCreator] = useState(false);
  const [newCloneName, setNewCloneName] = useState("");
  const [newClonePhoto, setNewClonePhoto] = useState<string>("");
  const [isAnalyzingNewClone, setIsAnalyzingNewClone] = useState(false);
  const [cloneAnalysisProgress, setCloneAnalysisProgress] = useState<PersonaAnalysisProgress | null>(null);
  const clonePhotoInputRef = useRef<HTMLInputElement>(null);

  // Generation State
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState<"idle" | "scanning" | "fusing" | "rendering" | "saving" | "done">("idle");
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const [customPromptOverride, setCustomPromptOverride] = useState("");

  // Result Spotlight
  const [generatedResult, setGeneratedResult] = useState<{
    url: string;
    prompt: string;
    inspiration: string;
    cloneName: string;
    aspectRatio: string;
  } | null>(null);

  // 1. Photo Upload to Create a Brand New Clone
  const handleNewClonePhotoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte lade eine gültige Bilddatei (JPG, PNG, WebP) hoch.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setNewClonePhoto(dataUrl);
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
        setNewClonePhoto("");
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

  // 2. Inspiration Upload
  const handleInspirationUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCustomInspirationImages([dataUrl]);
      setSelectedStyle(dataUrl);
      toast.success("Inspirationsfoto hinzugefügt!");
    };
    reader.readAsDataURL(file);
  };

  // 3. The 1-Click Generation Flow
  const handleRunSimpleFlow = async () => {
    const activeInspiration = selectedStyle || customInspirationImages[0];
    if (!activeInspiration) {
      toast.error("Bitte wähle zuerst einen Style oder lade ein Inspirationsfoto hoch.");
      return;
    }

    setIsGenerating(true);
    setGenStage("scanning");

    try {
      // Step A: Vision Style Transfer & Clone Fusion
      setGenStage("fusing");
      const fusion = await analyzeInspirationAndFuseWithClone(
        [activeInspiration],
        activeClone,
        {
          apiKey: settings.kieApiKey,
        },
      );

      const effectivePrompt = customPromptOverride.trim() || fusion.fusedPrompt;

      // Step B: Image Render via active engine
      setGenStage("rendering");
      const res = await generateImageUnified({
        slideNumber: 1,
        prompt: effectivePrompt,
        settings,
        aspectRatio: aspectRatio as any,
      });

      // Step C: Save directly to S4 Cloud
      setGenStage("saving");
      let s4Result: S4CloudImage | null = null;
      try {
        s4Result = await saveImageToS4({
          imageUrl: res.imageUrl,
          prompt: effectivePrompt,
          category: "ai-clone",
          aspectRatio,
          user: currentUser || null,
        });
      } catch (s4Err) {
        console.warn("[CloneStudio] S4 upload:", s4Err);
      }

      setGeneratedResult({
        url: s4Result?.url || res.imageUrl,
        prompt: effectivePrompt,
        inspiration: activeInspiration,
        cloneName: activeClone.name,
        aspectRatio,
      });

      if (onDeductCredits) {
        onDeductCredits(5);
      }

      setGenStage("done");
      toast.success("✨ Bild erfolgreich gerendert und in Cloud gesichert!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
      setGenStage("idle");
    }
  };

  const handleCopyPrompt = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Prompt in Zwischenablage kopiert!");
  };

  const handleDownload = (imageUrl: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `klon_${activeClone.name.toLowerCase().replace(/\s+/g, "_")}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── MODAL / BANNER: CREATE NEW CLONE FROM 1 PHOTO ────────── */}
      {showCloneCreator && (
        <div className="p-6 rounded-2xl border border-[#FF4D17]/40 bg-gradient-to-b from-[#FF4D17]/10 via-black/80 to-black p-6 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#FF4D17] text-white flex items-center justify-center font-bold shadow-md">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Eigenen KI-Klon aus 1 Foto erstellen
                </h3>
                <p className="text-xs text-zinc-400">
                  Lade ein Porträtfoto von dir hoch. Die KI erkennt Gesicht, Haare, Bart & Tattoos automatisch.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCloneCreator(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
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
                placeholder="z. B. Alex (Mein Klon)"
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
                    <span>Analysiere Gesichtszüge & Klon-DNA…</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-[#FF4D17]" />
                    <span>Foto auswählen & KI-Klon sofort generieren</span>
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

      {/* ── SCHRITT 1: DEIN KLON (WER BIST DU?) ─────────────────────── */}
      <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[11px] font-bold text-[#FF4D17] items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Dein KI-Klon (Aktive Identität)
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
                <span>DNA bearbeiten</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Clone Display & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
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
              <span className="text-xs text-zinc-400 shrink-0">Anderer Klon:</span>
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

        {/* Anti-Blemish Clean Skin Notice */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 pl-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Hautfilter aktiv: Pickel & Hautunreinheiten werden automatisch eliminiert (makelloser Editorial Look).</span>
        </div>
      </div>

      {/* ── SCHRITT 2: STYLE & INSPIRATION (WAS SOLL ER ANZIEHEN?) ──── */}
      <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[11px] font-bold text-[#FF4D17] items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Style & Inspiration (Look wählen oder Foto hochladen)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => inspirationFileInputRef.current?.click()}
            className="cryptox-orange-btn !py-1.5 !px-3 text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Eigenes Foto hochladen</span>
          </button>
        </div>

        {/* Hidden File Input for Custom Inspiration */}
        <input
          ref={inspirationFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleInspirationUpload(e.target.files)}
        />

        {/* Curated 1-Click Style Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CURATED_STYLES.map((st) => {
            const isSelected = selectedStyle === st.url;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStyle(st.url);
                  setCustomInspirationImages([]);
                  toast.success(`Style gewählt: ${st.title}`);
                }}
                className={cn(
                  "group relative flex flex-col p-2.5 rounded-xl border text-left transition-all overflow-hidden cursor-pointer",
                  isSelected
                    ? "bg-[#FF4D17]/15 border-[#FF4D17] shadow-[0_0_20px_rgba(255,77,23,0.3)] ring-1 ring-[#FF4D17]"
                    : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20",
                )}
              >
                <div className="aspect-[4/3] w-full rounded-lg overflow-hidden mb-2 relative bg-black/40">
                  <img
                    src={st.url}
                    alt={st.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 text-base">
                    {st.icon}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#FF4D17] text-white flex items-center justify-center shadow-md">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-zinc-200")}>
                  {st.title}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  {st.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Uploaded Preview (If any) */}
        {customInspirationImages.length > 0 && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-[#FF4D17]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={customInspirationImages[0]}
                alt="Eigenes Foto"
                className="h-12 w-12 rounded-lg object-cover border border-[#FF4D17]"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Eigenes Inspirationsfoto aktiv</span>
                </span>
                <p className="text-[10px] text-zinc-400">
                  Die KI übernimmt Kleidung, Schnitt & Pose dieses Fotos für deinen Klon.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomInspirationImages([]);
                setSelectedStyle(CURATED_STYLES[0]!.url);
              }}
              className="text-xs text-zinc-500 hover:text-rose-400"
            >
              Zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* ── SCHRITT 3: GENERIEREN & 1-CLICK ACTION ──────────────────── */}
      <div className="cryptox-card p-6 rounded-2xl border border-[#FF4D17]/30 bg-gradient-to-b from-[#110F17]/95 via-black/80 to-black space-y-4 shadow-[0_0_40px_rgba(255,77,23,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-full bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[11px] font-bold text-[#FF4D17] items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Magie ausführen
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>Kosten: 5 Credits</span>
          </div>
        </div>

        {/* The Big Glowing 1-Click Action Button */}
        <button
          type="button"
          onClick={() => void handleRunSimpleFlow()}
          disabled={isGenerating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FF4D17] via-amber-500 to-[#FF4D17] bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(255,77,23,0.5)] disabled:opacity-40 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                {genStage === "scanning" && "1/4 Scanne Style-Inspiration…"}
                {genStage === "fusing" && `2/4 Fusiere mit Klon (${activeClone.name})…`}
                {genStage === "rendering" && `3/4 Rendere Bild mit ${settings.kieModel || "Nano-Banana 2"}…`}
                {genStage === "saving" && "4/4 Sichere in Mega S4 Cloud…"}
                {genStage === "done" && "Fertig!"}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 fill-white animate-pulse" />
              <span>✨ In diesem Style generieren (1-Click)</span>
            </>
          )}
        </button>

        {/* Clean Controls Bar (Engine & Format) - Compact & Non-Overloaded! */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-white/[0.06]">
          {/* Engine dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 shrink-0">KI-Engine:</span>
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
              className="field-input !py-1 !px-2.5 text-xs bg-black/60 border-white/10 text-white rounded-lg cursor-pointer"
            >
              {ENGINE_SELECT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.kieModel || opt.id} className="bg-zinc-900 text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 shrink-0">Format:</span>
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

          {/* Toggle advanced prompt */}
          <button
            type="button"
            onClick={() => setShowAdvancedPrompt(!showAdvancedPrompt)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors text-right"
          >
            {showAdvancedPrompt ? "Prompt verbergen ▲" : "Prompt anpassen (Optional) ▼"}
          </button>
        </div>

        {/* Collapsible Advanced Prompt Editor (Hidden by default for simplicity) */}
        {showAdvancedPrompt && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2 animate-fadeIn">
            <label className="text-xs font-semibold text-zinc-300 block">
              Benutzerdefinierter Prompt-Override (Optional):
            </label>
            <textarea
              rows={3}
              value={customPromptOverride}
              onChange={(e) => setCustomPromptOverride(e.target.value)}
              placeholder="Leer lassen für automatische Klon-Fusion, oder gib zusätzliche Anweisungen ein..."
              className="field-input text-xs font-mono w-full"
            />
          </div>
        )}
      </div>

      {/* ── ERGEBNIS-SPOTLIGHT (WENN GENERIERT) ────────────────────── */}
      {generatedResult && (
        <div className="cryptox-card p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-black to-black space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">
                Dein Klon-Ergebnis (Fertig gerendert)
              </h3>
              <span className="rounded bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5 border border-emerald-500/25">
                Mega S4 Cloud
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunSimpleFlow()}
                disabled={isGenerating}
                className="cryptox-ghost-btn !py-1.5 !px-3 text-xs text-zinc-300 border border-white/10 hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nochmal (Reroll)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(generatedResult.url)}
                className="cryptox-orange-btn !py-1.5 !px-3.5 text-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Inspiration preview */}
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">
                Inspirations-Vorlage:
              </span>
              <div className="aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                <img
                  src={generatedResult.inspiration}
                  alt="Inspiration"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Right: Rendered Clone */}
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Dein Klon ({generatedResult.cloneName}) im neuen Look:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(generatedResult.prompt)}
                  className="text-[10px] text-zinc-400 hover:text-white"
                >
                  Prompt kopieren
                </button>
              </div>

              <div className="aspect-[4/5] max-h-[500px] rounded-xl overflow-hidden border border-emerald-500/40 shadow-2xl bg-black">
                <img
                  src={generatedResult.url}
                  alt="Generierter Klon"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
