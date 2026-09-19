import React, { useState } from "react";
import {
  Palette,
  UserCheck,
  Key,
  ShieldCheck,
  Zap,
  Check,
  Upload,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Cloud,
  Lock,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BrandKit, ApiSettings, AiCloneProfile, CreditStatus, ClonePlacement } from "@/onyx/types";
import type { User as AuthUser } from "@/onyx/auth";
import { fetchKieCredits } from "@/onyx/kie-api";
import { testCloudConnection } from "@/onyx/s4-storage";
import { DEFAULT_CLONE_PROFILES } from "@/onyx/defaults";
import { LS, usePersistentState } from "@/onyx/storage";

interface ProfileAndSetupViewProps {
  brandKit: BrandKit;
  onChangeBrandKit: (patch: Partial<BrandKit>) => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  currentUser?: AuthUser | null;
  creditStatus?: CreditStatus;
  onRefreshCredits?: () => void;
}

const COLOR_PRESETS = [
  { label: "Socialcraft Orange", hex: "#FF4D17" },
  { label: "Ember Gold", hex: "#F59E0B" },
  { label: "Deep Purple", hex: "#8B5CF6" },
  { label: "Cyber Blue", hex: "#06B6D4" },
  { label: "Emerald Green", hex: "#10B981" },
  { label: "Clean White", hex: "#FFFFFF" },
];

const FONTS = ["Inter", "Cabinet Grotesk", "Plus Jakarta Sans", "Syne", "Outfit", "Space Grotesk"];

const PLACEMENT_OPTIONS: { id: ClonePlacement; label: string; desc: string }[] = [
  { id: "hook_closing", label: "Hook & Abschluss (Standard)", desc: "Persona auf Folie 1 und der letzten Folie." },
  { id: "all_slides", label: "Volle Präsenz", desc: "Persona auf jeder Folie sichtbar." },
  { id: "even_slides", label: "Alternierend", desc: "Abwechselnd mit datenbasierten Folien." },
];

