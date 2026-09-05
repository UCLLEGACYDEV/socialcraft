import { useId, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Shirt,
  Sparkles,
  SunMedium,
  Trash2,
  Upload,
  User,
  UserCheck,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_API_SETTINGS,
  DEFAULT_CLONE_PROFILES,
  assembleClonePrompt,
} from "../defaults";
import { generateImageUnified, makeId, mockGenerateImage } from "../mock-api";
import { analyzePersonaPhoto, type PersonaAnalysisProgress } from "../persona-analyzer";
import { LS, readLS, usePersistentState } from "../storage";
import type { AiCloneProfile, ApiSettings, ClonePlacement } from "../types";
import { cn } from "@/lib/utils";

interface AiCloneViewProps {
  onUseInCarousel?: (clonePrompt: string) => void;
  onUseInDirectPrompt?: (clonePrompt: string) => void;
}

const PLACEMENT_OPTIONS: { id: ClonePlacement; label: string; desc: string }[] = [
  {
    id: "hook_closing",
    label: "Hook & Closing (Empfohlen)",
    desc: "Clone erscheint auf Slide 1 (Cover) und der letzten Slide (CTA). Content-Slides bleiben frei für Grafiken.",
  },
  {
    id: "all_slides",
    label: "Auf allen Slides",
    desc: "Dein Gesicht/Avatar ist das zentrale wiederkehrende Leitmotiv auf jeder einzelnen Slide.",
  },
  {
    id: "even_slides",
    label: "Jede zweite Slide",
    desc: "Wechselt ab zwischen Textgrafik und visuellem Porträt (Slides 2, 4, 6…).",
  },
];

