import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  ArrowRight,
  Palette,
  Wand2,
  X,
  Zap,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Sparkle,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_API_SETTINGS,
  DEFAULT_CLONE_PROFILES,
  assembleClonePrompt,
} from "../defaults";
import { generateImageUnified, makeId, mockGenerateImage } from "../mock-api";
import {
  analyzeInspirationAndFuseWithClone,
  analyzePersonaPhoto,
  type InspirationFusionResult,
  type PersonaAnalysisProgress,
} from "../persona-analyzer";
import { LS, readLS, usePersistentState } from "../storage";
import type { AiCloneProfile, ApiSettings, ClonePlacement } from "../types";
import type { User as AuthUser } from "../auth";
import { AiCloneFlowStudio } from "./AiCloneFlowStudio";
import { DirectPromptView } from "./DirectPromptView";
import { cn } from "@/lib/utils";

// ── Wizard Preset Collections ────────────────────────────────────
const WIZARD_STEPS = [
  { id: 1, label: "Identität", icon: User, desc: "Name, Alter & Rolle" },
  { id: 2, label: "Gesicht & Bart", icon: Sparkles, desc: "Züge, Haare & Bart" },
  { id: 3, label: "Signature & Haut", icon: ShieldCheck, desc: "Tattoos & Makellos-Filter" },
  { id: 4, label: "Garderobe", icon: Shirt, desc: "Signatur-Kleidungsstil" },
  { id: 5, label: "Licht & Kamera", icon: SunMedium, desc: "Studio-Licht & 85mm Linse" },
  { id: 6, label: "Foto & KI-Scan", icon: Camera, desc: "Referenzfotos & Vision-Scan" },
  { id: 7, label: "Aktivierung", icon: Zap, desc: "Slide-Platzierung & Start" },
];

const IDENTITY_ARCHETYPES = [
  { label: "💼 Tech-Gründer / CEO", value: "Mann, Anfang 30, europäisch, souveräner Tech-Gründer & Leader" },
  { label: "🚀 Modern Creator / Influencer", value: "Mann, Ende 20, europäisch, charismatischer Content Creator" },
  { label: "📈 Business Coach & Speaker", value: "Mann, Mitte 30, europäisch, seriöser Keynote Speaker & Stratege" },
  { label: "🎨 Creative Director", value: "Mann, Anfang 30, europäisch, minimalistischer Designer & Visionär" },
  { label: "👑 High-Fashion Persona", value: "Mann/Frau, Ende 20, markantes Model-Profil, High-End Ästhetik" },
];

const HAIR_BEARD_CHIPS = [
  { label: "Kurzer Fade Cut", text: "Kurzer sauberer Fade Cut an den Seiten" },
  { label: "Dunkle strukturierte Haare", text: "Dunkle, matt strukturierte Haare nach oben gestylt" },
  { label: "Gepflegter 3-Tage-Bart", text: "Gepflegter maskuliner 3-Tage-Bart mit klarer Kontur" },
  { label: "Glattrasiert & reine Kontur", text: "Glattrasiert mit definierter Kieferpartie" },
  { label: "Markante Jawline", text: "Markante maskuline Kieferlinie (Jawline)" },
  { label: "Fokussierter Blick", text: "Ruhiger, fokussierter Blick direkt in die Linse" },
  { label: "Volles lockiges Haar", text: "Volles lockiges oder leicht gewelltes Haar" },
];

const FEATURE_CHIPS = [
  { label: "🛡️ Reine Haut (Garantie)", text: "Reine, makellose Hautstruktur ohne temporäre Unreinheiten" },
  { label: "💉 Geometrisches Unterarm-Tattoo", text: "Geometrisches schwarzes Linework-Tattoo am Unterarm" },
  { label: "👓 Filigrane Titan-Brille", text: "Filigrane mattschwarze Titan-Brille" },
  { label: "💍 Minimalistischer Siegelring", text: "Schlichter silberner Siegelring an der linken Hand" },
  { label: "✨ Keine Narben / Makel", text: "Glatte Haut ohne störende Narben oder Rötungen" },
  { label: "⚡ Sportlich-definierte Statur", text: "Sportliche, aufrechte Haltung mit breiten Schultern" },
];