export function ProfileAndSetupView({
  brandKit,
  onChangeBrandKit,
  settings,
  onChangeSettings,
  currentUser,
  creditStatus,
  onRefreshCredits,
}: ProfileAndSetupViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"brand" | "persona" | "keys">("brand");

  // Persona State
  const [profiles, setProfiles] = usePersistentState<AiCloneProfile[]>(
    LS.cloneProfiles,
    DEFAULT_CLONE_PROFILES,
  );
  const [activeCloneId, setActiveCloneId] = usePersistentState<string>(
    LS.activeCloneId,
    profiles[0]?.id || "",
  );
  const activeClone = profiles.find((p) => p.id === activeCloneId) || profiles[0];

  // Testing States
  const [isTestingKie, setIsTestingKie] = useState(false);
  const [isTestingCloud, setIsTestingCloud] = useState(false);

  const handleTestKie = async () => {
    setIsTestingKie(true);
    try {
      const res = await fetchKieCredits(settings.kieApiKey || "");
      if (res.success) {
        toast.success(`Kie AI verbunden! Guthaben: ${res.credits.toLocaleString()} Credits`);
        if (onRefreshCredits) onRefreshCredits();
      } else {
        toast.error(`Kie AI Fehler: ${res.error || "Schlüssel prüfen"}`);
      }
    } catch {
      toast.error("Verbindungstest fehlgeschlagen.");
    } finally {
      setIsTestingKie(false);
    }
  };

  const handleTestCloud = async () => {
    setIsTestingCloud(true);
    try {
      const res = await testCloudConnection();
      if (res.success) {
        toast.success("Cloud-Speicher verbunden & bereit ☁️");
      } else {
        toast.error(`Speicherfehler: ${res.message}`);
      }
    } catch {
      toast.error("Cloud-Test fehlgeschlagen.");
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleUpdateClonePlacement = (placement: ClonePlacement) => {
    if (!activeClone) return;
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeClone.id ? { ...p, placement } : p)),
    );
    toast.success("Platzierungsmodus aktualisiert!");
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto pb-16 animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
            Zentrale Konfiguration
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
          Mein Look & Setup
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          Alle deine Brand-Farben, Persona-Gesichter und API-Schlüssel sicher an einem einzigen Ort.
        </p>
      </div>

      {/* ── Sub-Tab Umschalter ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab("brand")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeSubTab === "brand"
              ? "bg-[#FF4D17] text-white shadow-sm"
              : "text-zinc-400 hover:text-white",
          )}
        >
          <Palette className="h-4 w-4" />
          <span>1. Mein Look (Brand Kit)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("persona")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeSubTab === "persona"
              ? "bg-[#FF4D17] text-white shadow-sm"
              : "text-zinc-400 hover:text-white",
          )}
        >
          <UserCheck className="h-4 w-4" />
          <span>2. Mein Gesicht (Persona)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("keys")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeSubTab === "keys"
              ? "bg-[#FF4D17] text-white shadow-sm"
              : "text-zinc-400 hover:text-white",
          )}
        >
          <Key className="h-4 w-4" />
          <span>3. API-Schlüssel & Speicher</span>
        </button>
      </div>

      {/* ── Tab 1: Mein Look (Brand Kit) ────────────────────────────── */}
      {activeSubTab === "brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50">
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/[0.06] pb-3">
                Markenidentität & Social Handle
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Dein Social-Media Handle:
                  </label>
                  <input
                    type="text"
                    value={brandKit.handle}
                    onChange={(e) => onChangeBrandKit({ handle: e.target.value })}
                    placeholder="@dein_account"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none font-mono"
                  />
                  <span className="text-[11px] text-zinc-500">
                    Erscheint dezent auf Folien zur Markenwiedererkennung.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Signatur-CTA (Abschluss-Aufruf):
                  </label>
                  <input
                    type="text"
                    value={brandKit.ctaText}
                    onChange={(e) => onChangeBrandKit({ ctaText: e.target.value })}
                    placeholder="Folge für täglichen Content zum Thema Personal Branding"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/[0.06] pb-3">
                Farben & Typografie
              </h3>

              {/* Akzentfarbe */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Primäre Akzentfarbe:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => onChangeBrandKit({ accentColorHex: col.hex })}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        brandKit.accentColorHex === col.hex
                          ? "border-white bg-white/15 text-white"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white",
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schriftart */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label className="text-xs font-semibold text-zinc-300 block">Schriftart:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => onChangeBrandKit({ fontFamily: font })}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left",
                        brandKit.fontFamily === font
                          ? "border-[#FF4D17] bg-[#FF4D17]/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white",
                      )}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Vorschau Card */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.06] pb-3">
                Live Brand-Vorschau
              </h3>

              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#120F17] to-black p-6 flex flex-col justify-between shadow-2xl">
                {/* Header with Handle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white/20 shadow-sm"
                      style={{ backgroundColor: brandKit.accentColorHex || "#FF4D17" }}
                    />
                    <span className="text-xs font-bold text-white font-mono">
                      {brandKit.handle || "@mein_handle"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">01 / 07</span>
                </div>

                {/* Main Headline */}
                <div className="space-y-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                    style={{
                      color: brandKit.accentColorHex || "#FF4D17",
                      borderColor: `${brandKit.accentColorHex || "#FF4D17"}40`,
                      backgroundColor: `${brandKit.accentColorHex || "#FF4D17"}15`,
                    }}
                  >
                    Vorschau
                  </span>
                  <h4
                    className="text-lg font-black text-white leading-tight"
                    style={{ fontFamily: brandKit.fontFamily }}
                  >
                    So wirkt deine Marke auf Social Media
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Deterministische Typografie ohne Tippfehler, perfekt lesbar auf jedem Smartphone.
                  </p>
                </div>

                {/* Footer CTA */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">{brandKit.ctaText || "Folge für mehr"}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#FF4D17]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Mein Gesicht (Persona) ───────────────────────────── */}
      {activeSubTab === "persona" && activeClone && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50">
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Aktive Persona: {activeClone.name}</h3>
                  <p className="text-xs text-zinc-400">{activeClone.role || "Founder & Creator"}</p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  ≥95% Ähnlichkeitsanker aktiv
                </span>
              </div>

              {/* Character Sheet 4 Ansichten */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">
                  Character Sheet Referenzansichten (Frontal, Profil, Dreiviertel, Halbfigur):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {["Frontal", "Halbprofil", "Dreiviertel", "Halbfigur"].map((lbl, idx) => {
                    const img = activeClone.referenceImages[idx] || activeClone.avatarUrl || activeClone.referenceImages[0];
                    return (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-black overflow-hidden p-1 space-y-1">
                        <div className="aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900">
                          <img src={img} alt={lbl} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-400 block text-center uppercase">
                          {lbl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signatur-Merkmale */}
              <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                <span className="text-xs font-semibold text-zinc-300 block">Signatur-Look:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Garderobe</span>
                    <span className="text-white font-medium">{activeClone.wardrobe}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Licht & Kamera</span>
                    <span className="text-white font-medium">{activeClone.lightingLook}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Platzierungsmodi */}
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.06] pb-3">
                Platzierung im Karussell
              </h3>

              <div className="space-y-2">
                {PLACEMENT_OPTIONS.map((opt) => {
                  const isSel = activeClone.placement === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleUpdateClonePlacement(opt.id)}
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
                      <p className="text-[11px] text-zinc-400">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: API-Schlüssel & Speicher ─────────────────────────── */}
      {activeSubTab === "keys" && (
        <div className="space-y-5 max-w-3xl animate-in fade-in-50">
          {/* Multi-Kanal Publisher Keys */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Multi-Kanal Publisher (Social Media)</h3>
                  <p className="text-xs text-zinc-400">Direktes Veröffentlichen via offizielle APIs</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Publisher API-Key (PostForMe / Zernio):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.postForMeApiKey || settings.zernioApiKey || ""}
                    onChange={(e) =>
                      onChangeSettings({
                        postForMeApiKey: e.target.value,
                        zernioApiKey: e.target.value,
                      })
                    }
                    placeholder="pfm_live_... oder zen_..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bild-Modell Key (Kie AI) */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bildgenerierung (Kie AI)</h3>
                  <p className="text-xs text-zinc-400">Verantwortlich für Ultra-HD Visuals & Porträts</p>
                </div>
              </div>

              <button
                type="button"
                disabled={isTestingKie}
                onClick={handleTestKie}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", isTestingKie && "animate-spin")} />
                <span>Guthaben abfragen</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">Kie AI API-Key:</label>
              <input
                type="password"
                value={settings.kieApiKey || ""}
                onChange={(e) => onChangeSettings({ kieApiKey: e.target.value })}
                placeholder="kie_live_..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none font-mono"
              />
            </div>
          </div>

          {/* LLM & Text-Modell Keys */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Text-Modell & Storyboard Keys</h3>
                  <p className="text-xs text-zinc-400">Erzeugt Headlines, Dramaturgie und Virale Hooks</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">Google Gemini API-Key:</label>
                <input
                  type="password"
                  value={settings.geminiApiKey || ""}
                  onChange={(e) => onChangeSettings({ geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">OpenAI API-Key (Optional):</label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ""}
                  onChange={(e) => onChangeSettings({ openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-[#FF4D17] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cloud-Speicher (S4 / S3) */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Integrierter Cloud-Speicher</h3>
                  <p className="text-xs text-zinc-400">Sichert deine fertigen Beiträge und Bilder</p>
                </div>
              </div>

              <button
                type="button"
                disabled={isTestingCloud}
                onClick={handleTestCloud}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", isTestingCloud && "animate-spin")} />
                <span>Verbindung testen</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-300 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06]">
              <span>Automatisches Sichern bei Generierung:</span>
              <button
                type="button"
                onClick={() => onChangeSettings({ s4AutoSave: !settings.s4AutoSave })}
                className={cn(
                  "px-3 py-1 rounded-xl font-bold transition-all cursor-pointer",
                  settings.s4AutoSave
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/10 text-zinc-400",
                )}
              >
                {settings.s4AutoSave ? "Aktiviert" : "Deaktiviert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
