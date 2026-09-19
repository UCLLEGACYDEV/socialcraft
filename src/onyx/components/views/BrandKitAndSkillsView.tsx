import React, { useState } from "react";
import {
  Palette,
  Sparkles,
  Key,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Lock,
  Layers,
  Flame,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AiSkill, ApiSettings, BrandKit } from "@/onyx/types";
import { DEFAULT_AI_SKILLS } from "@/onyx/defaults";
import { SkillEditModal } from "../modals/SkillEditModal";

interface BrandKitAndSkillsViewProps {
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  skills: AiSkill[];
  onSetSkills: (skills: AiSkill[]) => void;
  activeSkillId?: string;
  onSelectActiveSkill?: (id: string) => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  onBackToStudio?: () => void;
}

const FONT_OPTIONS = [
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Modern & Clean)" },
  { id: "Inter", label: "Inter (Neutral & Lesbar)" },
  { id: "Outfit", label: "Outfit (Geometrisch & Auffällig)" },
  { id: "Playfair Display", label: "Playfair Display (Editorial & Luxus)" },
  { id: "JetBrains Mono", label: "JetBrains Mono (Tech & Dev)" },
];

const PRESET_COLORS = [
  "#FF4D17", // Socialcraft Orange
  "#F04A20", // Fiery Ember
  "#3B82F6", // Electric Blue
  "#10B981", // Emerald Green
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EAB308", // Gold Yellow
  "#FFFFFF", // Pure White
];

