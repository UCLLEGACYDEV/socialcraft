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
  autoGeneratePersonaProfile,
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
  // Streamlined 1-Click Creator Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createAge, setCreateAge] = useState("28");
  const [createGender, setCreateGender] = useState<"male" | "female" | "diverse">("male");
  const [createVibe, setCreateVibe] = useState("Tech Founder / Modern Creator");
  const [createPhoto, setCreatePhoto] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState<PersonaAnalysisProgress | null>(null);
  const createPhotoInputRef = useRef<HTMLInputElement>(null);

  const [studioMode, setStudioMode] = useState<"flow" | "dna">("flow");
  const [profiles, setProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeId, setActiveId] = usePersistentState<string>(
    LS.activeCloneId,
    DEFAULT_CLONE_PROFILES[0]?.id ?? "",
  );

  const [testImageLoading, setTestImageLoading] = useState(false);
  const [testImages, setTestImages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const DUMMY_PRESET_IDS = useMemo(() => new Set(["editorial-minimalist", "founder-dark-ember", "cyber-visionary", "michael-schmidt"]), []);

  useEffect(() => {
    if (profiles.some((p) => DUMMY_PRESET_IDS.has(p.id))) {
      const cleaned = profiles.filter((p) => !DUMMY_PRESET_IDS.has(p.id));
      setProfiles(cleaned);
      if (cleaned[0]) setActiveId(cleaned[0].id);
      else setActiveId("");
    }
  }, [profiles, setProfiles, setActiveId, DUMMY_PRESET_IDS]);

  const fallbackProfile: AiCloneProfile = useMemo(() => ({
    id: "new_clone",
    name: "Mein KI-Klon",
    isActive: true,
    avatarUrl: "",
    referenceImages: [],
    genderAge: "Mann, Anfang 30",
    hairFace: "Kurze dunkle Haare, gepflegter 3-Tage-Bart, markante Kieferlinie",
    tattoosFeatures: "Reine, makellose Hautstruktur ohne temporäre Unreinheiten",
    wardrobe: "Schwarzer feingestrickter Merinowolle-Rollkragen",
    lightingLook: "Dunkles High-End Studio, warmes bernsteinfarbenes Ember-Kantenlicht",
    framingCamera: "85mm Porträt-Festbrennweite, f/1.8, samtiges Bokeh",
    negativePrompt: "Keine Pickel, keine Hautunreinheiten, kein künstliches Grinsen, keine Cartoon-Ästhetik",
    customPrefix: "",
    placement: "hook_closing",
    updatedAt: new Date().toISOString(),
  }), []);

  const activeProfile: AiCloneProfile = useMemo(() => {
    const valid = profiles.filter((p) => !DUMMY_PRESET_IDS.has(p.id));
    return valid.find((p) => p.id === activeId) ?? valid[0] ?? fallbackProfile;
  }, [profiles, activeId, fallbackProfile, DUMMY_PRESET_IDS]);

  const patchProfile = (patch: Partial<AiCloneProfile>) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfile.id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    );
  };

  const handleSelectProfile = (id: string) => {
    setActiveId(id);
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      })),
    );
  };

  const handleToggleActive = () => {
    const nextState = !activeProfile.isActive;
    patchProfile({ isActive: nextState });
    toast.success(
      nextState
        ? `KI Clone „${activeProfile.name}“ aktiviert`
        : `KI Clone „${activeProfile.name}“ deaktiviert`,
    );
  };

  // 1-Click Auto-Generate Persona from Name, Alter, Geschlecht
  const handleAutoCreateClone = async () => {
    const name = createName.trim() || (createGender === "female" ? "Sarah" : createGender === "diverse" ? "Alex" : "Michael");
    setIsCreating(true);
    try {
      const settings = readLS<ApiSettings>(LS.apiSettings, DEFAULT_API_SETTINGS);
      const analysis = await autoGeneratePersonaProfile(
        {
          name,
          age: createAge,
          gender: createGender,
          vibe: createVibe,
          referencePhotoUrl: createPhoto || undefined,
        },
        {
          apiKey: settings?.kieApiKey,
          onProgress: (p) => setCreateProgress(p),
        },
      );

      const newProfile: AiCloneProfile = {
        id: `clone_${makeId()}`,
        name,
        isActive: true,
        avatarUrl: createPhoto || "",
        referenceImages: createPhoto ? [createPhoto] : [],
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
      setShowCreateModal(false);
      setCreateName("");
      setCreatePhoto("");
      toast.success(`🎉 Neuer KI-Klon „${name}“ erfolgreich generiert & aktiviert!`);
    } catch (err: unknown) {
      toast.error("Fehler bei der Profilgenerierung: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setIsCreating(false);
      setCreateProgress(null);
    }
  };

  // Create new profile button triggers 1-Click modal
  const handleCreateProfile = () => {
    setShowCreateModal(true);
  };

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

  const assembledPrompt = useMemo(() => {
    return assembleClonePrompt(activeProfile);
  }, [activeProfile]);

  const handleCopyPrompt = () => {
    void navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    toast.success("Clone-Prompt in Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

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
      toast.success(res.fromRealApi ? "Test-Visual via Nano-Banana 2 & Persona gerendert! 🍌" : "Test-Visual mit Persona berechnet!");
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
                KI Clone &amp; Persona Studio
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
              Definiere Name, Alter und Geschlecht — die KI analysiert und generiert Gesicht, Bart, Garderobe und Licht automatisch.
              Sobald aktiviert, bleibt dein konsistenter Look auf allen Karussell-Slides synchron.
            </p>
          </div>

          {/* Quick Actions Header */}
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
              <span>{activeProfile.isActive ? "Persona aktiv (AN)" : "Persona aktivieren (AUS)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCreateProfile}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#FF4D17]/40 bg-[#FF4D17]/15 px-4 py-2 text-xs font-semibold text-orange-300 transition-colors hover:bg-[#FF4D17]/30 hover:text-white cursor-pointer shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span>Neuen Klon erstellen (3s)</span>
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

      {/* ── MODAL: 1-CLICK KI-KLON ERSTELLEN ─────────────────────── */}
      {showCreateModal && (
        <div className="p-6 rounded-2xl border border-[#FF4D17]/40 bg-gradient-to-b from-[#FF4D17]/10 via-[#110F17]/95 to-[#110F17] space-y-5 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#FF4D17] to-amber-500 text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,77,23,0.4)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>KI-Klon in 3 Sekunden erstellen</span>
                  <span className="rounded bg-[#FF4D17]/20 text-[#FF4D17] border border-[#FF4D17]/40 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                    Vollautomatisch
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Gib nur Name, Alter &amp; Geschlecht ein — Gesicht, Bart, Haarschnitt, Kleidung &amp; Licht generiert die KI selbst!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Name */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                1. Name:
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="z. B. Michael"
                className="field-input text-xs w-full"
              />
            </div>

            {/* 2. Alter */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                2. Alter:
              </label>
              <input
                type="text"
                value={createAge}
                onChange={(e) => setCreateAge(e.target.value)}
                placeholder="z. B. 28 oder Anfang 30"
                className="field-input text-xs w-full"
              />
            </div>

            {/* 3. Geschlecht */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                3. Geschlecht:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["male", "female", "diverse"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCreateGender(g)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                      createGender === g
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-white font-bold shadow-[0_0_12px_rgba(255,77,23,0.3)]"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]",
                    )}
                  >
                    {g === "male" ? "👨 Mann" : g === "female" ? "👩 Frau" : "✨ Divers"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vibe Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              4. Vibe &amp; Persona-Stil (Optional):
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Tech Founder / Modern Creator",
                "Business Coach & Speaker",
                "Creative Director & Designer",
                "High-Fashion & Luxury Editorial",
                "Athletic & Fitness Leader",
              ].map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => setCreateVibe(vibe)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-all border cursor-pointer",
                    createVibe === vibe
                      ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF4D17] font-semibold"
                      : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20",
                  )}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Selfie / Photo Attachment */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Camera className="h-4 w-4 text-orange-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-white">Eigenes Foto / Selfie anhängen</span>
                <span className="text-zinc-400 ml-1.5">(Rein optional — die KI erstellt ansonsten ein fotorealistisches Gesicht)</span>
              </div>
            </div>

            <input
              ref={createPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) setCreatePhoto(ev.target.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />

            {createPhoto ? (
              <div className="flex items-center gap-2 shrink-0">
                <img src={createPhoto} alt="" className="h-7 w-7 rounded-lg object-cover border border-[#FF4D17]" />
                <span className="text-[11px] text-emerald-400 font-semibold">Foto geladen ✓</span>
                <button
                  type="button"
                  onClick={() => setCreatePhoto("")}
                  className="text-zinc-500 hover:text-rose-400 text-xs ml-1 cursor-pointer"
                >
                  Entfernen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => createPhotoInputRef.current?.click()}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Foto wählen
              </button>
            )}
          </div>

          {/* Progress Bar during Analysis */}
          {isCreating && createProgress && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-[#FF4D17]/30 space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF4D17] animate-pulse" />
                  {createProgress.label}
                </span>
                <span className="font-mono font-bold text-[#FF4D17]">{createProgress.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D17] to-amber-400 transition-all duration-300"
                  style={{ width: `${createProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleAutoCreateClone}
            disabled={isCreating}
            className="w-full cryptox-orange-btn !py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,77,23,0.4)] disabled:opacity-50 cursor-pointer"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>KI synthetisiert Gesicht, Bart &amp; Stil…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>✨ KI-Klon-Profil in 3 Sekunden generieren</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Studio Mode Switcher: 1-Click Studio vs. Klon-DNA Übersicht ── */}
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
          <span>⚡ 1-Click Klon Studio &amp; Style-Transfer</span>
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
          <span>⚙️ Klon-DNA &amp; Merkmale anpassen</span>
        </button>
      </div>

      {studioMode === "flow" ? (
        <AiCloneFlowStudio
          currentUser={currentUser}
          onDeductCredits={onDeductCredits}
          onOpenDetailedDna={() => setStudioMode("dna")}
        />
      ) : (
        /* ── Unified Single-Page Klon-DNA Dashboard ───────────────── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: DNA Trait Cards (7 cols) */}
            <div className="space-y-4 lg:col-span-7">
              {/* 1. Identität & Basis */}
              <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                  <User className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">1. Identität &amp; Basis</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Name:</label>
                    <input
                      value={activeProfile.name}
                      onChange={(e) => patchProfile({ name: e.target.value })}
                      className="field-input text-xs"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Geschlecht &amp; Alter:</label>
                    <input
                      value={activeProfile.genderAge}
                      onChange={(e) => patchProfile({ genderAge: e.target.value })}
                      className="field-input text-xs"
                      placeholder="z. B. Mann, 28 Jahre"
                    />
                  </div>
                </div>

                {/* Placement Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] text-zinc-400 block">Slide-Platzierung im Karussell:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PLACEMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => patchProfile({ placement: opt.id })}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          activeProfile.placement === opt.id
                            ? "border-orange-500 bg-orange-500/10 text-white shadow-sm"
                            : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        <div className="text-xs font-bold text-white">{opt.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Gesicht, Haare & Bart */}
              <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">2. Gesichtszüge, Haare &amp; Bart</h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    KI-generiert
                  </span>
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={activeProfile.hairFace}
                    onChange={(e) => patchProfile({ hairFace: e.target.value })}
                    className="field-input text-xs leading-relaxed"
                    placeholder="Haarschnitt, Bart, Jawline…"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {HAIR_BEARD_CHIPS.slice(0, 5).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => patchProfile({ hairFace: chip.text })}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:border-orange-500/40 transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Garderobe & Kleidung */}
              <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                  <Shirt className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">3. Signatur-Garderobe</h3>
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={activeProfile.wardrobe}
                    onChange={(e) => patchProfile({ wardrobe: e.target.value })}
                    className="field-input text-xs leading-relaxed"
                    placeholder="Signatur-Outfit für Karussell-Slides…"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {WARDROBE_PRESETS.slice(0, 4).map((wp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => patchProfile({ wardrobe: wp.desc })}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:border-orange-500/40 transition-colors cursor-pointer"
                    >
                      {wp.icon} {wp.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Licht & Kamera */}
              <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                  <SunMedium className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">4. Licht &amp; Kameraoptik</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Lichtkonzept:</label>
                    <input
                      value={activeProfile.lightingLook}
                      onChange={(e) => patchProfile({ lightingLook: e.target.value })}
                      className="field-input text-xs"
                      placeholder="Studio-Licht"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Kamera / Brennweite:</label>
                    <input
                      value={activeProfile.framingCamera}
                      onChange={(e) => patchProfile({ framingCamera: e.target.value })}
                      className="field-input text-xs"
                      placeholder="85mm Porträt f/1.8"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Makellos-Haut-Filter & Negative Prompt */}
              <div className="cryptox-card p-5 rounded-2xl border border-white/[0.08] bg-[#110F17]/90 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">5. Makellose Haut &amp; Negative Filter</h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Aktiv (Pickel &amp; Unreinheiten gefiltert)
                  </span>
                </div>
                <div>
                  <input
                    value={activeProfile.negativePrompt}
                    onChange={(e) => patchProfile({ negativePrompt: e.target.value })}
                    className="field-input text-xs"
                    placeholder="Keine Pickel, keine Unreinheiten…"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Persona Identity Pass & Test Sandbox (5 cols) */}
            <div className="space-y-5 lg:col-span-5">
              {/* ── Live Clone Identity Pass ───────────────────────── */}
              <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/90 p-5 sm:p-6 space-y-4 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Live Persona-Pass
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
                        Reine Haut ✓
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
                      Master-Prompt (automatisch generiert)
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

                  <div className="rounded-xl border border-white/[0.08] bg-black/60 p-3 text-[11px] leading-relaxed text-zinc-200 select-all font-mono max-h-36 overflow-y-auto">
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
              <div className="cryptox-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110F17]/90 p-5 sm:p-6 space-y-3.5 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Persona Test-Visual
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
                    <span>Testbild berechnen</span>
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
                      Klicke auf „Testbild berechnen“, um ein Live-Porträt dieser Persona zu rendern.
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
