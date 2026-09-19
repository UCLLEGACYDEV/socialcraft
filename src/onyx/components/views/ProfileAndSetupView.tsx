import React, { useState } from "react";
import {
  Palette,
  Key,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  Cloud,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BrandKit, ApiSettings, CreditStatus } from "@/onyx/types";
import type { User as AuthUser } from "@/onyx/auth";
import { fetchKieCredits } from "@/onyx/kie-api";
import { testCloudConnection } from "@/onyx/s4-storage";

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

export function ProfileAndSetupView({
  brandKit,
  onChangeBrandKit,
  settings,
  onChangeSettings,
  currentUser,
  creditStatus,
  onRefreshCredits,
}: ProfileAndSetupViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"keys" | "brand">("keys");
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
            Zentrale Konfiguration
          </span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white font-sans mt-1">
          API-Schlüssel & Brand-Setup
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Alle deine Zugänge, KI-Engines und dein Marken-Erscheinungsbild sicher hinterlegt.
        </p>
      </div>

      {/* ── Sub-Tab Umschalter ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] w-full sm:w-fit">
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
          <span>1. API-Schlüssel & Speicher</span>
        </button>

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
          <span>2. Mein Look (Brand Kit)</span>
        </button>
      </div>

      {/* ── Tab 1: API-Schlüssel & Speicher ─────────────────────────── */}
      {activeSubTab === "keys" && (
        <div className="space-y-5 animate-in fade-in-50">
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
                    value={settings.postForMeApiKey || ""}
                    onChange={(e) => onChangeSettings({ postForMeApiKey: e.target.value })}
                    placeholder="pfm_live_..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  Wird für die automatische Verteilung von Karussells und Beiträgen verwendet.
                </span>
              </div>
            </div>
          </div>

          {/* Kie AI Image Engine */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Kie AI Bild-Engine</h3>
                  <p className="text-xs text-zinc-400">Ultra-realistische 4K Slide-Visuals & Renderings</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestKie}
                disabled={isTestingKie}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", isTestingKie && "animate-spin")} />
                Testen
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">Kie AI API-Key:</label>
                <input
                  type="password"
                  value={settings.kieApiKey || ""}
                  onChange={(e) => onChangeSettings({ kieApiKey: e.target.value })}
                  placeholder="kie_live_..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 block">Modell:</label>
                  <select
                    value={settings.kieModel || "nano-banana-2"}
                    onChange={(e) => onChangeSettings({ kieModel: e.target.value as any })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="nano-banana-2">Nano Banana 2 (Ultra-Fast)</option>
                    <option value="flux-pro">Flux Pro (High Detail)</option>
                    <option value="flux-schnell">Flux Schnell</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 block">Auflösung:</label>
                  <select
                    value={settings.kieResolution || "1K"}
                    onChange={(e) => onChangeSettings({ kieResolution: e.target.value as any })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="1K">1K (Standard Karussell)</option>
                    <option value="2K">2K (High Resolution)</option>
                    <option value="4K">4K (Ultra Crisp)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Mega S4 Cloud Storage */}
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mega S4 Cloud-Speicher</h3>
                  <p className="text-xs text-zinc-400">Permanenter, unbegrenzter Cloud-Speicher für deine Slides</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestCloud}
                disabled={isTestingCloud}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", isTestingCloud && "animate-spin")} />
                Verbindung prüfen
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">S4 Access Key:</label>
                <input
                  type="password"
                  value={settings.s4AccessKey || ""}
                  onChange={(e) => onChangeSettings({ s4AccessKey: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">S4 Secret Key:</label>
                <input
                  type="password"
                  value={settings.s4SecretKey || ""}
                  onChange={(e) => onChangeSettings({ s4SecretKey: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Mein Look (Brand Kit) ────────────────────────────── */}
      {activeSubTab === "brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50">
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/[0.06] pb-3">
                Grundlegende Brand-Identität
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">Handle / Name:</label>
                  <input
                    type="text"
                    value={brandKit.handle || ""}
                    onChange={(e) => onChangeBrandKit({ handle: e.target.value })}
                    placeholder="@dein.profil"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D17]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">Standard Call-to-Action:</label>
                  <input
                    type="text"
                    value={brandKit.ctaText || ""}
                    onChange={(e) => onChangeBrandKit({ ctaText: e.target.value })}
                    placeholder="Speichere diesen Beitrag für später"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D17]"
                  />
                </div>
              </div>

              {/* Akzentfarbe */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label className="text-xs font-semibold text-zinc-300 block">Akzentfarbe:</label>
                <div className="flex flex-wrap gap-2">
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
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.06] pb-3">
                Live Brand-Vorschau
              </h3>

              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#120F17] to-black p-6 flex flex-col justify-between shadow-2xl">
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
                    Dein Marken-Look im Karussell
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-3">
                    So sieht die Typografie und dein Farbakzent auf den generierten Folien aus.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
                  <span className="text-zinc-400">{brandKit.ctaText || "Folge für mehr"}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#FF4D17]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
