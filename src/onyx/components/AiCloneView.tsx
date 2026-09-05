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
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_CLONE_PROFILES,
  assembleClonePrompt,
} from "../defaults";
import { makeId, mockGenerateImage } from "../mock-api";
import { LS, usePersistentState } from "../storage";
import type { AiCloneProfile, ClonePlacement } from "../types";
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
      wardrobe: "Schwarzer minimalistischer Pullover",
      lightingLook: "Dramatisches Seitenlicht, dunkles Studio",
      framingCamera: "Close-up Porträt, 85mm Linse",
      negativePrompt: "Kein Grinsen, kein Cartoon, keine Verzerrungen",
      customPrefix: "",
      placement: "hook_closing",
      updatedAt: new Date().toISOString(),
    };
    setProfiles((prev) => [newProfile, ...prev]);
    setActiveId(newId);
    toast.success("Neues Profil angelegt");
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
    try {
      const res = await mockGenerateImage(testImages.length + 1);
      setTestImages((prev) => [res.imageUrl, ...prev]);
      toast.success("Test-Visual mit Persona erfolgreich berechnet!");
    } finally {
      setTestImageLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <div className="glass-card-hero p-5 sm:p-7 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary-bright">
                <UserCheck className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                KI Clone & Persona Studio
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                  activeProfile.isActive
                    ? "border-primary/50 bg-primary/15 text-primary-bright shadow-[0_0_12px_-3px_var(--primary)]"
                    : "border-border bg-foreground/[0.04] text-muted-foreground",
                )}
              >
                {activeProfile.isActive ? "Aktiviert für Karussells" : "Inaktiv"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Definiere dein konsistentes Gesicht, Styling und Lichtkonzept. Sobald aktiviert,
              wird die Persona automatisch in deine Karussell-Prompts eingebaut, sodass dein Look auf allen Slides synchron bleibt.
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleActive}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                activeProfile.isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_var(--primary)] hover:bg-primary-bright"
                  : "border border-border bg-foreground/[0.03] text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{activeProfile.isActive ? "Persona aktiv (AN)" : "Persona aktivieren (AUS)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCreateProfile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-foreground/[0.02] px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.06]"
            >
              <Plus className="h-3.5 w-3.5 text-primary-bright" />
              <span>Neues Profil</span>
            </button>
          </div>
        </div>

        {/* ── Profiles Navigation Bar ─────────────────────────────── */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Profile:</span>
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
                      ? "border-primary bg-primary/20 text-primary-bright font-semibold shadow-[0_0_15px_-4px_var(--primary)]"
                      : "border-border bg-foreground/[0.02] text-muted-foreground hover:border-border/80 hover:text-foreground",
                  )}
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <User className="h-3.5 w-3.5 opacity-60" />
                  )}
                  <span>{p.name}</span>
                  {p.isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-bright animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {profiles.length > 1 && (
            <button
              type="button"
              onClick={() => handleDeleteProfile(activeProfile.id)}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 shrink-0 px-2 py-1"
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
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary-bright" />
              1. Identität & Basisdaten
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
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
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
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
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Gesichtszüge, Haare & Bart
              </label>
              <input
                value={activeProfile.hairFace}
                onChange={(e) => patchProfile({ hairFace: e.target.value })}
                placeholder="z. B. Kurze dunkle Haare, gepflegter 3-Tage-Bart, markante Kieferlinie"
                className="field-input text-xs"
              />
            </div>
          </div>

          {/* Section 2: Look, Styling & Beleuchtung */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <SunMedium className="h-3.5 w-3.5 text-primary-bright" />
              2. Signatur-Garderobe & Licht-Look
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1 flex items-center gap-1">
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
                <label className="text-[11px] font-medium text-muted-foreground block mb-1 flex items-center gap-1">
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
                <label className="text-[11px] font-medium text-muted-foreground block mb-1 flex items-center gap-1">
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
                <label className="text-[11px] font-medium text-muted-foreground block mb-1 flex items-center gap-1">
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
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary-bright" />
              3. Slide-Platzierung in der Serie
            </div>
            <p className="text-xs text-muted-foreground">
              Lege fest, auf welchen Slides deines Karussells diese Persona automatisch eingefügt wird.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PLACEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patchProfile({ placement: opt.id })}
                  className={cn(
                    "flex flex-col text-left rounded-xl border p-3 transition-all",
                    activeProfile.placement === opt.id
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_-8px_var(--primary)]"
                      : "border-border bg-foreground/[0.02] hover:bg-foreground/[0.04]",
                  )}
                >
                  <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                  <span className="mt-1 text-[11px] text-muted-foreground leading-snug">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Benutzerdefinierter Prefix-Override */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="clone-custom-prefix" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary-bright" />
                Prompt-Präfix Direkt-Editor (Englisch empfohlen)
              </label>
              <button
                type="button"
                onClick={() => patchProfile({ customPrefix: "" })}
                className="text-[11px] text-primary-bright hover:underline"
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
              className="field-input text-xs leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Wird bei aktiver Persona automatisch jedem Bildprompt im Karussell vorangestellt.
            </p>
          </div>
        </div>

        {/* Right Column: References, Live Preview & Test Lab (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Reference Photos & Avatar Upload */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5 text-primary-bright" />
                Referenzbilder ({activeProfile.referenceImages?.length || 0})
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-foreground/[0.04] px-2.5 py-1 text-xs font-medium text-foreground hover:bg-foreground/[0.08]"
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

            <p className="text-xs text-muted-foreground">
              Lade deine Fotos hoch. Dienen als visuelle Referenz und zur Generierung von Avataren.
            </p>

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {activeProfile.referenceImages?.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-background"
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
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
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/80 bg-foreground/[0.02] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Hinzufügen</span>
              </button>
            </div>
          </div>

          {/* Assembled Prompt Live Box */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Zusammengebauter Prompt
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-bright hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Kopiert!" : "Kopieren"}</span>
              </button>
            </div>

            <div className="rounded-xl border border-border/80 bg-foreground/[0.03] p-3 text-xs leading-relaxed text-foreground select-all font-mono">
              {assembledPrompt}
            </div>

            {/* Quick Actions into Karussell or Einzelbild */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onUseInCarousel && (
                <button
                  type="button"
                  onClick={() => onUseInCarousel(assembledPrompt)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-foreground/[0.04] py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary/15 hover:text-primary-bright"
                >
                  <Layers className="h-3.5 w-3.5 text-primary-bright" />
                  <span>In Karussell</span>
                </button>
              )}

              {onUseInDirectPrompt && (
                <button
                  type="button"
                  onClick={() => onUseInDirectPrompt(assembledPrompt)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-foreground/[0.04] py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary/15 hover:text-primary-bright"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-primary-bright" />
                  <span>In Einzelbild</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Render Sandbox */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Persona Test-Render
              </span>
              <button
                type="button"
                onClick={handleTestRender}
                disabled={testImageLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_-4px_var(--primary)] transition-all hover:bg-primary-bright disabled:opacity-50"
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
              <div className="grid grid-cols-2 gap-2">
                {testImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="aspect-[4/5] w-full rounded-xl border border-border object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-foreground/[0.01] p-4 text-center">
                <Lightbulb className="h-5 w-5 text-muted-foreground/60 mb-1" />
                <span className="text-xs text-muted-foreground">
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
