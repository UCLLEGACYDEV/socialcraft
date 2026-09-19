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
  ChevronRight,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_API_SETTINGS, DEFAULT_CLONE_PROFILES } from "@/onyx/defaults";
import { generateImageUnified, makeId } from "@/onyx/mock-api";
import { LS, readLS, usePersistentState } from "@/onyx/storage";
import type { AiCloneProfile, ApiSettings, ClonePlacement } from "@/onyx/types";
import type { User as AuthUser } from "@/onyx/auth";
import { cn } from "@/lib/utils";

interface AiCloneViewProps {
  currentUser?: AuthUser | null;
  onDeductCredits?: (amount: number) => void;
  onUseInCarousel?: () => void;
  onUseInDirectPrompt?: (clonePrompt: string) => void;
}

const PERSONA_TYPES = [
  {
    id: "self",
    title: "Ich selbst (Echte Person)",
    desc: "Eigene Fotos mit rechtlicher Einwilligung. Perfekt für Personal Branding & Coaches.",
    icon: User,
  },
  {
    id: "synthetic",
    title: "Synthetische KI-Figur",
    desc: "Fotorealistische virtuelle Markenbotschafter ohne reale Vorlage.",
    icon: Sparkles,
  },
  {
    id: "mascot",
    title: "Maskottchen / Symbolfigur",
    desc: "Wiederkehrende 3D-Figur, Tier oder Statue (z. B. Marmor-Tiger).",
    icon: Flame,
  },
];

const PLACEMENT_OPTIONS: { id: ClonePlacement; label: string; sub: string }[] = [
  {
    id: "hook_closing",
    label: "Hook & Abschluss (Empfohlen)",
    sub: "Persona auf Folie 1 und der letzten Folie für maximale Markenbindung.",
  },
  {
    id: "all_slides",
    label: "Volle Präsenz",
    sub: "Auf jeder Folie mit variierender Pose und passender Mimik.",
  },
  {
    id: "even_slides",
    label: "Alternierend",
    sub: "Abwechselnd mit daten- oder grafikbasierten Folien.",
  },
];

