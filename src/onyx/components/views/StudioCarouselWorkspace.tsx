import React, { useRef, useState } from "react";
import {
  Sparkles,
  Flame,
  Lightbulb,
  TrendingUp,
  Layers,
  HelpCircle,
  Users,
  Upload,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Minus,
  Plus,
  UserCheck,
  Zap,
  Check,
  ChevronRight,
  MessageSquareQuote,
  BarChart3,
  Bookmark,
  AtSign,
  SlidersHorizontal,
  X,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  FolderPlus,
  ChevronDown,
  Info,
  Clock,
  Eye,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DESIGN_TEMPLATES } from "@/onyx/defaults";
import { parseUniversalPromptFile } from "@/onyx/csv-prompt-parser";
import type { AiCloneProfile, ApiSettings, BrandKit, BriefValues } from "@/onyx/types";
import type { User } from "@/onyx/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GenerationProgress } from "@/onyx/components/widgets/GenerationProgress";

export interface StudioCarouselWorkspaceProps {
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  activeClone?: AiCloneProfile | undefined;
  onOpenCloneStudio: () => void;
  onOpenPromptHub: () => void;
  onOpenBrandKit: () => void;
  onOpenSettings?: () => void;
  currentUser?: User | null;
  onNavigateLanding?: () => void;
}

// 5 Psychologische Hook-Typen mit echten Generierungs-Modifikatoren
const HOOK_ARCHETYPES = [
  {
    id: "provocative",
    label: "Provokant",
    icon: Flame,
    prefix: "Hör auf damit: Die meisten machen diesen fatalen Fehler bei ",
    desc: "Bricht mentale Muster & stoppt den Instagram-Feed-Scroll sofort.",
    color: "text-red-400",
  },
  {
    id: "storytelling",
    label: "Story / Case Study",
    icon: MessageSquareQuote,
    prefix: "Wie wir in unter 90 Tagen das Problem gelöst haben: ",
    desc: "Erzeugt persönliche Identifikation und hohe Weiterleitungs-Raten.",
    color: "text-amber-400",
  },
  {
    id: "data-driven",
    label: "Zahlen & Daten",
    icon: BarChart3,
    prefix: "94% aller Marken übersehen diesen Wachstumshebel für ",
    desc: "Beweisbasierte Autorität für B2B- & Experten-Positionierung.",
    color: "text-cyan-400",
  },
  {
    id: "step-by-step",
    label: "Schritt-für-Schritt",
    icon: Layers,
    prefix: "In 5 Schritten zum Ziel: ",
    desc: "Hohe Speicher-Rate (Saves) durch mundgerechte Umsetzbarkeit.",
    color: "text-emerald-400",
  },
  {
    id: "question",
    label: "Neugierde-Frage",
    icon: HelpCircle,
    prefix: "Warum scheitern 9 von 10 bei ",
    desc: "Aktiviert sofortige Neugier und steigert die Interaktion in den Kommentaren.",
    color: "text-purple-400",
  },
] as const;

// 3 Standard-Formate nach SaaS 2.0 Spezifikation
const SLIDE_FORMAT_PRESETS = [
  {
    count: 4,
    label: "4 Slides",
    sub: "Snack-Content",
    badge: "Schnell",
    dramaturgy: "Hook → Wert 1 → Wert 2 → Handlungsaufruf",
  },
  {
    count: 7,
    label: "7 Slides",
    sub: "Instagram & LinkedIn Standard",
    badge: "Empfohlen",
    dramaturgy: "Problem → Zuspitzung → 3 Schritte → Kernbotschaft → Speichern",
  },
  {
    count: 10,
    label: "10 Slides",
    sub: "Tiefer Fachbeitrag",
    badge: "Hohe Verweildauer",
    dramaturgy: "Hook → Kontext → 5 Thesen → Zusammenfassung → Beweis → CTA",
  },
];

