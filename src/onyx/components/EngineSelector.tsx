import { Check, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageProvider, KieModel } from "../types";

export interface EngineOption {
  id: string;
  provider: ImageProvider;
  kieModel?: KieModel;
  name: string;
  tag: string;
  desc: string;
  badge: string;
}

export const AVAILABLE_ENGINES: EngineOption[] = [
  {
    id: "nano-banana-2",
    provider: "kie-ai",
    kieModel: "nano-banana-2",
    name: "Nano-Banana 2",
    tag: "Empfohlen",
    desc: "Höchste Fotorealistik & Gesichts-Konsistenz",
    badge: "🍌 KIE AI",
  },
  {
    id: "nano-banana-pro",
    provider: "kie-ai",
    kieModel: "nano-banana-pro",
    name: "Nano-Banana Pro",
    tag: "Ultra 8K",
    desc: "Maximale Detailtiefe & scharfe Texturen",
    badge: "🍌 KIE Pro",
  },
  {
    id: "gpt-image-2-text-to-image",
    provider: "kie-ai",
    kieModel: "gpt-image-2-text-to-image",
    name: "GPT-Image 2",
    tag: "OpenAI",
    desc: "OpenAI GPT-Image via KIE API",
    badge: "🤖 OpenAI",
  },
  {
    id: "flux-pro",
    provider: "ai33-pro",
    name: "Flux 1.1 Pro",
    tag: "Editorial",
    desc: "High-End Magazin & Fashion Look",
    badge: "⚡ Flux",
  },
  {
    id: "gemini-imagen",
    provider: "gemini-imagen",
    name: "Google Imagen 3",
    tag: "Google Flow",
    desc: "Google DeepMind Imagen 3 Engine",
    badge: "💎 Google",
  },
];

interface EngineSelectorProps {
  currentProvider?: ImageProvider;
  currentKieModel?: KieModel;
  onSelectEngine: (engine: EngineOption) => void;
  compact?: boolean;
}

export function EngineSelector({
  currentProvider = "kie-ai",
  currentKieModel = "nano-banana-2",
  onSelectEngine,
  compact = false,
}: EngineSelectorProps) {
  const isEngineActive = (opt: EngineOption) => {
    if (opt.provider === "kie-ai") {
      return currentProvider === "kie-ai" && currentKieModel === opt.kieModel;
    }
    return currentProvider === opt.provider;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#FF4D17]" />
          <span>KI-Engine & Modell wählen:</span>
        </label>
        <span className="text-[10px] text-zinc-500">
          Direkt umschaltbar
        </span>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5")}>
        {AVAILABLE_ENGINES.map((opt) => {
          const active = isEngineActive(opt);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectEngine(opt)}
              className={cn(
                "relative flex flex-col p-2.5 rounded-xl border text-left transition-all group cursor-pointer",
                active
                  ? "bg-[#FF4D17]/15 border-[#FF4D17] shadow-[0_0_20px_rgba(255,77,23,0.25)] ring-1 ring-[#FF4D17]/50"
                  : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20",
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono font-bold text-zinc-400">
                  {opt.badge}
                </span>
                {active ? (
                  <span className="h-4 w-4 rounded-full bg-[#FF4D17] text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400">
                    {opt.tag}
                  </span>
                )}
              </div>

              <span className={cn("text-xs font-bold truncate", active ? "text-white" : "text-zinc-300 group-hover:text-white")}>
                {opt.name}
              </span>

              <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