const WARDROBE_PRESETS = [
  {
    title: "Minimalist Rollkragen",
    subtitle: "Steve Jobs / Apple Studio Vibe",
    desc: "Schwarzer feingestrickter Rollkragenpullover aus Merinowolle, tailliert und puristisch",
    icon: "🧶",
  },
  {
    title: "Oversized Wollblazer",
    subtitle: "Editorial Luxury & High-Fashion",
    desc: "Dunkelgrauer anthrazitfarbener Wollblazer im modernen Oversize-Schnitt über schwarzem Basic-Shirt",
    icon: "🧥",
  },
  {
    title: "Monochromer Heavyweight Hoodie",
    subtitle: "Modern Tech Founder & Silicon Valley",
    desc: "Hochwertiger mattschwarzer Heavyweight-Hoodie ohne Aufdruck, cleaner Boxy Fit",
    icon: "👕",
  },
  {
    title: "Maßanzug ohne Krawatte",
    subtitle: "Executive & Private Equity",
    desc: "Dunkelblauer maßgeschneiderter italienischer Wollanzug mit offenem weißem Kragen",
    icon: "👔",
  },
  {
    title: "Biker-Lederjacke",
    subtitle: "Edgy Creator & Streetwear",
    desc: "Mattschwarze strukturierte Premium-Lederjacke mit dezenten Reißverschlüssen",
    icon: "🏍️",
  },
  {
    title: "Clean White Tee & Overshirt",
    subtitle: "Casual Studio & Effortless",
    desc: "Schweres weißes Baumwoll-T-Shirt mit dunklem minimalistischem Overshirt",
    icon: "✨",
  },
];

const LIGHTING_PRESETS = [
  {
    title: "Ember Rimlight Studio",
    subtitle: "Warmes bernsteinfarbenes Kantenlicht",
    desc: "Dunkles High-End Studio, dramatisches warmes bernsteinfarbenes Ember-Kantenlicht von hinten rechts",
    icon: "🔥",
  },
  {
    title: "Cinematic Rembrandt",
    subtitle: "Klassisches Dreiecks-Schattenlicht",
    desc: "Rembrandt-Beleuchtung mit charakteristischem Lichtdreieck auf der Wange, sanft abfallende Schatten",
    icon: "🎬",
  },
  {
    title: "Soft Editorial Daylight",
    subtitle: "Sanftes diffuses Nordlicht",
    desc: "Weiches natürliches Fensterlicht wie aus einem Fotostudio im 4. Stock, ausgewogene Hauttöne",
    icon: "☀️",
  },
  {
    title: "Cyber Neon Violet & Cyan",
    subtitle: "Futuristischer Duo-Tone Look",
    desc: "Subtiles violettes Seitenlicht mit kühlem cyanblauen Konturlicht, moderner Tech-Look",
    icon: "🔮",
  },
];