export function AiCloneView({
  onUseInCarousel,
  onUseInDirectPrompt,
}: AiCloneViewProps) {
  const [profiles, setProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeId, setActiveId] = usePersistentState<string>(
    LS.activeCloneId,
    DEFAULT_CLONE_PROFILES[0]?.id ?? "",
  );

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [testImageLoading, setTestImageLoading] = useState(false);
  const [testImages, setTestImages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // KI-Foto-Analysator State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<PersonaAnalysisProgress | null>(null);
  const [lastAnalysisSummary, setLastAnalysisSummary] = useState<string[] | null>(null);

  // Active profile
  const fallbackProfile: AiCloneProfile = DEFAULT_CLONE_PROFILES[0]!;
  const activeProfile: AiCloneProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeId) ?? profiles[0] ?? fallbackProfile;
  }, [profiles, activeId, fallbackProfile]);

  // Patch active profile
  const patchProfile = (patch: Partial<AiCloneProfile>) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfile.id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    );
  };

  // Switch or activate profile
  const handleSelectProfile = (id: string) => {
    setActiveId(id);
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      })),
    );
  };

  // Toggle active status
  const handleToggleActive = () => {
    const nextState = !activeProfile.isActive;
    patchProfile({ isActive: nextState });
    toast.success(
      nextState
        ? `KI Clone „${activeProfile.name}“ aktiviert`
        : `KI Clone „${activeProfile.name}“ deaktiviert`,
    );
  };

  // Create new profile
  const handleCreateProfile = () => {
    const newId = makeId();
    const newProfile: AiCloneProfile = {
      id: newId,
      name: `Neuer Clone ${profiles.length + 1}`,
      isActive: true,
      avatarUrl: "",
      referenceImages: [],
      genderAge: "Mann/Frau, ca. 30 Jahre",
      hairFace: "Kurze dunkle Haare, markante Züge, fokussierter Blick",
      tattoosFeatures: "Keine auffälligen Narben, reine Hautstruktur",
      wardrobe: "Schwarzer minimalistischer Pullover",
      lightingLook: "Dramatisches Seitenlicht, dunkles Studio",
      framingCamera: "Close-up Porträt, 85mm Linse",
      negativePrompt: "Keine Pickel, keine Hautunreinheiten, kein Grinsen, kein Cartoon, keine Verzerrungen",
      customPrefix: "",
      placement: "hook_closing",
      updatedAt: new Date().toISOString(),
    };
    setProfiles((prev) => [newProfile, ...prev]);
    setActiveId(newId);
    toast.success("Neues Profil angelegt");
  };

  // KI-Foto-Analysator Handler
  const handleAnalyzePhoto = async (customImg?: string) => {
    const targetImg = customImg || activeProfile.avatarUrl || activeProfile.referenceImages?.[0];
    if (!targetImg) {
      toast.error("Bitte lade zuerst ein Referenzfoto hoch.");
      fileInputRef.current?.click();
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ step: 1, totalSteps: 5, label: "Initialisiere Vision-Analyse…", percent: 15 });

    const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);
    try {
      const res = await analyzePersonaPhoto(targetImg, {
        apiKey: settings?.kieApiKey,
        onProgress: (p) => setAnalysisProgress(p),
      });

      patchProfile({
        genderAge: res.genderAge,
        hairFace: res.hairFace,
        tattoosFeatures: res.tattoosFeatures,
        wardrobe: res.wardrobe,
        lightingLook: res.lightingLook,
        framingCamera: res.framingCamera,
        negativePrompt: res.negativePrompt,
        customPrefix: res.customPrefix,
      });

      setLastAnalysisSummary(res.analysisSummary);
      toast.success("KI-Foto-Analyse abgeschlossen! Tattoos, Garderobe & Licht synchronisiert (Haut bereinigt).");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler bei der KI-Foto-Analyse";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  // Delete profile
  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      toast.error("Mindestens ein Profil muss erhalten bleiben.");
      return;
    }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) {
      const remaining = profiles.filter((p) => p.id !== id);
      if (remaining[0]) setActiveId(remaining[0].id);
    }
    toast.success("Profil gelöscht");
  };

  // Assembled prompt
  const assembledPrompt = useMemo(() => {
    return assembleClonePrompt(activeProfile);
  }, [activeProfile]);

  // Handle file uploads for reference images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImgs: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImgs.push(event.target.result as string);
        }
        processed++;
        if (processed === files.length) {
          patchProfile({
            referenceImages: [...(activeProfile.referenceImages || []), ...newImgs],
            avatarUrl: activeProfile.avatarUrl || newImgs[0] || "",
          });
          toast.success(`${newImgs.length} Referenzfoto(s) hinzugefügt`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...activeProfile.referenceImages];
    updated.splice(index, 1);
    patchProfile({
      referenceImages: updated,
      avatarUrl: updated[0] || "",
    });
  };

  // Copy prompt prefix
  const handleCopyPrompt = () => {
    void navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    toast.success("Clone-Prompt in Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Test render
  const handleTestRender = async () => {
    setTestImageLoading(true);
    const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);
    try {
      const res = await generateImageUnified({
        slideNumber: testImages.length + 1,
        prompt: assembledPrompt || `Portrait of ${activeProfile.name}, cinematic lighting, photorealistic`,
        settings,
        ...(activeProfile.referenceImages.length > 0 ? { referenceImages: activeProfile.referenceImages } : {}),
      });
      setTestImages((prev) => [res.imageUrl, ...prev]);
      if (res.fromRealApi) {
        toast.success("Test-Visual via Nano-Banana 2 & deiner Persona gerendert! 🍌");
      } else {
        toast.success("Test-Visual mit Persona berechnet (Demo-Modus)!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
      toast.error(msg);
    } finally {
      setTestImageLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <div className="cryptox-card relative overflow-hidden space-y-5 p-6 sm:p-7 border border-white/[0.08]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 shadow-[0_0_15px_-4px_rgba(255,77,23,0.5)]">
                <UserCheck className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                KI Clone & Persona Studio
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
              Definiere dein konsistentes Gesicht, Styling und Lichtkonzept. Sobald aktiviert,
              wird die Persona automatisch in deine Karussell-Prompts eingebaut, sodass dein Look auf allen Slides synchron bleibt.
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleActive}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                activeProfile.isActive
                  ? "cryptox-orange-btn !py-2 !px-4 text-xs font-semibold"
                  : "border border-white/[0.1] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{activeProfile.isActive ? "Persona aktiv (AN)" : "Persona aktivieren (AUS)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCreateProfile}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 text-orange-400" />
              <span>Neues Profil</span>
            </button>
          </div>
        </div>

        {/* ── Profiles Navigation Bar ─────────────────────────────── */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 shrink-0">Profile:</span>
            {profiles.map((p) => {
              const isSelected = p.id === activeProfile.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProfile(p.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium transition-all shrink-0",
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
          </div>

          {profiles.length > 1 && (
            <button
              type="button"
              onClick={() => handleDeleteProfile(activeProfile.id)}
              className="text-xs text-zinc-400 hover:text-destructive flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg hover:bg-destructive/10"
              title="Aktives Profil löschen"
            >
              <Trash2 className="h-3 w-3" /> Löschen
            </button>
          )}
        </div>
      </div>

      {/* ── Main 2-Column Studio Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Structured Form & Settings (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: Profil & Identität */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <User className="h-4 w-4 text-orange-400" />
              1. Identität & Basisdaten
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Profil-Name
                </label>
                <input
                  value={activeProfile.name}
                  onChange={(e) => patchProfile({ name: e.target.value })}
                  placeholder="z. B. Max (Dark Studio)"
                  className="field-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Geschlecht, Alter & Typ
                </label>
                <input
                  value={activeProfile.genderAge}
                  onChange={(e) => patchProfile({ genderAge: e.target.value })}
                  placeholder="z. B. Mann, Anfang 30, mitteleuropäisch"
                  className="field-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                Gesichtszüge, Haare & Bart
              </label>
              <input
                value={activeProfile.hairFace}
                onChange={(e) => patchProfile({ hairFace: e.target.value })}
                placeholder="z. B. Kurze dunkle Haare, gepflegter 3-Tage-Bart, markante Kieferlinie"
                className="field-input text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-orange-400" /> Tattoos, Körperschmuck & Feinheiten
              </label>
              <input
                value={activeProfile.tattoosFeatures || ""}
                onChange={(e) => patchProfile({ tattoosFeatures: e.target.value })}
                placeholder="z. B. Geometrisches Unterarm-Tattoo, Siegelring, definierte Kieferkontur, reine Haut"
                className="field-input text-xs"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Permanente Erkennungsmerkmale (Tattoos, Piercings, Brille). Temporäre Makel (Pickel) werden automatisch herausgefiltert.
              </span>
            </div>
          </div>

          {/* Section 2: Look, Styling & Beleuchtung */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <SunMedium className="h-4 w-4 text-orange-400" />
              2. Signatur-Garderobe & Licht-Look
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1 flex items-center gap-1">
                  <Shirt className="h-3 w-3" /> Kleidung & Outfit
                </label>
                <input
                  value={activeProfile.wardrobe}
                  onChange={(e) => patchProfile({ wardrobe: e.target.value })}
                  placeholder="z. B. Schwarzer Merinowolle-Rollkragen"
                  className="field-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1 flex items-center gap-1">
                  <SunMedium className="h-3 w-3" /> Licht & Stimmung
                </label>
                <input
                  value={activeProfile.lightingLook}
                  onChange={(e) => patchProfile({ lightingLook: e.target.value })}
                  placeholder="z. B. Rembrandt-Seitenlicht, warmes Ember-Rimlight"
                  className="field-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1 flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Kamera & Bildausschnitt
                </label>
                <input
                  value={activeProfile.framingCamera}
                  onChange={(e) => patchProfile({ framingCamera: e.target.value })}
                  placeholder="z. B. 85mm Porträt, f/1.8, Blick leicht vorbei"
                  className="field-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1 flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Negativer Prompt (vermeiden)
                </label>
                <input
                  value={activeProfile.negativePrompt}
                  onChange={(e) => patchProfile({ negativePrompt: e.target.value })}
                  placeholder="z. B. Kein künstliches Grinsen, kein Cartoon"
                  className="field-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Platzierung im Karussell */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Layers className="h-4 w-4 text-orange-400" />
              3. Slide-Platzierung in der Serie
            </div>
            <p className="text-xs text-zinc-400">
              Lege fest, auf welchen Slides deines Karussells diese Persona automatisch eingefügt wird.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PLACEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patchProfile({ placement: opt.id })}
                  className={cn(
                    "flex flex-col text-left rounded-xl border p-3.5 transition-all",
                    activeProfile.placement === opt.id
                      ? "border-orange-500/80 bg-orange-500/15 shadow-[0_0_20px_-8px_rgba(255,77,23,0.4)] text-white"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]",
                  )}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="mt-1 text-[11px] text-zinc-400 leading-snug">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Benutzerdefinierter Prefix-Override */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <label htmlFor="clone-custom-prefix" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                Prompt-Präfix Direkt-Editor (Englisch empfohlen)
              </label>
              <button
                type="button"
                onClick={() => patchProfile({ customPrefix: "" })}
                className="text-xs text-orange-400 hover:underline"
              >
                Aus Feldern neu generieren
              </button>
            </div>
            <textarea
              id="clone-custom-prefix"
              rows={3}
              value={activeProfile.customPrefix}
              onChange={(e) => patchProfile({ customPrefix: e.target.value })}
              placeholder={assembledPrompt}
              className="field-input text-xs leading-relaxed font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              Wird bei aktiver Persona automatisch jedem Bildprompt im Karussell vorangestellt.
            </p>
          </div>
        </div>

        {/* Right Column: References, Live Preview & Test Lab (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Reference Photos & Avatar Upload */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <ImageIcon className="h-4 w-4 text-orange-400" />
                Referenzbilder ({activeProfile.referenceImages?.length || 0})
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white"
              >
                <Upload className="h-3 w-3" /> Foto hochladen
              </button>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <p className="text-xs text-zinc-400">
              Lade deine Fotos hoch. Dienen als visuelle Referenz und zur Generierung von konsistenten Avataren.
            </p>

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {activeProfile.referenceImages?.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.1] bg-black/40"
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                    aria-label="Foto entfernen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Upload trigger tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] text-zinc-400 transition-colors hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-white"
              >
                <Plus className="h-5 w-5 text-orange-400" />
                <span className="text-[10px] font-medium">Hinzufügen</span>
              </button>
            </div>

            {/* ── KI-Foto-Analysator Box (Persona Vision) ─────────── */}
            <div className="rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 via-[#16121b] to-[#110F17] p-4 space-y-3 shadow-[0_0_25px_-8px_rgba(255,77,23,0.3)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">KI-Foto-Analysator</h4>
                    <p className="text-[10px] text-zinc-400">Scannt Tattoos, Haare, Garderobe & Licht – filtert Pickel automatisch heraus</p>
                  </div>
                </div>
                <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                  Vision AI
                </span>
              </div>

              {/* Scan trigger button */}
              <button
                type="button"
                disabled={isAnalyzing || (!activeProfile.avatarUrl && (!activeProfile.referenceImages || activeProfile.referenceImages.length === 0))}
                onClick={() => handleAnalyzePhoto()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold transition-all shadow-md",
                  isAnalyzing
                    ? "bg-orange-500/30 text-orange-200 cursor-not-allowed border border-orange-500/40"
                    : (!activeProfile.avatarUrl && (!activeProfile.referenceImages || activeProfile.referenceImages.length === 0))
                      ? "border border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed"
                      : "cryptox-orange-btn hover:shadow-[0_0_20px_-3px_rgba(255,77,23,0.6)] cursor-pointer"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
                    <span>{analysisProgress?.label || "Analysiere Feinheiten…"}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Foto mit KI analysieren & Prompt zuschneiden</span>
                  </>
                )}
              </button>

              {/* Active Scanning Progress Bar */}
              {isAnalyzing && analysisProgress && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                    <span className="truncate max-w-[240px]">Schritt {analysisProgress.step}/5: {analysisProgress.label}</span>
                    <span className="text-orange-400 font-bold">{analysisProgress.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/60 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(255,77,23,0.8)]"
                      style={{ width: `${analysisProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Analysis Results Summary */}
              {lastAnalysisSummary && !isAnalyzing && (
                <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-400" /> Letzter Analyse-Befund übernommen:
                  </div>
                  <ul className="space-y-1 text-zinc-300">
                    {lastAnalysisSummary.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-tight">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Assembled Prompt Live Box */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Zusammengebauter Prompt
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:underline"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Kopiert!" : "Kopieren"}</span>
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-black/50 p-3.5 text-xs leading-relaxed text-zinc-200 select-all font-mono">
              {assembledPrompt}
            </div>

            {/* Quick Actions into Karussell or Einzelbild */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onUseInCarousel && (
                <button
                  type="button"
                  onClick={() => onUseInCarousel(assembledPrompt)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-orange-400 hover:border-orange-500/40"
                >
                  <Layers className="h-3.5 w-3.5 text-orange-400" />
                  <span>In Karussell</span>
                </button>
              )}

              {onUseInDirectPrompt && (
                <button
                  type="button"
                  onClick={() => onUseInDirectPrompt(assembledPrompt)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-orange-400 hover:border-orange-500/40"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-orange-400" />
                  <span>In Einzelbild</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Render Sandbox */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Persona Test-Render
              </span>
              <button
                type="button"
                onClick={handleTestRender}
                disabled={testImageLoading}
                className="cryptox-orange-btn !py-1.5 !px-3.5 text-xs font-semibold"
              >
                {testImageLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>Testbild generieren</span>
              </button>
            </div>

            {testImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {testImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="aspect-[4/5] w-full rounded-xl border border-white/[0.1] object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.01] p-4 text-center">
                <Lightbulb className="h-5 w-5 text-orange-400/70 mb-1.5" />
                <span className="text-xs text-zinc-400">
                  Noch kein Testbild berechnet. Klicke auf „Testbild generieren“.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
