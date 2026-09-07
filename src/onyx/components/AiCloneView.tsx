import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
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
  UserCheck,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_API_SETTINGS, DEFAULT_CLONE_PROFILES } from "../defaults";
import { generateImageUnified, makeId } from "../mock-api";
import {
  analyzePersonaPhoto,
  autoGeneratePersonaProfile,
  type PersonaAnalysisProgress,
} from "../persona-analyzer";
import { LS, readLS, usePersistentState } from "../storage";
import type { AiCloneProfile, ApiSettings, ClonePlacement } from "../types";
import type { User as AuthUser } from "../auth";
import { cn } from "@/lib/utils";

interface AiCloneViewProps {
  currentUser?: AuthUser | null;
  onDeductCredits?: (amount: number) => void;
  onUseInCarousel?: () => void;
  onUseInDirectPrompt?: (clonePrompt: string) => void;
}

const QUICK_SCENARIOS = [
  {
    label: "☕ Café & Laptop",
    prompt: "Sitting in a sleek modern coffee shop, enjoying a cappuccino with an open MacBook, natural window sunlight, relaxed atmosphere",
  },
  {
    label: "🎤 Keynote Speaker",
    prompt: "On a grand keynote stage with a headset microphone, addressing a large audience, dramatic stage spotlights and subtle dark background",
  },
  {
    label: "📸 Dark Studio Portrait",
    prompt: "High-end editorial studio portrait, dark atmospheric background, warm amber Ember-Rim lighting (#FF4D17) from behind, crisp eye contact",
  },
  {
    label: "🌆 Penthouse bei Nacht",
    prompt: "Standing on a luxury high-rise penthouse balcony at night, city skyline bokeh with glowing lights in the background, elegant evening mood",
  },
  {
    label: "🎙️ Podcast Studio",
    prompt: "In a professional podcast studio speaking into a Shure SM7B microphone with acoustic foam walls and moody amber neon lighting",
  },
  {
    label: "🏎️ Sportwagen Lifestyle",
    prompt: "Sitting in the driver seat of a luxury sports car, clean leather interior, golden hour sunset lighting through the windshield",
  },
];