// Schnelle Inspiration & Vorlagen
const CAROUSEL_PRESETS = [
  {
    title: "Mythen vs. Realität",
    tag: "Viraler Hook",
    icon: Flame,
    topic: "5 gefährliche Mythen über organisches Social-Media-Wachstum 2026",
    audience: "Content Creator & Coaches",
    slides: 7,
    designId: "ember-ignite",
  },
  {
    title: "Die 5-Schritte-Formel",
    tag: "Hohe Speicher-Rate",
    icon: Layers,
    topic: "In 5 Schritten vom anonymen Profil zur gebuchten Personenmarke",
    audience: "Solopreneure & Coaches",
    slides: 7,
    designId: "ember-ignite",
  },
  {
    title: "Vorher / Nachher Fallstudie",
    tag: "Autorität & Proof",
    icon: TrendingUp,
    topic: "Warum dieser einfache Hook-Wechsel die Verweildauer um 94% steigerte",
    audience: "Agenturen & Dienstleister",
    slides: 6,
    designId: "ember-ignite",
  },
];

const AUDIENCES = [
  "B2B & Gründer",
  "Content Creator & Coaches",
  "Agenturen & Marketing",
  "E-Commerce Brands",
  "Dienstleister & Berater",
];

export function StudioCarouselWorkspace({
  brief,
  onChangeBrief,
  onSubmit,
  isGenerating,
  settings,
  onChangeSettings,
  brandKit,
  onChangeBrandKit,
  activeClone,
  onOpenCloneStudio,
  onOpenPromptHub,
  onOpenBrandKit,
  onOpenSettings,
  currentUser,
}: StudioCarouselWorkspaceProps) {
  const [activeInputMode, setActiveInputMode] = useState<"manual" | "import">("manual");
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyHookModifier = (hook: (typeof HOOK_ARCHETYPES)[number]) => {
    setSelectedHookId(hook.id);
    if (!brief.topic.trim()) {
      onChangeBrief({ topic: hook.prefix });
    } else if (!brief.topic.startsWith(hook.prefix.slice(0, 12))) {
      onChangeBrief({ topic: `${hook.prefix}${brief.topic.replace(/^.*?:\s*/, "")}` });
    }
    toast.success(`Hook-Typ „${hook.label}“ angewendet!`, {
      description: hook.desc,
    });
  };

  const applyPreset = (preset: (typeof CAROUSEL_PRESETS)[number]) => {
    onChangeBrief({
      topic: preset.topic,
      audience: preset.audience,
      slideCount: preset.slides,
      designId: preset.designId,
    });
    toast.success(`Vorlage „${preset.title}“ geladen!`, {
      description: `${preset.slides} Slides für ${preset.audience} vorbereitet.`,
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || "");
      const parsed = parseUniversalPromptFile(content, file.name);
      if (parsed.length > 0) {
        const first = parsed[0];
        onChangeBrief({
          topic: first.title,
          slideCount: Math.min(15, Math.max(4, first.slides.length)),
        });
        toast.success(`Datei erkannt: „${first.title}“ (${first.slides.length} Folien)!`, {
          description: "Struktur und Prompts wurden automatisch übernommen.",
        });
      } else {
        onChangeBrief({ topic: content.slice(0, 200).trim() });
        toast.info("Text importiert und als Thema übernommen.");
      }
    };
    reader.readAsText(file);
  };

  // Berechne geschätzte Credits und Zeit
  const estimatedCredits = brief.slideCount;
  const estimatedSeconds = Math.round(brief.slideCount * 12);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Header: Studio Karussell-Engine ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Baustein 1 · Karussell-Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Karussell-Studio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Aus einem Thema markenkonsistente, visuell ansprechende Slide-Sequenzen erzeugen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand Kit Quick Badge */}
          <button
            type="button"
            onClick={onOpenBrandKit}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-white transition-all cursor-pointer"
            title="Mein Look / Brand Kit anpassen"
          >
            <span
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: brandKit.accentColorHex || "#FF4D17" }}
            />
            <span className="font-semibold">{brandKit.handle || "@mein_kanal"}</span>
          </button>

          {/* Persona Quick Badge */}
          {activeClone && (
            <button
              type="button"
              onClick={onOpenCloneStudio}
              className="flex items-center gap-2 rounded-xl border border-[#FF4D17]/30 bg-[#FF4D17]/10 hover:bg-[#FF4D17]/20 px-3 py-1.5 text-xs text-orange-300 transition-all cursor-pointer"
              title="Aktive Bild-Persona"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#FF4D17]" />
              <span className="font-semibold">{activeClone.name}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Während Generierung: Klare Fortschrittsanzeige ─────────── */}
      {isGenerating && (
        <div className="rounded-3xl border border-[#FF4D17]/30 bg-black/60 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(255,77,23,0.15)]">
          <GenerationProgress
            isGenerating={true}
            title="Karussell-Inhalte werden generiert"
            totalItems={brief.slideCount}
            onCancel={() => window.location.reload()}
          />
        </div>
      )}

      {/* ── Haupt-Workspace: 2-Spalten-Layout ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Linke Spalte: Konfiguration (7 Spalten) ───────────────── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Schritt 1: Thema & Quelle */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF4D17]/20 text-[#FF4D17] text-xs font-black">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">Thema & Dramaturgie</h3>
              </div>

              {/* Umschalter: Manuell vs Smart Parser */}
              <div className="flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/[0.06] text-xs">
                <button
                  type="button"
                  onClick={() => setActiveInputMode("manual")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                    activeInputMode === "manual"
                      ? "bg-[#FF4D17] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white",
                  )}
                >
                  Thema eingeben
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputMode("import")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeInputMode === "import"
                      ? "bg-[#FF4D17] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white",
                  )}
                >
                  <Upload className="h-3 w-3" />
                  <span>Smart Parser</span>
                </button>
              </div>
            </div>

            {activeInputMode === "manual" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Worüber soll dein Karussell informieren?
                  </label>
                  <textarea
                    rows={3}
                    value={brief.topic}
                    onChange={(e) => onChangeBrief({ topic: e.target.value })}
                    placeholder="z. B. Die 5 häufigsten Fehler beim Kaltakquise-Call auf LinkedIn und wie du sie sofort behebst…"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-[#FF4D17] focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Zielgruppe Auswahl */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 block">
                    Zielgruppe:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AUDIENCES.map((aud) => {
                      const isSel = brief.audience === aud;
                      return (
                        <button
                          key={aud}
                          type="button"
                          onClick={() => onChangeBrief({ audience: aud })}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                            isSel
                              ? "bg-white/15 border-white/30 text-white font-semibold"
                              : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]",
                          )}
                        >
                          {aud}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Smart Parser Dropzone */
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] p-6 text-center transition-all cursor-pointer space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv,.json,.md"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF4D17] mx-auto group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Datei hochladen oder hierher ziehen</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Unterstützt Skripte, Notizen (.txt, .md), Tabellen (.csv) & Prompts (.json)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hook-Typen Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Hook-Dramaturgie für Slide 1
                </span>
                <span className="text-[10px] text-zinc-500">Klick füllt Hook-Präfix vor</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HOOK_ARCHETYPES.map((hook) => {
                  const Icon = hook.icon;
                  const isSelected = selectedHookId === hook.id;
                  return (
                    <button
                      key={hook.id}
                      type="button"
                      onClick={() => applyHookModifier(hook)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1",
                        isSelected
                          ? "border-[#FF4D17] bg-[#FF4D17]/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5", hook.color)} />
                        <span className="text-xs font-bold text-white">{hook.label}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1">{hook.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Schritt 2: Folien-Anzahl & Format */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF4D17]/20 text-[#FF4D17] text-xs font-black">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Länge & Format</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#FF4D17]">
                {brief.slideCount} Slides (4:5 Vertikal)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SLIDE_FORMAT_PRESETS.map((fmt) => {
                const isSel = brief.slideCount === fmt.count;
                return (
                  <button
                    key={fmt.count}
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: fmt.count })}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2",
                      isSel
                        ? "border-[#FF4D17] bg-[#FF4D17]/10 shadow-sm"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{fmt.label}</span>
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                          isSel
                            ? "bg-[#FF4D17]/20 text-[#FF4D17] border-[#FF4D17]/30"
                            : "bg-white/5 text-zinc-400 border-white/10",
                        )}
                      >
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-medium">{fmt.sub}</p>
                    <p className="text-[10px] text-zinc-500 font-mono line-clamp-2">{fmt.dramaturgy}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schritt 3: Visueller Stil & Persona-Anker */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF4D17]/20 text-[#FF4D17] text-xs font-black">
                  3
                </span>
                <h3 className="text-sm font-bold text-white">Look & Persona-Anker</h3>
              </div>

              {onOpenPromptHub && (
                <button
                  type="button"
                  onClick={onOpenPromptHub}
                  className="text-xs font-semibold text-[#FF4D17] hover:underline flex items-center gap-1"
                >
                  <span>220+ Vorlagen</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Persona Toggle */}
            {activeClone ? (
              <div className="rounded-2xl border border-[#FF4D17]/30 bg-[#FF4D17]/[0.06] p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-[#FF4D17] border border-orange-500/30">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      Persona: {activeClone.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Gleiche Bildidentität auf Hook & Abschluss-Slide
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onChangeBrief({ useClone: !brief.useClone })}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    brief.useClone
                      ? "bg-[#FF4D17] text-white shadow-sm"
                      : "bg-white/10 text-zinc-400 hover:text-white",
                  )}
                >
                  {brief.useClone ? "Aktiviert" : "Deaktiviert"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-3.5 flex items-center justify-between text-xs text-zinc-400">
                <span>Noch keine Bild-Persona angelegt.</span>
                <button
                  type="button"
                  onClick={onOpenCloneStudio}
                  className="text-[#FF4D17] font-semibold hover:underline"
                >
                  Persona anlegen
                </button>
              </div>
            )}

            {/* Stil Vorlagen Schnellauswahl */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 block">Design-Stil:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DESIGN_TEMPLATES.slice(0, 6).map((tmpl) => {
                  const isSel = brief.designId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => onChangeBrief({ designId: tmpl.id })}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSel
                          ? "border-[#FF4D17] bg-white/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="text-xs font-bold text-white truncate">{tmpl.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{tmpl.mood}</div>
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
                <span>Erweiterte Branding-Details</span>
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")}
                />
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 animate-in fade-in-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 block">Kanal-Handle:</label>
                      <input
                        type="text"
                        value={brief.handle}
                        onChange={(e) => onChangeBrief({ handle: e.target.value })}
                        placeholder="@kanalname"
                        className="w-full rounded-xl border border-white/10 bg-black/50 p-2 text-xs text-white focus:border-[#FF4D17] outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 block">Signatur CTA:</label>
                      <input
                        type="text"
                        value={brief.ctaText}
                        onChange={(e) => onChangeBrief({ ctaText: e.target.value })}
                        placeholder="Folge für täglichen Experten-Content"
                        className="w-full rounded-xl border border-white/10 bg-black/50 p-2 text-xs text-white focus:border-[#FF4D17] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Rechte Spalte: Live Dramaturgie & Start-Aktion (5 Spalten) ─ */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          {/* Vorlagen Schnellauswahl */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Beliebte Einstiegs-Vorlagen
            </h3>
            <div className="space-y-2">
              {CAROUSEL_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D17] transition-colors">
                          {preset.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">{preset.topic}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Storyboard Sequenz-Vorschau */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Geplante Story-Sequenz
              </h3>
              <span className="text-xs font-mono text-zinc-400">{brief.slideCount} Folien</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-between text-orange-300">
                <span className="font-bold font-mono">Slide 1 (Hook)</span>
                <span className="text-[11px]">Scroll-Stopper Visual</span>
              </div>
              <div className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-zinc-300">
                <span className="font-bold font-mono">Slides 2–{brief.slideCount - 2}</span>
                <span className="text-[11px] text-zinc-400">Mehrwert, Thesen & Argumente</span>
              </div>
              <div className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-zinc-300">
                <span className="font-bold font-mono">Slide {brief.slideCount - 1}</span>
                <span className="text-[11px] text-zinc-400">Zusammenfassung & Aha-Moment</span>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-emerald-300">
                <span className="font-bold font-mono">Slide {brief.slideCount} (CTA)</span>
                <span className="text-[11px]">Speichern, Teilen & Follow</span>
              </div>
            </div>

            {/* Kostenvorschau & Submit */}
            <div className="pt-3 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#FF4D17]" />
                  <span>Kosten vor Start:</span>
                </span>
                <span className="font-bold text-white">
                  ca. {estimatedCredits} Credits ({estimatedSeconds}s)
                </span>
              </div>

              <button
                type="button"
                disabled={isGenerating || !brief.topic.trim()}
                onClick={onSubmit}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-[0_0_30px_rgba(255,77,23,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer",
                  !brief.topic.trim()
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                    : "bg-[#FF4D17] hover:brightness-110 active:scale-[0.99]",
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span>Storyboard & Entwurf generieren</span>
              </button>

              <p className="text-[11px] text-zinc-500 text-center">
                Kein Risiko: Entwurf wird vor dem finalen Rendern zur Prüfung vorgelegt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
