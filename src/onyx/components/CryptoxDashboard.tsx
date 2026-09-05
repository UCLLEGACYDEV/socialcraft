import { useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  Coins,
  Cpu,
  Expand,
  Flame,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DESIGN_TEMPLATES, LLM_PROVIDERS } from "../defaults";
import type { AiCloneProfile, ApiSettings, BriefValues } from "../types";
import { cn } from "@/lib/utils";

const SUGGESTED_TOPICS = [
  "10 Zeichen für verdeckten Narzissmus",
  "7 Denkfehler kluger Köpfe",
  "Warum Disziplin Motivation schlägt",
  "5 Schritte zum profitablen B2B-Angebot",
];

interface CryptoxDashboardProps {
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  activeClone?: AiCloneProfile | undefined;
  onOpenCloneStudio: () => void;
}

export function CryptoxDashboard({
  brief,
  onChangeBrief,
  onSubmit,
  isGenerating,
  settings,
  onChangeSettings,
  activeClone,
  onOpenCloneStudio,
}: CryptoxDashboardProps) {
  const [activeCenterTab, setActiveCenterTab] = useState<"prompt" | "audience">("prompt");

  return (
    <div id="studio-dashboard" className="mx-auto w-full max-w-[1400px] px-4 pb-16">
      {/* ── 3-Card Glass Grid (Matching Reference Screenshot) ────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* ── LEFT CARD: "Markets" Style (Parameters & Templates) ──── */}
        <div className="cryptox-card p-6 flex flex-col justify-between space-y-5 lg:col-span-4">
          <div className="space-y-4">
            {/* Header: Markets style */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-base font-bold text-white tracking-wide">
                Parameter & Stil
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeBrief({
                    slideCount: 6,
                    designId: "ember-ignite",
                    ctaText: "Speichere dir diesen Post für später ab.",
                  })
                }
                className="text-xs font-semibold text-[#FF6A1F] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Parameter Row 1: Slide Count Slider */}
            <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-[#FF6A1F]">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Slide-Umfang</span>
                    <span className="text-[10px] text-white/50">
                      {brief.slideCount <= 4
                        ? "Snack-Content"
                        : brief.slideCount <= 7
                          ? "Instagram-Standard"
                          : "Deep Dive Guide"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.max(2, brief.slideCount - 1) })}
                    disabled={brief.slideCount <= 2}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-white">
                    {brief.slideCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeBrief({ slideCount: Math.min(10, brief.slideCount + 1) })}
                    disabled={brief.slideCount >= 10}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Range slider */}
              <div className="pt-1.5 px-1">
                <Slider
                  value={[brief.slideCount]}
                  min={2}
                  max={10}
                  step={1}
                  onValueChange={([v]) => v !== undefined && onChangeBrief({ slideCount: v })}
                />
              </div>
            </div>

            {/* Parameter Row 2: Design Archetypes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60 block">
                Design Archetype
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DESIGN_TEMPLATES.slice(0, 4).map((tpl) => {
                  const isSelected = brief.designId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onChangeBrief({ designId: tpl.id })}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-left transition-all",
                        isSelected
                          ? "border-[#FF4D17] bg-[#FF4D17]/15 shadow-[0_0_18px_-5px_#FF4D17]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {tpl.swatch.slice(0, 2).map((c, i) => (
                          <span
                            key={i}
                            className="h-2.5 w-2.5 rounded-full border border-white/20"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-white truncate">{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parameter Row 3: CTA & Social Handle */}
            <div className="space-y-2 pt-1 border-t border-white/[0.06]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                    Handle
                  </label>
                  <input
                    value={brief.handle}
                    onChange={(e) => onChangeBrief({ handle: e.target.value })}
                    placeholder="@dein.profil"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FF4D17]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                    CTA Button
                  </label>
                  <input
                    value={brief.ctaText}
                    onChange={(e) => onChangeBrief({ ctaText: e.target.value })}
                    placeholder="Folge für mehr"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FF4D17]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER CARD: Elevated Phone/Wallet Style (Prompt Engine) ── */}
        <div className="cryptox-card-elevated p-6 flex flex-col justify-between space-y-4 lg:col-span-4 relative -translate-y-2 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
          {/* Top Mini-Nav Bar inside Card */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setActiveCenterTab("prompt")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  activeCenterTab === "prompt"
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white",
                )}
              >
                Thema & Prompt
              </button>
              <button
                type="button"
                onClick={() => setActiveCenterTab("audience")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  activeCenterTab === "audience"
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white",
                )}
              >
                Zielgruppe
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono text-[#FF6A1F] bg-[#FF4D17]/10 border border-[#FF4D17]/30 rounded-full px-2.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              <span>{brief.slideCount} Slides</span>
            </div>
          </div>

          {/* Center Card Big Prompt Input */}
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {activeCenterTab === "prompt" ? (
              <div className="space-y-2 flex-1">
                <textarea
                  rows={4}
                  value={brief.topic}
                  onChange={(e) => onChangeBrief({ topic: e.target.value })}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      if (brief.topic.trim() && !isGenerating) onSubmit();
                    }
                  }}
                  placeholder="Worüber möchtest du ein Karussell erstellen? Beschreibe deine Kernbotschaft oder Stichpunkte…"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm sm:text-base leading-relaxed text-white placeholder:text-white/35 outline-none focus:border-[#FF4D17] transition-all"
                />

                {/* Quick Topic Chips */}
                {!brief.topic && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-white/50 block">Beliebte Themen:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_TOPICS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => onChangeBrief({ topic: sug })}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/70 hover:border-[#FF4D17]/50 hover:bg-[#FF4D17]/10 hover:text-white transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 py-2 flex-1">
                <label className="text-xs font-semibold text-white/80 block">
                  Spezifische Zielgruppe & Persona
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    value={brief.audience}
                    onChange={(e) => onChangeBrief({ audience: e.target.value })}
                    placeholder="z. B. Gründer:innen zwischen 25 und 40, B2B Entscheider…"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#FF4D17]"
                  />
                </div>
                <p className="text-[11px] text-white/50">
                  Die Zielgruppe formt die Tonalität und Schmerzpunkte deiner Slide-Texte.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Glowing Action Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isGenerating || !brief.topic.trim()}
            className="cryptox-orange-btn w-full py-3.5 text-sm font-bold tracking-wide"
          >
            <span>{isGenerating ? "Generiere Slides…" : `${brief.slideCount} Slides generieren`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── RIGHT CARD: "Crypto Exchange" Style (Engine & Persona) ── */}
        <div className="cryptox-card p-6 flex flex-col justify-between space-y-5 lg:col-span-4">
          <div className="space-y-4">
            {/* Header: Crypto Exchange style */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-base font-bold text-white tracking-wide">
                Studio Engine & Clone
              </span>
              <Cpu className="h-4 w-4 text-[#FF6A1F]" />
            </div>

            {/* Exchange Section 1: Model & LLM Provider */}
            <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/70">Bild-Modell</span>
                <span className="font-bold text-white">{settings.kieModel}</span>
              </div>
              <div className="flex gap-1.5">
                {(["nano-banana-2", "nano-banana-pro"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChangeSettings({ kieModel: m })}
                    className={cn(
                      "flex-1 rounded-xl border py-1.5 text-xs font-semibold transition-colors",
                      settings.kieModel === m
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F]"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center py-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60">
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/70">Text-Engine</span>
                <span className="font-bold text-white uppercase">{brief.provider}</span>
              </div>
              <div className="flex gap-1.5">
                {LLM_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChangeBrief({ provider: p.id })}
                    className={cn(
                      "flex-1 rounded-xl border py-1.5 text-xs font-semibold transition-colors",
                      brief.provider === p.id
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F]"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exchange Section 2: AI Clone Switcher */}
            <div
              onClick={() => onChangeBrief({ useClone: !brief.useClone })}
              className={cn(
                "rounded-2xl border p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3",
                brief.useClone
                  ? "border-[#FF4D17] bg-[#FF4D17]/15 shadow-[0_0_24px_-8px_#FF4D17]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
              )}
            >
              <div className="flex items-center gap-3">
                {activeClone?.avatarUrl ? (
                  <img
                    src={activeClone.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-[#FF6A1F]">
                    <UserCheck className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-white block">
                    {activeClone ? activeClone.name : "AI Persona"}
                  </span>
                  <span className="text-[10px] text-white/50">
                    {brief.useClone ? "In Slide-Prompts aktiv" : "Klicken zum Aktivieren"}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold",
                  brief.useClone
                    ? "bg-[#FF4D17] text-white"
                    : "bg-white/10 text-white/60",
                )}
              >
                {brief.useClone ? "AN" : "AUS"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