export function AiCloneView({
  currentUser,
  onDeductCredits,
  onUseInCarousel,
  onUseInDirectPrompt,
}: AiCloneViewProps) {
  // Profiles state
  const [profiles, setProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeId, setActiveId] = usePersistentState<string>(
    LS.activeCloneId,
    "",
  );

  // Settings
  const [settings] = useState<ApiSettings>(() => {
    return readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMethod, setCreateMethod] = useState<"photo" | "text">("photo");
  const [textName, setTextName] = useState("");
  const [textAge, setTextAge] = useState("28");
  const [textGender, setTextGender] = useState<"male" | "female" | "diverse">("male");
  const [textVibe, setTextVibe] = useState("Modern Creator / Tech Leader");
  const [isTextGenerating, setIsTextGenerating] = useState(false);

  // Single Image Studio state
  const [singlePrompt, setSinglePrompt] = useState("");
  const [singleRatio, setSingleRatio] = useState<"4:5" | "1:1">("4:5");
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);
  const [generatedSingles, setGeneratedSingles] = useState<{
    id: string;
    url: string;
    prompt: string;
    createdAt: string;
  }[]>([]);

  // Active Profile resolution
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeId) ?? profiles[0] ?? {
      id: "clone_default",
      name: "Mein KI-Klon",
      isActive: true,
      genderAge: "Mann, Ende 20",
      hairFace: "Dunkle strukturierte Haare, gepflegter 3-Tage-Bart",
      tattoosFeatures: "Reine Haut ohne Unreinheiten",
      wardrobe: "Schwarzer Merinowolle-Rollkragen",
      lightingLook: "Studio mit warmem Ember-Rimlight",
      framingCamera: "85mm Porträt f/1.8",
      negativePrompt: "Keine Pickel, keine Hautunreinheiten, kein Plastik-Look",
      customPrefix: "Photorealistic editorial portrait of persona",
      referenceImages: [],
      placement: "all_slides" as ClonePlacement,
      analysisSummary: ["Gesichtszüge & Bart synchronisiert", "Ember-Rimlight aktiv"],
    };
  }, [profiles, activeId]);

  useEffect(() => {
    if (!activeId && profiles.length > 0 && profiles[0]) {
      setActiveId(profiles[0].id);
    }
  }, [profiles, activeId, setActiveId]);

  // Handle Photo File Upload
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle eine gültige Bilddatei (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setUploadedPhotoUrl(result);
        setShowUploadZone(true);
        toast.success("Foto geladen! Klicke jetzt auf „Foto komplett analysieren“.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Auto Text Synthesis (without photo)
  const handleAutoTextCreate = async () => {
    if (!textName.trim()) {
      toast.error("Bitte gib einen Namen für deinen Klon ein.");
      return;
    }

    setIsTextGenerating(true);
    try {
      const result = await autoGeneratePersonaProfile({
        name: textName.trim(),
        age: textAge,
        gender: textGender,
        vibe: textVibe,
      }, {
        apiKey: settings.kieApiKey,
      });

      const cloneId = makeId();
      const newProfile: AiCloneProfile = {
        id: cloneId,
        name: textName.trim(),
        isActive: true,
        genderAge: result.genderAge,
        hairFace: result.hairFace,
        tattoosFeatures: result.tattoosFeatures,
        wardrobe: result.wardrobe,
        lightingLook: result.lightingLook,
        framingCamera: result.framingCamera,
        negativePrompt: result.negativePrompt,
        customPrefix: result.customPrefix,
        referenceImages: [],
        placement: "all_slides",
        analysisSummary: result.analysisSummary,
      };

      setProfiles((prev) => [
        newProfile,
        ...prev.map((p) => ({ ...p, isActive: false })),
      ]);
      setActiveId(cloneId);
      setShowCreateModal(false);
      setTextName("");

      toast.success(`KI-Klon „${textName.trim()}“ erfolgreich generiert & aktiviert! 🎉`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler bei der Klon-Generierung";
      toast.error(msg);
    } finally {
      setIsTextGenerating(false);
    }
  };

  // Run AI Vision Analysis on uploaded photo
  const handleAnalyzePhoto = async () => {
    if (!uploadedPhotoUrl) {
      toast.error("Bitte lade zuerst ein Foto hoch.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({
      step: 1,
      totalSteps: 5,
      label: "Starte Gesichtsgeometrie- & Identitäts-Scan…",
      percent: 15,
    });

    try {
      const result = await analyzePersonaPhoto(uploadedPhotoUrl, {
        apiKey: settings.kieApiKey,
        onProgress: (p) => setAnalysisProgress(p),
      });

      const cloneId = makeId();
      const finalName = textName.trim() || result.detectedNameSuggestion || "Mein KI-Klon";

      const newProfile: AiCloneProfile = {
        id: cloneId,
        name: finalName,
        isActive: true,
        avatarUrl: uploadedPhotoUrl,
        referenceImages: [uploadedPhotoUrl],
        genderAge: result.genderAge,
        hairFace: result.hairFace,
        tattoosFeatures: result.tattoosFeatures,
        wardrobe: result.wardrobe,
        lightingLook: result.lightingLook,
        framingCamera: result.framingCamera,
        negativePrompt: result.negativePrompt,
        customPrefix: result.customPrefix,
        placement: "all_slides",
        analysisSummary: result.analysisSummary,
      };

      // Set active & update profiles
      setProfiles((prev) => [
        newProfile,
        ...prev.map((p) => ({ ...p, isActive: false })),
      ]);
      setActiveId(cloneId);
      setShowCreateModal(false);
      setUploadedPhotoUrl("");
      setTextName("");

      toast.success(`KI-Klon für „${finalName}“ erfolgreich aus Foto erstellt & aktiviert! 🎉`, {
        description: "Gesichtszüge, Bart, Haare & Lichtkonzept wurden vollständig synthetisiert.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler bei der Foto-Analyse";
      toast.error(`Analyse-Fehler: ${msg}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  // Generate Single Image of the Clone
  const handleGenerateSingle = async () => {
    if (!singlePrompt.trim()) {
      toast.error("Bitte gib eine Szene oder Situation für deinen Klon ein.");
      return;
    }

    setIsGeneratingSingle(true);
    const fullPrompt = `${activeProfile.customPrefix} — ${singlePrompt.trim()}`;

    try {
      const res = await generateImageUnified({
        slideNumber: 1,
        prompt: fullPrompt,
        settings,
        aspectRatio: singleRatio,
        referenceImages: activeProfile.referenceImages && activeProfile.referenceImages.length > 0
          ? activeProfile.referenceImages
          : activeProfile.avatarUrl ? [activeProfile.avatarUrl] : undefined,
      });

      const newImg = {
        id: makeId(),
        url: res.imageUrl,
        prompt: singlePrompt,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setGeneratedSingles((prev) => [newImg, ...prev]);
      onDeductCredits?.(1);

      toast.success("Einzelbild mit deinem KI-Klon erfolgreich generiert! 🚀");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(msg);
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  // Switch Active Status
  const handleToggleActive = () => {
    const nextStatus = !activeProfile.isActive;
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, isActive: nextStatus } : p)),
    );
    toast.info(
      nextStatus
        ? `Persona „${activeProfile.name}“ für alle Karussell-Slides aktiviert!`
        : `Persona „${activeProfile.name}“ deaktiviert.`,
    );
  };

  // Delete Clone Profile
  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      toast.error("Mindestens ein Profil muss erhalten bleiben.");
      return;
    }
    const filtered = profiles.filter((p) => p.id !== id);
    setProfiles(filtered);
    if (activeId === id && filtered[0]) {
      setActiveId(filtered[0].id);
    }
    toast.success("Profil gelöscht.");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Active Clone Banner ──────────────────────── */}
      <div className="cryptox-card relative overflow-hidden space-y-5 p-6 sm:p-7 border border-white/[0.08]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 shadow-[0_0_15px_-4px_rgba(255,77,23,0.5)]">
                <UserCheck className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                KI-Klon Studio &amp; Persona
              </h1>
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-semibold border",
                  activeProfile.isActive
                    ? "border-orange-500/50 bg-orange-500/15 text-orange-400 shadow-[0_0_15px_-3px_rgba(255,77,23,0.5)]"
                    : "border-white/[0.08] bg-white/[0.03] text-zinc-400",
                )}
              >
                {activeProfile.isActive ? "Aktiviert für Karussells" : "Inaktiv"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Erstelle deinen persönlichen Klon per <strong>Foto-Upload</strong> oder <strong>Texteingabe</strong>.
              Verwende ihn sofort für <strong>Karussell-Slides</strong> oder für <strong>neue Einzelbilder</strong>.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleActive}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
                activeProfile.isActive
                  ? "cryptox-orange-btn !py-2 !px-4 text-xs font-semibold"
                  : "border border-white/[0.1] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{activeProfile.isActive ? "Klon aktiv (AN)" : "Klon aktivieren"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#FF4D17]/40 bg-[#FF4D17]/15 px-4 py-2 text-xs font-semibold text-orange-300 transition-colors hover:bg-[#FF4D17]/30 hover:text-white cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 text-orange-400" />
              <span>+ Neuen Klon erstellen</span>
            </button>
          </div>
        </div>

        {/* ── Profiles Switcher ───────────────────────────────────── */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 shrink-0">Profile:</span>
            {profiles.map((p) => {
              const isSelected = p.id === activeProfile.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium transition-all shrink-0 cursor-pointer",
                    isSelected
                      ? "border-orange-500/80 bg-orange-500/15 text-orange-400 font-semibold shadow-[0_0_15px_-4px_rgba(255,77,23,0.4)]"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200",
                  )}
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <User className="h-3.5 w-3.5 opacity-60" />
                  )}
                  <span>{p.name}</span>
                  {p.isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 px-2 py-1 rounded-lg border border-dashed border-orange-500/40 hover:bg-orange-500/10 cursor-pointer shrink-0 ml-1"
            >
              <Plus className="h-3 w-3" /> Neuer Klon
            </button>
          </div>

          {profiles.length > 1 && (
            <button
              type="button"
              onClick={() => handleDeleteProfile(activeProfile.id)}
              className="text-xs text-zinc-400 hover:text-destructive flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg hover:bg-destructive/10 cursor-pointer"
              title="Aktives Profil löschen"
            >
              <Trash2 className="h-3 w-3" /> Löschen
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoSelect(file);
        }}
      />

      {/* ── KLON ERSTELLEN MODAL (FOTO ODER TEXT) ─────────────────── */}
      {showCreateModal && (
        <div className="p-6 rounded-3xl border border-[#FF4D17]/50 bg-gradient-to-b from-[#181322] via-[#110F17] to-[#0A0810] space-y-5 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#FF4D17] to-amber-500 text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,77,23,0.4)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Neuen KI-Klon erstellen</span>
                  <span className="rounded bg-[#FF4D17]/20 text-[#FF4D17] border border-[#FF4D17]/40 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                    Automatisch
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Wähle, wie du deinen Klon erstellen möchtest: Per Foto-Analyse oder per schneller Texteingabe.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setUploadedPhotoUrl("");
              }}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Creation Method Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setCreateMethod("photo")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                createMethod === "photo"
                  ? "bg-gradient-to-r from-[#FF4D17] to-amber-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>📸 Foto reinwerfen &amp; analysieren (Empfohlen)</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateMethod("text")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                createMethod === "text"
                  ? "bg-gradient-to-r from-[#FF4D17] to-amber-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>⚡ Ohne Foto (Name, Alter &amp; Geschlecht)</span>
            </button>
          </div>

          {/* TAB 1: FOTO ANALYSE */}
          {createMethod === "photo" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handlePhotoSelect(file);
                }}
                className={cn(
                  "md:col-span-7 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer min-h-[200px]",
                  uploadedPhotoUrl
                    ? "border-[#FF4D17]/80 bg-black/40"
                    : "border-white/20 bg-white/[0.02] hover:border-orange-500/50 hover:bg-white/[0.04]",
                )}
              >
                {uploadedPhotoUrl ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-lg">
                      <img src={uploadedPhotoUrl} alt="Vorschau" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1.5">
                        <span className="text-[10px] font-bold text-emerald-400">Foto bereit ✓</span>
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-sm font-bold text-white">Foto ausgewählt</p>
                      <p className="text-xs text-zinc-400">
                        Klicke hier zum Ändern oder starte rechts die Analyse.
                      </p>
                      <span className="inline-block text-[11px] text-orange-400 font-semibold underline">
                        Anderes Foto wählen
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 shadow-md">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Foto hier hineinziehen oder klicken</p>
                      <p className="text-xs text-zinc-400">Porträt, Selfie oder Studio-Foto (JPG, PNG)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Name der Person:
                  </label>
                  <input
                    type="text"
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                    placeholder="z. B. Alex"
                    className="field-input text-xs w-full"
                  />
                </div>

                {isAnalyzing && analysisProgress && (
                  <div className="p-3 rounded-xl bg-black/60 border border-[#FF4D17]/40 space-y-1.5">
                    <div className="flex justify-between text-xs text-white">
                      <span className="flex items-center gap-1.5 font-medium truncate max-w-[180px]">
                        <Sparkles className="h-3.5 w-3.5 text-[#FF4D17] animate-pulse shrink-0" />
                        {analysisProgress.label}
                      </span>
                      <span className="font-mono font-bold text-[#FF4D17]">{analysisProgress.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF4D17] to-amber-400 transition-all duration-300"
                        style={{ width: `${analysisProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAnalyzePhoto}
                  disabled={!uploadedPhotoUrl || isAnalyzing}
                  className="w-full cryptox-orange-btn !py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,23,0.4)] disabled:opacity-40 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>KI analysiert Person…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Foto analysieren &amp; Klon aktivieren</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SCHNELLE TEXT-SYNTHESE */}
          {createMethod === "text" && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    1. Name:
                  </label>
                  <input
                    type="text"
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                    placeholder="z. B. Alex"
                    className="field-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    2. Alter:
                  </label>
                  <input
                    type="text"
                    value={textAge}
                    onChange={(e) => setTextAge(e.target.value)}
                    placeholder="z. B. 28"
                    className="field-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    3. Geschlecht:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["male", "female", "diverse"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setTextGender(g)}
                        className={cn(
                          "py-1.5 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer",
                          textGender === g
                            ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F]"
                            : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white",
                        )}
                      >
                        {g === "male" ? "Mann" : g === "female" ? "Frau" : "Divers"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  4. Stil-Vibe (Optional):
                </label>
                <input
                  type="text"
                  value={textVibe}
                  onChange={(e) => setTextVibe(e.target.value)}
                  placeholder="z. B. Modern Tech Founder, Executive, Fashion..."
                  className="field-input text-xs w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleAutoTextCreate}
                disabled={isTextGenerating || !textName.trim()}
                className="w-full cryptox-orange-btn !py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,23,0.4)] disabled:opacity-40 cursor-pointer"
              >
                {isTextGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>KI generiert Klon-Profil…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Klon per KI erstellen</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MAIN 2-COLUMN CLONE STUDIO ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: AKTIVER KLON DNA CARD (5 Cols) ───────────── */}
        <div className="lg:col-span-5 space-y-5">
          <div className="cryptox-card-elevated p-6 space-y-5 border border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-orange-500/50 shadow-md">
                  {activeProfile.avatarUrl || activeProfile.referenceImages?.[0] ? (
                    <img
                      src={activeProfile.avatarUrl || activeProfile.referenceImages[0]}
                      alt={activeProfile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-lg">
                      {activeProfile.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">{activeProfile.name}</h2>
                  <p className="text-xs text-orange-400 font-semibold">{activeProfile.genderAge}</p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Klon Bereit
              </span>
            </div>

            {/* Extracted Details */}
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Gesicht &amp; Bart</span>
                <p className="text-zinc-200 font-medium">{activeProfile.hairFace}</p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Haut &amp; Signatur</span>
                <p className="text-zinc-200 font-medium">{activeProfile.tattoosFeatures}</p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Garderobe</span>
                <p className="text-zinc-200 font-medium">{activeProfile.wardrobe}</p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Licht &amp; Kamera</span>
                <p className="text-zinc-200 font-medium">{activeProfile.lightingLook} · {activeProfile.framingCamera}</p>
              </div>
            </div>

            {/* Master Prompt Snippet */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Master-Prompt</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeProfile.customPrefix);
                    toast.success("Master-Prompt kopiert!");
                  }}
                  className="text-[11px] text-orange-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Kopieren
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-zinc-300 max-h-[85px] overflow-y-auto leading-relaxed">
                {activeProfile.customPrefix}
              </div>
            </div>

            {/* Carousel Activation Bridge */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onUseInCarousel) {
                    onUseInCarousel();
                  } else {
                    toast.success("Klon im Karussell Studio ausgewählt!");
                  }
                }}
                className="w-full cryptox-orange-btn !py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,77,23,0.3)] cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Neues Karussell mit {activeProfile.name} erstellen</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: NEUE BILDER GENERIEREN (7 Cols) ─────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Single Image Generator Card */}
          <div className="cryptox-card p-6 sm:p-7 space-y-5 border border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                  <Wand2 className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Neues Einzelbild mit deinem Klon generieren
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-mono">Nano-Banana 2</span>
            </div>

            {/* Prompt Input Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                Was soll dein Klon tun? Wo soll er sein?
              </label>
              <textarea
                rows={3}
                value={singlePrompt}
                onChange={(e) => setSinglePrompt(e.target.value)}
                placeholder="z. B. Im Café mit Laptop, trinken Cappuccino, modernes Fensterlicht..."
                className="field-input text-xs sm:text-sm leading-relaxed font-sans w-full"
              />
            </div>

            {/* Quick Scenario Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Beliebte Szenarien (1-Klick Vorschlag):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SCENARIOS.map((sc) => (
                  <button
                    key={sc.label}
                    type="button"
                    onClick={() => setSinglePrompt(sc.prompt)}
                    className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-zinc-300 hover:text-white hover:border-orange-500/40 hover:bg-orange-500/10 transition-colors cursor-pointer"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio & Generate Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 font-semibold mr-1">Format:</span>
                {(["4:5", "1:1"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSingleRatio(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                      singleRatio === r
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F]"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white",
                    )}
                  >
                    {r === "4:5" ? "4:5 (Instagram Portrait)" : "1:1 (Quadrat)"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateSingle}
                disabled={isGeneratingSingle || !singlePrompt.trim()}
                className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,77,23,0.4)] disabled:opacity-40 cursor-pointer"
              >
                {isGeneratingSingle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rendere Klon-Einzelbild…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Einzelbild jetzt generieren</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Single Images Gallery */}
          {generatedSingles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Kürzlich generierte Einzelbilder ({generatedSingles.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {generatedSingles.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-md aspect-4/5"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-[10px] text-zinc-200 line-clamp-2 mb-2 font-medium">
                        {img.prompt}
                      </p>
                      <div className="flex gap-1.5">
                        <a
                          href={img.url}
                          download={`klon_${img.id}.jpg`}
                          className="flex-1 py-1 px-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold text-center flex items-center justify-center gap-1"
                        >
                          <Download className="h-3 w-3" /> Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