export function BrandKitAndSkillsView({
  brandKit,
  onChangeBrandKit,
  skills,
  onSetSkills,
  activeSkillId,
  onSelectActiveSkill,
  settings,
  onChangeSettings,
  onBackToStudio,
}: BrandKitAndSkillsViewProps) {
  const [activeTab, setActiveTab] = useState<"brand" | "skills" | "keys">("brand");
  const [editingSkill, setEditingSkill] = useState<AiSkill | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  // Local state for API keys before saving
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || "");
  const [kieKey, setKieKey] = useState(settings.kieApiKey || "");
  const [postForMeKey, setPostForMeKey] = useState(settings.postForMeApiKey || "");

  const handleSaveSkill = (saved: AiSkill) => {
    const exists = skills.some((s) => s.id === saved.id);
    let updated: AiSkill[];
    if (exists) {
      updated = skills.map((s) => (s.id === saved.id ? saved : s));
    } else {
      updated = [saved, ...skills];
    }
    onSetSkills(updated);
  };

  const handleDeleteSkill = (id: string) => {
    const target = skills.find((s) => s.id === id);
    if (target?.isPreset) {
      toast.error("Vordefinierte System-Skills können nicht gelöscht werden.");
      return;
    }
    const filtered = skills.filter((s) => s.id !== id);
    onSetSkills(filtered);
    toast.success("Skill gelöscht.");
  };

  const handleSaveKeys = () => {
    onChangeSettings({
      geminiApiKey: geminiKey.trim(),
      kieApiKey: kieKey.trim(),
      postForMeApiKey: postForMeKey.trim(),
    });
    toast.success("API-Schlüssel sicher gespeichert! 🔒");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── View Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              SaaS Setup & Personalisierung
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Brand-Kit & KI-Skills Management
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verwalte Marken-Tokens, trainiere eigene KI-Copywriting-Skills und hinterlege API-Schlüssel sicher.
          </p>
        </div>

        {onBackToStudio && (
          <button
            type="button"
            onClick={onBackToStudio}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            ← Zurück zum Studio
          </button>
        )}
      </div>

      {/* ── Sub Navigation Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("brand")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "brand"
              ? "bg-[#FF4D17] text-white shadow-lg shadow-orange-500/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Brand-Kit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("skills")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "skills"
              ? "bg-[#FF4D17] text-white shadow-lg shadow-orange-500/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>KI-Skills ({skills.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("keys")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "keys"
              ? "bg-[#FF4D17] text-white shadow-lg shadow-orange-500/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Key className="h-3.5 w-3.5" />
          <span>API-Keys & Provider</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: BRAND-KIT VERWALTUNG ──────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === "brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50">
          {/* Linke Spalte: Konfiguration */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">
                Marken-Identität & Handle
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Marken- / Creator-Name
                  </label>
                  <input
                    type="text"
                    value={brandKit.name || ""}
                    onChange={(e) => onChangeBrandKit({ name: e.target.value })}
                    placeholder="z. B. Socialcraft AI"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-[#FF4D17] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Social-Media-Handle
                  </label>
                  <input
                    type="text"
                    value={brandKit.handle}
                    onChange={(e) => onChangeBrandKit({ handle: e.target.value })}
                    placeholder="@dein.handle"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-mono text-white focus:border-[#FF4D17] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Logo / Avatar Bild-URL
                </label>
                <input
                  type="text"
                  value={brandKit.logoUrl || ""}
                  onChange={(e) => onChangeBrandKit({ logoUrl: e.target.value })}
                  placeholder="https://... oder /images/logo.png"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-mono text-white focus:border-[#FF4D17] outline-none"
                />
              </div>
            </div>

            {/* Farbpalette & Typografie */}
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">
                Farben & Typografie
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Primäre Akzentfarbe
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.accentColorHex || "#FF4D17"}
                    onChange={(e) => onChangeBrandKit({ accentColorHex: e.target.value })}
                    className="h-10 w-12 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandKit.accentColorHex || "#FF4D17"}
                    onChange={(e) => onChangeBrandKit({ accentColorHex: e.target.value })}
                    className="w-32 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-mono text-white focus:border-[#FF4D17] outline-none uppercase"
                  />
                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChangeBrandKit({ accentColorHex: c })}
                        style={{ backgroundColor: c }}
                        className="h-6 w-6 rounded-full border border-white/20 transition-transform hover:scale-110 cursor-pointer"
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Schriftart für Folientexte
                </label>
                <select
                  value={brandKit.fontFamily}
                  onChange={(e) => onChangeBrandKit({ fontFamily: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-[#120F17] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none cursor-pointer"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Standard Signatur-Call-to-Action (CTA)
                </label>
                <textarea
                  rows={2}
                  value={brandKit.ctaText}
                  onChange={(e) => onChangeBrandKit({ ctaText: e.target.value })}
                  placeholder="Speichere dir diesen Post für später ab 📌"
                  className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white focus:border-[#FF4D17] outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Live Vorschau-Karte */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 space-y-4 lg:sticky lg:top-20">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block border-b border-white/10 pb-2">
                Live Vorschau deines Brand-Kits
              </span>

              {/* Mockup Slide */}
              <div
                className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/20 p-5 flex flex-col justify-between shadow-2xl"
                style={{
                  backgroundColor: brandKit.backgroundColorHex || "#0A0705",
                  fontFamily: brandKit.fontFamily,
                }}
              >
                {/* Ambient glow */}
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30"
                  style={{ backgroundColor: brandKit.accentColorHex }}
                />

                {/* Top Bar with Handle & Logo */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    {brandKit.logoUrl ? (
                      <img
                        src={brandKit.logoUrl}
                        alt="Logo"
                        className="h-6 w-6 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: brandKit.accentColorHex }}
                      >
                        S
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-white/90">
                      {brandKit.handle || "@dein.handle"}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/20 text-white/80"
                    style={{ borderColor: brandKit.accentColorHex }}
                  >
                    LEITFADEN
                  </span>
                </div>

                {/* Center Content Sample */}
                <div className="space-y-2 z-10 my-auto">
                  <h4
                    className="text-lg font-black leading-tight text-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    So baust du ein automatisiertes Social-Media-System
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Struktur schlägt Inspiration. Wer vorab klare Formate und Markenfarben definiert,
                    erzeugt Content in Minuten statt Stunden.
                  </p>
                </div>

                {/* Bottom CTA */}
                <div className="z-10 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[200px]">
                    {brandKit.ctaText || "Speichern 📌"}
                  </span>
                  <div
                    className="h-2 w-8 rounded-full"
                    style={{ backgroundColor: brandKit.accentColorHex }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 text-center">
                Diese Einstellungen werden automatisch in jedes neue Karussell übernommen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: KI-SKILLS HUB ─────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Verfügbare KI-Skills</h3>
              <p className="text-xs text-zinc-400">
                Skills steuern Tonalität, Copywriting-Methoden und No-Go-Wörter deines KI-Generators.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSkill(null);
                setIsSkillModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Neuen KI-Skill anlegen</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => {
              const isActive = activeSkillId === skill.id;

              return (
                <div
                  key={skill.id}
                  className={cn(
                    "rounded-3xl border p-5 space-y-3 transition-all bg-black/40 backdrop-blur-xl relative flex flex-col justify-between",
                    isActive
                      ? "border-[#FF4D17] ring-1 ring-[#FF4D17]/50 shadow-[0_0_20px_rgba(255,77,23,0.15)]"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF4D17]">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{skill.name}</h4>
                          <span className="text-[10px] text-zinc-400">{skill.tone}</span>
                        </div>
                      </div>

                      {skill.isPreset ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                          Preset
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSkill(skill);
                              setIsSkillModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Bearbeiten"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                            title="Löschen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                      {skill.description}
                    </p>

                    <div className="rounded-xl bg-black/40 border border-white/5 p-2.5 text-[11px] text-zinc-400 font-mono line-clamp-2">
                      Prompt: &quot;{skill.systemPrompt}&quot;
                    </div>

                    {skill.forbiddenWords && skill.forbiddenWords.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <span>Tabu-Wörter:</span>
                        <span className="text-zinc-400 truncate">
                          {skill.forbiddenWords.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Activation Button */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectActiveSkill?.(skill.id);
                        toast.success(`Skill „${skill.name}“ aktiviert!`);
                      }}
                      className={cn(
                        "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        isActive
                          ? "bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[#FF6A1F]"
                          : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                      )}
                    >
                      {isActive ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Aktiver Studio-Skill</span>
                        </>
                      ) : (
                        <span>Als aktiven Skill wählen</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: API-KEYS & PROVIDER-SICHERHEIT ────────────────────── */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === "keys" && (
        <div className="space-y-6 animate-in fade-in-50">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/10 p-4 flex items-start gap-3 text-xs text-emerald-300">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Serverseitiger API-Key-Schutz aktiv</p>
              <p className="text-emerald-400/90 mt-0.5 leading-relaxed">
                Deine Schlüssel werden ausschließlich serverseitig über sichere Proxies ausgeführt.
                Weder dein Browser noch Dritte haben direkten Zugriff auf deine sensiblen Tokens.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. KI-Provider: Google Gemini */}
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF4D17]" />
                  <h4 className="text-sm font-bold text-white">1. KI-Provider (Texte & Storyboards)</h4>
                </div>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#FF6A1F] hover:underline flex items-center gap-1"
                >
                  <span>Kostenlosen Gemini Key holen</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-zinc-400">
                Wird genutzt für das Generieren von Titeln, Folien-Texten, Bildprompts, Captions und Hashtags.
              </p>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy... (oder Server-Default nutzen)"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#FF4D17] outline-none"
              />
            </div>

            {/* 2. Bild-Provider: KIE.AI Nano-Banana 2 */}
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#FF4D17]" />
                  <h4 className="text-sm font-bold text-white">2. Bild-Provider (Nano-Banana 2 / KIE.AI)</h4>
                </div>
                <a
                  href="https://kie.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#FF6A1F] hover:underline flex items-center gap-1"
                >
                  <span>kie.ai Dashboard</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-zinc-400">
                Wird genutzt für ultra-schnelle 3D- und Bild-Renderings im 4:5-Format.
              </p>
              <input
                type="password"
                value={kieKey}
                onChange={(e) => setKieKey(e.target.value)}
                placeholder="kie_live_... (oder Server-Default nutzen)"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#FF4D17] outline-none"
              />
            </div>

            {/* 3. Publishing-Provider: Post For Me */}
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#FF4D17]" />
                  <h4 className="text-sm font-bold text-white">3. Publishing-Provider (Post For Me API)</h4>
                </div>
                <a
                  href="https://postforme.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#FF6A1F] hover:underline flex items-center gap-1"
                >
                  <span>postforme.dev</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-zinc-400">
                Wird genutzt zum automatisierten Veröffentlichen und Planen auf Instagram, LinkedIn, TikTok & X.
              </p>
              <input
                type="password"
                value={postForMeKey}
                onChange={(e) => setPostForMeKey(e.target.value)}
                placeholder="pfm_live_... (oder Server-Default nutzen)"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#FF4D17] outline-none"
              />
            </div>

            {/* Save Keys Button */}
            <div className="flex items-center justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveKeys}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>API-Keys sicher speichern</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Skill Edit Modal ─────────────────────────────────────────── */}
      <SkillEditModal
        skill={editingSkill}
        isOpen={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false);
          setEditingSkill(null);
        }}
        onSave={handleSaveSkill}
      />
    </div>
  );
}