const CAMERA_PRESETS = [
  { label: "85mm Porträt f/1.8", text: "85mm Porträt-Festbrennweite, f/1.8, samtiges Bokeh im Hintergrund" },
  { label: "50mm Cinematic", text: "50mm Cine-Objektiv, natürliches Sichtfeld, dezente Tiefenschärfe" },
  { label: "Close-up Porträt", text: "Intensiver Close-up Ausschnitt von Brust aufwärts, Schärfe auf den Augen" },
  { label: "Medium Shot (Halbtotale)", text: "Medium Close-up, Oberkörper sichtbar, Hände und Gestik im Bild" },
  { label: "Blick leicht vorbei", text: "Blick fokussiert leicht an der Kamera vorbei, nachdenklich und souverän" },
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

interface AiCloneViewProps {
  currentUser?: AuthUser | null;
  onDeductCredits?: (amount: number) => void;
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
  currentUser,
  onDeductCredits,
  onUseInCarousel,
  onUseInDirectPrompt,
}: AiCloneViewProps) {
  // Studio Mode: "flow" (1-Click Style-Transfer Studio) vs. "dna" (Detailed form)
  const [studioMode, setStudioMode] = useState<"flow" | "dna">("flow");

  // Step-by-step DNA Wizard State (1 to 7)
  const [dnaStep, setDnaStep] = useState<number>(1);
  const [justCreatedProfile, setJustCreatedProfile] = useState<boolean>(false);

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

  // Inspirations- & Style-Fusion State
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const [inspirationImage, setInspirationImage] = useState<string>("");
  const [isFusingInspiration, setIsFusingInspiration] = useState(false);
  const [fusionProgress, setFusionProgress] = useState<PersonaAnalysisProgress | null>(null);
  const [fusionResult, setFusionResult] = useState<InspirationFusionResult | null>(null);

  const DUMMY_PRESET_IDS = useMemo(() => new Set(["editorial-minimalist", "founder-dark-ember", "cyber-visionary", "michael-schmidt"]), []);

  useEffect(() => {
    if (profiles.some((p) => DUMMY_PRESET_IDS.has(p.id))) {
      const cleaned = profiles.filter((p) => !DUMMY_PRESET_IDS.has(p.id));
      setProfiles(cleaned);
      if (cleaned[0]) setActiveId(cleaned[0].id);
      else setActiveId("");
    }
  }, [profiles, setProfiles, setActiveId, DUMMY_PRESET_IDS]);

  // Active profile
  const fallbackProfile: AiCloneProfile = useMemo(() => ({
    id: "new_clone",
    name: "Mein KI-Klon",
    isActive: true,
    avatarUrl: "",
    referenceImages: [],
    genderAge: "",
    hairFace: "",
    tattoosFeatures: "",
    wardrobe: "",
    lightingLook: "",
    framingCamera: "",
    negativePrompt: "Keine Pickel, keine Hautunreinheiten, kein künstliches Grinsen, keine Cartoon-Ästhetik",
    customPrefix: "",
    placement: "hook_closing",
    updatedAt: new Date().toISOString(),
  }), []);

  const activeProfile: AiCloneProfile = useMemo(() => {
    const valid = profiles.filter((p) => !DUMMY_PRESET_IDS.has(p.id));
    return valid.find((p) => p.id === activeId) ?? valid[0] ?? fallbackProfile;
  }, [profiles, activeId, fallbackProfile, DUMMY_PRESET_IDS]);

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

  // Create new profile & launch Guided Step-by-Step Wizard
  const handleCreateProfile = () => {
    const newId = makeId();
    const newProfile: AiCloneProfile = {
      id: newId,
      name: `Neuer Klon ${profiles.length + 1}`,
      isActive: true,
      avatarUrl: "",
      referenceImages: [],
      genderAge: "Mann, Anfang 30, europäisch",
      hairFace: "Kurze dunkle Haare, gepflegter 3-Tage-Bart, markante Kieferlinie",
      tattoosFeatures: "Reine, makellose Hautstruktur ohne temporäre Makel",
      wardrobe: "Schwarzer minimalistischer Merinowolle-Rollkragen",
      lightingLook: "Dunkles High-End Studio, warmes bernsteinfarbenes Ember-Kantenlicht",
      framingCamera: "85mm Porträt-Festbrennweite, f/1.8, samtiges Bokeh",
      negativePrompt: "Keine Pickel, keine Hautunreinheiten, kein künstliches Grinsen, kein Cartoon, keine Verzerrungen",
      customPrefix: "",
      placement: "hook_closing",
      updatedAt: new Date().toISOString(),
    };
    setProfiles((prev) => [newProfile, ...prev]);
    setActiveId(newId);
    setStudioMode("dna");
    setDnaStep(1);
    setJustCreatedProfile(true);
    toast.success("Neues Profil angelegt! Starte mit Schritt 1 der Anleitung.");
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

  // Inspirations-Foto Upload Handler
  const handleInspirationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInspirationImage(event.target.result as string);
        toast.success("Inspirationsfoto geladen! Klicke jetzt auf 'Stil auf Klon übertragen'.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Inspirations-Stil analysieren & auf Klon fusionieren
  const handleRunInspirationFusion = async (customUrl?: string) => {
    const targetUrl = customUrl || inspirationImage;
    if (!targetUrl) {
      toast.error("Bitte wähle zuerst ein Inspirationsfoto aus oder lade ein Foto hoch.");
      inspirationInputRef.current?.click();
      return;
    }

    setIsFusingInspiration(true);
    setFusionProgress({ step: 1, totalSteps: 4, label: "Scanne Inspirationsbild nach Garderobe & Schnitt…", percent: 25 });

    const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);
    try {
      const result = await analyzeInspirationAndFuseWithClone(targetUrl, activeProfile, {
        apiKey: settings?.kieApiKey,
        onProgress: (p) => setFusionProgress(p),
      });

      setFusionResult(result);
      toast.success(`Inspirations-Stil erfolgreich auf ${activeProfile.name} übertragen!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler bei der Style-Fusion";
      toast.error(msg);
    } finally {
      setIsFusingInspiration(false);
      setFusionProgress(null);
    }
  };

  // Fusion-Ergebnis direkt auf das Klon-Profil anwenden
  const handleApplyFusionToProfile = () => {
    if (!fusionResult) return;
    patchProfile({
      wardrobe: fusionResult.extractedWardrobe,
      lightingLook: fusionResult.extractedLighting,
      framingCamera: fusionResult.extractedPose,
      negativePrompt: fusionResult.negativePrompt,
      customPrefix: fusionResult.fusedPrompt,
    });
    toast.success(`Garderobe & Licht-Look direkt in Klon „${activeProfile.name}“ gespeichert!`);
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

      {/* ── Studio Mode Switcher: 1-Click Flow vs. Klon-DNA ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-inner mb-6">
        <button
          type="button"
          onClick={() => setStudioMode("flow")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
            studioMode === "flow"
              ? "bg-gradient-to-r from-[#FF4D17] to-amber-500 text-white shadow-[0_0_20px_rgba(255,77,23,0.4)]"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
          )}
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>⚡ 1-Click Klon Studio & Style-Transfer</span>
          <span className="rounded bg-black/30 px-2 py-0.5 text-[10px] font-mono text-white/90">
            Aktiv
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStudioMode("dna")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
            studioMode === "dna"
              ? "bg-white/10 text-white border border-white/20 shadow-md font-bold"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
          )}
        >
          <SlidersHorizontal className="h-4 w-4 text-orange-400" />
          <span>⚙️ Klon-DNA Schritt-für-Schritt Anleitung (7 Schritte)</span>
          <span className="rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 text-[10px] font-mono">
            Stufe {dnaStep}/7
          </span>
        </button>
      </div>

      {studioMode === "flow" ? (
        <AiCloneFlowStudio
          currentUser={currentUser}
          onDeductCredits={onDeductCredits}
          onOpenDetailedDna={() => setStudioMode("dna")}
        />
      ) : (
        /* ── 7-Schritte Klon-DNA Wizard & Live-Studio ────────────── */
        <div className="space-y-6">
          {/* Welcome / Onboarding Banner when creating new profile */}
          {justCreatedProfile && (
            <div className="relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/15 via-[#1a1322] to-amber-500/10 p-4 sm:p-5 flex items-start justify-between gap-3 shadow-[0_0_30px_-5px_rgba(255,77,23,0.3)] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Neues Klon-Profil gestartet:</span>
                    <span className="text-orange-400 font-mono">„{activeProfile.name}“</span>
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Folge jetzt dieser geführten <strong>7-Schritte-Anleitung</strong>. Klicke auf die Schnell-Chips, um Züge, Bart, Garderobe und Licht mit 1 Klick einzurichten.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJustCreatedProfile(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0"
                title="Hinweis schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Wizard Stepper Bar (1 bis 7) ───────────────────────── */}
          <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/90 backdrop-blur-xl p-4 sm:p-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs">
                  {dnaStep}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Schritt-für-Schritt Assistent: {WIZARD_STEPS[dnaStep - 1]?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span>Schritt {dnaStep} von 7</span>
                <span className="text-orange-400 font-bold">({Math.round((dnaStep / 7) * 100)}% abgeschlossen)</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/60 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(255,77,23,0.8)]"
                style={{ width: `${(dnaStep / 7) * 100}%` }}
              />
            </div>

            {/* Stepper Navigation Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1">
              {WIZARD_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = dnaStep === step.id;
                const isPassed = dnaStep > step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setDnaStep(step.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left transition-all border cursor-pointer",
                      isActive
                        ? "border-orange-500 bg-orange-500/15 shadow-[0_0_15px_-3px_rgba(255,77,23,0.4)] text-white font-semibold"
                        : isPassed
                          ? "border-emerald-500/30 bg-emerald-500/[0.04] text-zinc-300 hover:border-emerald-500/50"
                          : "border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-orange-500 text-white"
                          : isPassed
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/10 text-zinc-400",
                      )}
                    >
                      {isPassed ? <Check className="h-3 w-3" /> : step.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold truncate leading-tight">{step.label}</p>
                      <p className="text-[9px] text-zinc-400 truncate hidden sm:block">{step.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main 2-Column Wizard Grid ───────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Active Step Card (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* ──────────────── STEP 1: IDENTITÄT ──────────────── */}
              {dnaStep === 1 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <User className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 1: Identität & Basisdaten</h2>
                        <p className="text-[11px] text-zinc-400">Name, Alter, Geschlecht und primäre Persona-Rolle</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Stufe 1/7
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                        Profil-Name <span className="text-orange-400">*</span>
                      </label>
                      <input
                        value={activeProfile.name}
                        onChange={(e) => patchProfile({ name: e.target.value })}
                        placeholder="z. B. Max (Tech Founder)"
                        className="field-input text-xs"
                      />
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        Name zur Identifikation in deiner Klon-Bibliothek.
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                        Geschlecht, Alter & Typ <span className="text-orange-400">*</span>
                      </label>
                      <input
                        value={activeProfile.genderAge}
                        onChange={(e) => patchProfile({ genderAge: e.target.value })}
                        placeholder="z. B. Mann, Anfang 30, mitteleuropäisch"
                        className="field-input text-xs"
                      />
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        Basis-Definition für KI-Gesichtsstrukturen.
                      </span>
                    </div>
                  </div>

                  {/* One-Click Archetype Quick Selector */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                      1-Klick Vorlage wählen (Archetyp):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {IDENTITY_ARCHETYPES.map((arch, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => patchProfile({ genderAge: arch.value })}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer",
                            activeProfile.genderAge === arch.value
                              ? "border-orange-500 bg-orange-500/20 text-orange-300 font-semibold shadow-sm"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]",
                          )}
                        >
                          {arch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5 flex items-start gap-3">
                    <HelpCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      💡 <strong>Tipp für Gesichts-Konsistenz:</strong> Ein präzises Alter (z. B. „Anfang 30“) verhindert, dass der Klon zwischen verschiedenen Generationen jünger oder älter dargestellt wird.
                    </p>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 2: GESICHT & BART ────────── */}
              {dnaStep === 2 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 2: Gesichtszüge, Haare & Bart</h2>
                        <p className="text-[11px] text-zinc-400">Haarschnitt, Haarfarbe, Bart-Stil und Gesichtsgeometrie</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Stufe 2/7
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Gesichtsmerkmale, Haare & Bartstil
                    </label>
                    <textarea
                      rows={3}
                      value={activeProfile.hairFace}
                      onChange={(e) => patchProfile({ hairFace: e.target.value })}
                      placeholder="z. B. Kurze dunkle Haare, gepflegter 3-Tage-Bart, markante Kieferlinie, fokussierter Blick"
                      className="field-input text-xs leading-relaxed"
                    />
                  </div>

                  {/* One-Click Hair & Beard Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-orange-400" />
                      Schnell-Merkmale hinzufügen (Klick ergänzt das Feld):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {HAIR_BEARD_CHIPS.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const current = activeProfile.hairFace?.trim() || "";
                            if (!current) {
                              patchProfile({ hairFace: chip.text });
                            } else if (!current.toLowerCase().includes(chip.text.toLowerCase())) {
                              patchProfile({ hairFace: `${current}, ${chip.text}` });
                            }
                            toast.success(`„${chip.label}“ hinzugefügt`);
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>+</span> {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5 flex items-start gap-3">
                    <HelpCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      💡 <strong>Profi-Tipp:</strong> Halte Haarschnitt und Bartlänge über alle Folien hinweg identisch. Wenn du zwischen Glattrasiert und Vollbart wechselst, lege dafür zwei getrennte Klon-Profile an.
                    </p>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 3: SIGNATURE & HAUT ───────── */}
              {dnaStep === 3 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 3: Signature-Merkmale & Blemish-Filter</h2>
                        <p className="text-[11px] text-zinc-400">Permanente Erkennungsmerkmale und automatischer Makellos-Filter</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Stufe 3/7
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                      Tattoos, Schmuck & permanente Signature-Merkmale
                    </label>
                    <textarea
                      rows={2}
                      value={activeProfile.tattoosFeatures || ""}
                      onChange={(e) => patchProfile({ tattoosFeatures: e.target.value })}
                      placeholder="z. B. Geometrisches Unterarm-Tattoo, schlichter Siegelring, reine Hautstruktur"
                      className="field-input text-xs leading-relaxed"
                    />
                  </div>

                  {/* Feature Quick Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-orange-400" />
                      Schnell-Merkmale hinzufügen:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FEATURE_CHIPS.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const current = activeProfile.tattoosFeatures?.trim() || "";
                            if (!current) {
                              patchProfile({ tattoosFeatures: chip.text });
                            } else if (!current.toLowerCase().includes(chip.text.toLowerCase())) {
                              patchProfile({ tattoosFeatures: `${current}, ${chip.text}` });
                            }
                            toast.success(`„${chip.label}“ hinzugefügt`);
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>+</span> {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negative Prompt / Filter */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5 text-orange-400" />
                      Negativer Prompt (Unerwünschtes automatisch herausfiltern)
                    </label>
                    <input
                      value={activeProfile.negativePrompt}
                      onChange={(e) => patchProfile({ negativePrompt: e.target.value })}
                      placeholder="z. B. Keine Pickel, keine Unreinheiten, kein Grinsen, kein Cartoon"
                      className="field-input text-xs"
                    />
                  </div>

                  {/* Automatic Blemish Filter Badge */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-300">
                        Automatischer Magazin-Hautfilter aktiviert
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        Temporäre Hautunreinheiten wie Pickel oder Rötungen werden bei allen Klon-Generierungen garantiert herausgefiltert. Deine permanenten Merkmale wie Tattoos, Brille und Knochenstruktur bleiben exakt erhalten!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 4: GARDEROBE ─────────────── */}
              {dnaStep === 4 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <Shirt className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 4: Signatur-Garderobe & Outfit</h2>
                        <p className="text-[11px] text-zinc-400">Der unverwechselbare Kleidungsstil deines Klons</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Stufe 4/7
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Signatur-Kleidung (Textbeschreibung)
                    </label>
                    <input
                      value={activeProfile.wardrobe}
                      onChange={(e) => patchProfile({ wardrobe: e.target.value })}
                      placeholder="z. B. Schwarzer Merinowolle-Rollkragen"
                      className="field-input text-xs"
                    />
                  </div>

                  {/* Wardrobe Preset Grid */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                      Wähle eine Signature-Garderobe mit 1 Klick:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {WARDROBE_PRESETS.map((w, idx) => {
                        const isSelected = activeProfile.wardrobe === w.desc;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              patchProfile({ wardrobe: w.desc });
                              toast.success(`Outfit „${w.title}“ übernommen!`);
                            }}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-orange-500 bg-orange-500/15 shadow-[0_0_15px_-4px_rgba(255,77,23,0.5)] text-white"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                            )}
                          >
                            <span className="text-xl p-1.5 rounded-lg bg-black/40 shrink-0">
                              {w.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{w.title}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{w.desc}</p>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 5: LICHT & KAMERA ────────── */}
              {dnaStep === 5 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <SunMedium className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 5: Beleuchtung & Kamera-Linse</h2>
                        <p className="text-[11px] text-zinc-400">Studio-Lichtkonzept und 85mm Festbrennweiten-Look</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Stufe 5/7
                    </span>
                  </div>

                  {/* Lighting Presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <SunMedium className="h-3.5 w-3.5 text-orange-400" />
                      Lichtstimmung & Studio-Atmosphäre
                    </label>
                    <input
                      value={activeProfile.lightingLook}
                      onChange={(e) => patchProfile({ lightingLook: e.target.value })}
                      placeholder="z. B. Dunkles Studio, warmes Ember-Rimlight"
                      className="field-input text-xs mb-2"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {LIGHTING_PRESETS.map((l, idx) => {
                        const isSelected = activeProfile.lightingLook === l.desc;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              patchProfile({ lightingLook: l.desc });
                              toast.success(`Licht „${l.title}“ gewählt!`);
                            }}
                            className={cn(
                              "flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-orange-500 bg-orange-500/15 text-white"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                            )}
                          >
                            <span className="text-lg shrink-0">{l.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate">{l.title}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{l.subtitle}</p>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Camera & Framing */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-orange-400" />
                      Kamera, Brennweite & Bildausschnitt
                    </label>
                    <input
                      value={activeProfile.framingCamera}
                      onChange={(e) => patchProfile({ framingCamera: e.target.value })}
                      placeholder="z. B. 85mm Porträt-Festbrennweite, f/1.8, samtiges Bokeh"
                      className="field-input text-xs mb-2"
                    />

                    <div className="flex flex-wrap gap-2">
                      {CAMERA_PRESETS.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            patchProfile({ framingCamera: c.text });
                            toast.success(`Linse: ${c.label}`);
                          }}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs border transition-all cursor-pointer",
                            activeProfile.framingCamera === c.text
                              ? "border-orange-500 bg-orange-500/20 text-orange-300 font-semibold"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:text-white",
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 6: FOTO & SCAN ───────────── */}
              {dnaStep === 6 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <Camera className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 6: Referenzfoto & KI-Vision-Scan</h2>
                        <p className="text-[11px] text-zinc-400">Lade Porträts hoch und lasse die KI deine Merkmale automatisch scannen</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Stufe 6/7
                    </span>
                  </div>

                  {/* Photo Dropzone & Thumbnails */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300">
                        Deine Porträtfotos ({activeProfile.referenceImages?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer"
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

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {activeProfile.referenceImages?.map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.1] bg-black/40"
                        >
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                            aria-label="Foto entfernen"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {activeProfile.avatarUrl === img && (
                            <span className="absolute bottom-1 left-1 rounded bg-orange-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              Avatar
                            </span>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] text-zinc-400 transition-colors hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-white cursor-pointer"
                      >
                        <Plus className="h-5 w-5 text-orange-400" />
                        <span className="text-[10px] font-medium">Hinzufügen</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click KI-Foto-Analysator Box */}
                  <div className="rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 via-[#16121b] to-[#110F17] p-4 space-y-3 shadow-[0_0_25px_-8px_rgba(255,77,23,0.3)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                          <Wand2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">Automatischer KI-Foto-Scan (Vision AI)</h4>
                          <p className="text-[10px] text-zinc-400">Scannt dein Foto und füllt alle DNA-Felder automatisch mit 1 Klick aus</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                        1-Klick Scan
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isAnalyzing || (!activeProfile.avatarUrl && (!activeProfile.referenceImages || activeProfile.referenceImages.length === 0))}
                      onClick={() => handleAnalyzePhoto()}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold transition-all shadow-md cursor-pointer",
                        isAnalyzing
                          ? "bg-orange-500/30 text-orange-200 cursor-not-allowed border border-orange-500/40"
                          : (!activeProfile.avatarUrl && (!activeProfile.referenceImages || activeProfile.referenceImages.length === 0))
                            ? "border border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed"
                            : "cryptox-orange-btn hover:shadow-[0_0_20px_-3px_rgba(255,77,23,0.6)]"
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
                          <span>{analysisProgress?.label || "Analysiere Porträt…"}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Foto analysieren & Klon-DNA automatisch befüllen</span>
                        </>
                      )}
                    </button>

                    {/* Progress Bar */}
                    {isAnalyzing && analysisProgress && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                          <span>Schritt {analysisProgress.step}/5: {analysisProgress.label}</span>
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

                    {/* Analysis Summary */}
                    {lastAnalysisSummary && !isAnalyzing && (
                      <div className="rounded-lg border border-emerald-500/30 bg-black/40 p-3 space-y-1.5 text-[11px]">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-400" /> KI-Vision Scan erfolgreich abgeschlossen:
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
              )}

              {/* ──────────────── STEP 7: AKTIVIERUNG & TEST ─────── */}
              {dnaStep === 7 && (
                <div className="cryptox-card relative overflow-hidden rounded-2xl border border-orange-500/40 bg-gradient-to-b from-[#181220] via-[#120E19] to-[#0D0914] p-5 sm:p-6 space-y-5 shadow-[0_15px_60px_-10px_rgba(255,77,23,0.3)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                        <Zap className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">Schritt 7: Platzierung & Klon aktivieren</h2>
                        <p className="text-[11px] text-zinc-400">Slide-Regel festlegen, Test-Render prüfen und Klon aktivieren</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      Finaler Schritt
                    </span>
                  </div>

                  {/* Placement Selector */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-orange-400" />
                      Slide-Platzierung in deinen Instagram-Karussells
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {PLACEMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => patchProfile({ placement: opt.id })}
                          className={cn(
                            "flex flex-col text-left rounded-xl border p-3 transition-all cursor-pointer",
                            activeProfile.placement === opt.id
                              ? "border-orange-500 bg-orange-500/15 shadow-[0_0_15px_-4px_rgba(255,77,23,0.4)] text-white"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                          )}
                        >
                          <span className="text-xs font-bold leading-tight">{opt.label}</span>
                          <span className="mt-1 text-[10px] text-zinc-400 leading-snug">
                            {opt.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clone Profile Summary Badge */}
                  <div className="rounded-xl border border-white/[0.1] bg-black/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Zusammenfassung: {activeProfile.name}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        activeProfile.isActive
                          ? "border-orange-500/50 bg-orange-500/20 text-orange-300"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      )}>
                        {activeProfile.isActive ? "Bereits Aktiviert" : "Noch Inaktiv"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-lg bg-white/[0.02] p-2 border border-white/5">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Alter & Typ</span>
                        <span className="text-zinc-200 font-medium truncate block">{activeProfile.genderAge}</span>
                      </div>
                      <div className="rounded-lg bg-white/[0.02] p-2 border border-white/5">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Garderobe</span>
                        <span className="text-zinc-200 font-medium truncate block">{activeProfile.wardrobe}</span>
                      </div>
                      <div className="rounded-lg bg-white/[0.02] p-2 border border-white/5">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Licht & Linse</span>
                        <span className="text-zinc-200 font-medium truncate block">{activeProfile.lightingLook}</span>
                      </div>
                    </div>
                  </div>

                  {/* Giant Activate CTA Button */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        patchProfile({ isActive: true });
                        toast.success(`🚀 Klon „${activeProfile.name}“ gespeichert & für Karussells aktiviert!`);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold bg-gradient-to-r from-[#FF4D17] to-amber-500 text-white shadow-[0_0_30px_rgba(255,77,23,0.6)] hover:shadow-[0_0_40px_rgba(255,77,23,0.8)] transition-all cursor-pointer transform hover:scale-[1.01]"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Klon-Profil speichern &amp; für Karussells aktivieren 🚀</span>
                    </button>

                    <div className="flex items-center justify-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setStudioMode("flow")}
                        className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>⚡ Zum 1-Click Klon Studio wechseln</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Wizard Step Navigation Footer ─────────────────── */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.08] bg-[#110F17]/80 backdrop-blur-xl">
                <button
                  type="button"
                  disabled={dnaStep <= 1}
                  onClick={() => setDnaStep((prev) => Math.max(1, prev - 1))}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                    dnaStep <= 1
                      ? "opacity-30 border-white/5 text-zinc-600 cursor-not-allowed"
                      : "border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.08] cursor-pointer",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Vorheriger Schritt</span>
                </button>

                <div className="text-center">
                  <span className="text-xs font-mono text-zinc-400">
                    Schritt <strong className="text-white">{dnaStep}</strong> von 7
                  </span>
                </div>

                {dnaStep < 7 ? (
                  <button
                    type="button"
                    onClick={() => setDnaStep((prev) => Math.min(7, prev + 1))}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold cryptox-orange-btn cursor-pointer shadow-md"
                  >
                    <span>Weiter: {WIZARD_STEPS[dnaStep]?.label}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      patchProfile({ isActive: true });
                      toast.success(`🚀 Klon „${activeProfile.name}“ gespeichert & aktiviert!`);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-md"
                  >
                    <Check className="h-4 w-4" />
                    <span>Fertig &amp; Aktiviert!</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Live Clone Pass & Test Sandbox (5 cols) */}
            <div className="space-y-6 lg:col-span-5">
              {/* ── Live Clone Identity Pass ───────────────────────── */}
              <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                      <UserCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Live Klon-Identitäts-Pass
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      activeProfile.isActive
                        ? "border-orange-500/50 bg-orange-500/15 text-orange-400"
                        : "border-white/10 bg-white/5 text-zinc-400",
                    )}
                  >
                    {activeProfile.isActive ? "● Aktiviert" : "○ Inaktiv"}
                  </span>
                </div>

                {/* Avatar & Key Profile Tags */}
                <div className="flex items-center gap-3.5">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/20 bg-black/60 shrink-0">
                    {activeProfile.avatarUrl ? (
                      <img
                        src={activeProfile.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{activeProfile.name}</h3>
                    <p className="text-[11px] text-zinc-400 truncate">{activeProfile.genderAge || "Keine Basisdaten"}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                        85mm Bokeh
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">
                        Reine Haut
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                        {activeProfile.placement === "hook_closing" ? "Hook & CTA" : "Alle Slides"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assembled Prompt Preview Box */}
                <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Live Klon-Prompt (automatisch generiert)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Kopiert!" : "Kopieren"}</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-black/60 p-3 text-[11px] leading-relaxed text-zinc-200 select-all font-mono max-h-32 overflow-y-auto">
                    {assembledPrompt}
                  </div>

                  {/* Transfer to Carousel / Einzelbild */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {onUseInCarousel && (
                      <button
                        type="button"
                        onClick={() => onUseInCarousel(assembledPrompt)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-orange-400 hover:border-orange-500/40 cursor-pointer"
                      >
                        <Layers className="h-3.5 w-3.5 text-orange-400" />
                        <span>In Karussell</span>
                      </button>
                    )}

                    {onUseInDirectPrompt && (
                      <button
                        type="button"
                        onClick={() => onUseInDirectPrompt(assembledPrompt)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-orange-500/15 hover:text-orange-400 hover:border-orange-500/40 cursor-pointer"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-orange-400" />
                        <span>In Einzelbild</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Test Render Sandbox ───────────────────────────── */}
              <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/85 backdrop-blur-xl p-5 sm:p-6 space-y-3.5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Persona Test-Render
                  </span>
                  <button
                    type="button"
                    onClick={handleTestRender}
                    disabled={testImageLoading}
                    className="cryptox-orange-btn !py-1.5 !px-3.5 text-xs font-semibold cursor-pointer"
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
                      Noch kein Testbild berechnet. Klicke auf „Testbild generieren“, um das Klon-Visual vorab zu prüfen.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
