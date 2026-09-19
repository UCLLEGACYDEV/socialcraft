import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Sparkles, SlidersHorizontal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageProvider, KieModel } from "@/onyx/types";

export interface EngineOption {
  id: string;
  provider: ImageProvider;
  kieModel?: KieModel;
  name: string;
  tag: string;
  desc: string;
  badge: string;
}

export const QUALITY_TIERS: EngineOption[] = [
  {
    id: "balanced",
    provider: "kie-ai",
    kieModel: "nano-banana-2",
    name: "Ausgewogen",
    tag: "Empfohlen",
    desc: "Optimale Balance aus natürlicher Bildschärfe und schneller Generierung.",
    badge: "Empfohlen",
  },
  {
    id: "highest",
    provider: "kie-ai",
    kieModel: "nano-banana-pro",
    name: "Beste Qualität",
    tag: "Maximal",
    desc: "Höchste Detailschärfe und Gesichtsgenauigkeit für finale Posts.",
    badge: "Ultra-Detail",
  },
  {
    id: "fast",
    provider: "ai33-pro",
    name: "Schnell",
    tag: "Entwurf",
    desc: "Schnelle Ergebnisse zum schnellen Testen von Motiven und Ideen.",
    badge: "Turbo",
  },
];

// Fallback legacy array for backward compatibility if imported elsewhere
export const AVAILABLE_ENGINES = QUALITY_TIERS;

interface EngineSelectorProps {
  currentProvider?: ImageProvider;
  currentKieModel?: KieModel;
  onSelectEngine: (engine: EngineOption) => void;
  compact?: boolean;
  defaultExpanded?: boolean;
}

export function EngineSelector({
  currentProvider = "kie-ai",
  currentKieModel = "nano-banana-2",
  onSelectEngine,
  compact = false,
  defaultExpanded = false,
}: EngineSelectorProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isTierActive = (opt: EngineOption) => {
    if (opt.provider === "kie-ai") {
      return currentProvider === "kie-ai" && currentKieModel === opt.kieModel;
    }
    return currentProvider === opt.provider;
  };

  const activeTier =
    QUALITY_TIERS.find((t) => isTierActive(t)) ||
    QUALITY_TIERS[0]; // defaults to Ausgewogen

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5 transition-all">
      {/* ── Collapsed / Header Bar ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-[#FF4D17] border border-orange-500/30 shrink-0">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-zinc-300">Bildqualität:</span>
            <span className="text-xs font-bold text-white truncate">{activeTier.name}</span>
            <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.2 text-[10px] font-bold text-orange-300">
              {activeTier.badge}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <span>{expanded ? "Einklappen" : "Andere Qualität wählen"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Expanded Quality Tiers ───────────────────────────────── */}
      {expanded && (
        <div className="pt-2 border-t border-white/[0.06] space-y-2 animate-in fade-in-50 duration-200">
          <p className="text-[11px] text-zinc-400">
            Wähle die passende Qualitätsstufe für deine Visuals:
          </p>
          <div className={cn("grid gap-2.5", compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-3")}>
            {QUALITY_TIERS.map((tier) => {
              const active = isTierActive(tier);
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    onSelectEngine(tier);
                    setExpanded(false);
                  }}
                  className={cn(
                    "relative flex flex-col p-3 rounded-xl border text-left transition-all group cursor-pointer",
                    active
                      ? "bg-[#FF4D17]/15 border-[#FF4D17] shadow-[0_0_20px_rgba(255,77,23,0.25)] ring-1 ring-[#FF4D17]/50"
                      : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20",
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-orange-200 transition-colors">
                      {tier.name}
                    </span>
                    {active ? (
                      <span className="h-4 w-4 rounded-full bg-[#FF4D17] text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400">
                        {tier.tag}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                    {tier.desc}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>{tier.kieModel || tier.provider}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