export function AiCloneView({
  currentUser,
  onDeductCredits,
  onUseInCarousel,
  onUseInDirectPrompt,
}: AiCloneViewProps) {
  // Profiles State
  const [profiles, setProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeId, setActiveId] = usePersistentState<string>(
    LS.activeCloneId,
    profiles[0]?.id || "",
  );

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeId) || profiles[0];
  }, [profiles, activeId]);

  // Modal: Neue Persona anlegen
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [personaType, setPersonaType] = useState<"self" | "synthetic" | "mascot">("self");
  const [consentGiven, setConsentGiven] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Founder & Tech Creator");
  const [newWardrobe, setNewWardrobe] = useState("Matter schwarzer Rollkragenpullover");
  const [newFeatures, setNewFeatures] = useState("Klassische Brille mit feinem Titanrahmen");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectActive = (id: string) => {
    setActiveId(id);
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      })),
    );
    toast.success("Aktive Persona umgestellt!");
  };

  const handleUpdatePlacement = (placement: ClonePlacement) => {
    if (!activeProfile) return;
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, placement } : p)),
    );
    toast.success("Platzierungsmodus aktualisiert!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setUploadedPhotos((prev) => [...prev, ev.target!.result as string].slice(0, 8));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (personaType === "self" && !consentGiven) {
      toast.error("Bitte bestätige die rechtliche Einwilligung zur Nutzung der Fotos.");
      return;
    }
    if (!newName.trim()) {
      toast.error("Bitte gib einen Namen für die Persona an.");
      return;
    }

    const defaultAvatar =
      uploadedPhotos[0] ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80";

    const newProfile: AiCloneProfile = {
      id: `clone_${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim(),
      isActive: true,
      avatarUrl: defaultAvatar,
      referenceImages: uploadedPhotos.length > 0 ? uploadedPhotos : [defaultAvatar],
      genderAge: "28 Jahre alt, professioneller Look",
      hairFace: "Scharfe Gesichtszüge, gepflegtes Haar, direkter Blickkontakt",
      tattoosFeatures: newFeatures,
      wardrobe: newWardrobe,
      lightingLook: "Studio-Kantenlicht mit dezentem warmen Amber-Rimlight",
      framingCamera: "Kinomäßig 85mm Porträt-Objektiv, weiche Tiefenschärfe",
      negativePrompt: "Keine Verzerrungen, keine Gesichtsveränderungen, kein Plastik-Look",
      customPrefix: `${newName.trim()}, ${newFeatures}, ${newWardrobe}`,
      placement: "hook_closing",
      updatedAt: new Date().toISOString(),
    };

    setProfiles((prev) => [newProfile, ...prev]);
    setActiveId(newProfile.id);
    setShowCreateModal(false);
    setUploadedPhotos([]);
    setNewName("");
    setConsentGiven(false);
    toast.success(`Persona „${newProfile.name}“ erfolgreich angelegt & verankert! 🎉`);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      toast.warning("Mindestens eine Persona muss erhalten bleiben.");
      return;
    }
    const filtered = profiles.filter((p) => p.id !== id);
    setProfiles(filtered);
    if (activeId === id) {
      setActiveId(filtered[0]?.id || "");
    }
    toast.info("Persona gelöscht.");
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Baustein 2 · Persona-Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Mein Gesicht & Bildidentität
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Konsistente Gesichter über alle Folien hinweg – technisch abgesichert durch
            Referenzanker und Ähnlichkeitskontrolle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,77,23,0.3)] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Neue Persona anlegen</span>
        </button>
      </div>

      {/* ── Persona-Karten Schnellleiste ────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Gespeicherte Personas ({profiles.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {profiles.map((p) => {
            const isCurrent = p.id === activeProfile?.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectActive(p.id)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative group",
                  isCurrent
                    ? "border-[#FF4D17] bg-[#FF4D17]/[0.08] shadow-[0_0_20px_rgba(255,77,23,0.15)]"
                    : "border-white/[0.06] bg-black/40 hover:bg-white/[0.03] hover:border-white/15",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0">
                    <img
                      src={p.avatarUrl || p.referenceImages[0]}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                    {isCurrent && (
                      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#FF4D17] ring-2 ring-black" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                    <p className="text-[10px] text-zinc-400 truncate">{p.role}</p>
                    <span className="text-[9px] font-mono text-emerald-400 font-semibold mt-0.5 block">
                      ≥95% Ähnlichkeitsanker
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProfile(p.id, e)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detailansicht der aktiven Persona ───────────────────────── */}
      {activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* Linke Spalte: Character Sheet & Referenz-Bilder (7 Spalten) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Character Sheet & Referenzanker (4 Ansichten)
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  Anker aktiv
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Frontal", "Halbprofil", "Dreiviertel", "Halbfigur"].map((viewLabel, idx) => {
                  const img =
                    activeProfile.referenceImages[idx] ||
                    activeProfile.avatarUrl ||
                    activeProfile.referenceImages[0];
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-black/60 overflow-hidden space-y-1.5 p-1.5"
                    >
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black">
                        <img
                          src={img}
                          alt={viewLabel}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 block text-center uppercase tracking-wider">
                        {viewLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-zinc-400 flex items-start gap-2 leading-relaxed">
                <Info className="h-4 w-4 text-[#FF4D17] shrink-0 mt-0.5" />
                <span>
                  Jedes neu gerenderte Bild wird automatisch gegen dieses Character Sheet verglichen.
                  Bei Abweichungen greift ein automatischer Reroll vor der Freigabe.
                </span>
              </div>
            </div>

            {/* Feste Merkmale & Signatur-Look */}
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/[0.06] pb-3">
                Feste Signatur-Merkmale dieser Persona
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Garderobe & Kleidung
                  </span>
                  <p className="text-zinc-200 font-medium">{activeProfile.wardrobe}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Physische Merkmale & Accessoires
                  </span>
                  <p className="text-zinc-200 font-medium">
                    {activeProfile.tattoosFeatures || "Keine auffälligen Merkmale"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Kamera & Tiefenschärfe
                  </span>
                  <p className="text-zinc-200 font-medium">{activeProfile.framingCamera}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Beleuchtung & Atmosphäre
                  </span>
                  <p className="text-zinc-200 font-medium">{activeProfile.lightingLook}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Platzierungsmodus & 1-Klick Übergaben (5 Spalten) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Platzierungsmodi */}
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.06] pb-3">
                Standard-Platzierungsmodus
              </h3>

              <div className="space-y-2">
                {PLACEMENT_OPTIONS.map((opt) => {
                  const isSel = activeProfile.placement === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleUpdatePlacement(opt.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 text-left",
                        isSel
                          ? "border-[#FF4D17] bg-[#FF4D17]/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        {isSel && <Check className="h-3.5 w-3.5 text-[#FF4D17]" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{opt.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Persona direkt verwenden
              </h3>

              <div className="space-y-2">
                {onUseInCarousel && (
                  <button
                    type="button"
                    onClick={onUseInCarousel}
                    className="w-full py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#FF4D17]" />
                      <span>Im Karussell-Studio einbinden</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                )}

                {onUseInDirectPrompt && (
                  <button
                    type="button"
                    onClick={() =>
                      onUseInDirectPrompt(
                        `Editorial-Porträt von ${activeProfile.name}, ${activeProfile.wardrobe}, ${activeProfile.lightingLook}`,
                      )
                    }
                    className="w-full py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-blue-400" />
                      <span>Als Einzelbild generieren</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Neue Persona anlegen (DSGVO & Anker-Workflow) ─────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in-50">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0C0910] p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Neue Persona verankern</h3>
                <p className="text-xs text-zinc-400">
                  Stabile Bildidentität für konsistenten Social-Media-Content
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePersona} className="space-y-4">
              {/* Persona Typ */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Persona-Typ:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PERSONA_TYPES.map((pt) => {
                    const isSel = personaType === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setPersonaType(pt.id as any)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1",
                          isSel
                            ? "border-[#FF4D17] bg-[#FF4D17]/10"
                            : "border-white/[0.06] bg-white/[0.02]",
                        )}
                      >
                        <span className="text-xs font-bold text-white block">{pt.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Rolle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">Name:</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z. B. Alex Miller"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#FF4D17]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">Position / Rolle:</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="z. B. Founder & Host"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#FF4D17]"
                  />
                </div>
              </div>

              {/* Signatur Styling */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Signatur-Kleidung / Styling:
                </label>
                <input
                  type="text"
                  value={newWardrobe}
                  onChange={(e) => setNewWardrobe(e.target.value)}
                  placeholder="z. B. Matter schwarzer Rollkragenpullover oder Oversize Blazer"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#FF4D17]"
                />
              </div>

              {/* Referenzfotos Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Referenzfotos (3 bis 8 Bilder):
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {uploadedPhotos.length} / 8 ausgewählt
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] p-4 text-center transition-all cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Upload className="h-5 w-5 mx-auto text-[#FF4D17] mb-1" />
                  <p className="text-xs font-bold text-white">Fotos auswählen</p>
                  <p className="text-[10px] text-zinc-400">Frontal, Profil, gutes Tageslicht</p>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {uploadedPhotos.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rechtliche Einwilligung nach DSGVO (Pflicht bei Typ 'self') */}
              {personaType === "self" && (
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.06] p-3.5 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 text-[#FF4D17] focus:ring-0"
                    />
                    <span className="text-xs text-orange-200 leading-snug">
                      Ich bestätige ausdrücklich, dass ich die abgebildete Person bin oder deren
                      rechtsgültige Einwilligung zur Nutzung der Fotos für KI-Generierungen besitze
                      (DSGVO Kap. 13.3).
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="cryptox-orange-btn !py-2 !px-5 text-xs font-bold shadow-[0_0_20px_rgba(255,77,23,0.35)] cursor-pointer"
                >
                  Persona anlegen & verankern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
