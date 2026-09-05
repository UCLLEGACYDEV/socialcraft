import { ArrowRight, Cpu, Layers, Ratio, Settings2, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoxHeroProps {
  slideCount: number;
  modelName: string;
  aspectRatio: string;
  isCloneActive: boolean;
  onCtaClick: () => void;
  ctaLabel?: string;
  isLoading?: boolean;
}

export function CryptoxHero({
  slideCount,
  modelName,
  aspectRatio,
  isCloneActive,
  onCtaClick,
  ctaLabel = "Get Started",
  isLoading = false,
}: CryptoxHeroProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-[1300px] flex-col items-center justify-center pt-8 pb-14 text-center select-none overflow-visible">
      {/* ── 3D Cosmic Fiery Swirl Vortex ───────────────────────── */}
      <div className="cryptox-vortex-portal" aria-hidden="true" />

      {/* ── Orbiting Satellite Chips (Matching Reference) ──────── */}
      {/* Top Left: Bitora style */}
      <div className="hidden lg:block absolute left-8 top-12 animate-[float_6s_ease-in-out_infinite]">
        <div className="cryptox-satellite-pill">
          <span className="text-white/80 font-semibold">{slideCount} Slides</span>
          <Layers className="h-3.5 w-3.5 text-[#FF6A1F]" />
        </div>
      </div>

      {/* Mid Left: Chainly style */}
      <div className="hidden lg:block absolute left-16 top-36 animate-[float_8s_ease-in-out_infinite_1s]">
        <div className="cryptox-satellite-pill">
          <span className="text-white/80 font-semibold">{modelName}</span>
          <Cpu className="h-3.5 w-3.5 text-[#FF6A1F]" />
        </div>
      </div>

      {/* Top Right: Conza style */}
      <div className="hidden lg:block absolute right-8 top-12 animate-[float_7s_ease-in-out_infinite_0.5s]">
        <div className="cryptox-satellite-pill">
          <Ratio className="h-3.5 w-3.5 text-[#FF6A1F]" />
          <span className="text-white/80 font-semibold">{aspectRatio}</span>
        </div>
      </div>

      {/* Mid Right: Nexbit style */}
      <div className="hidden lg:block absolute right-16 top-36 animate-[float_9s_ease-in-out_infinite_1.5s]">
        <div className="cryptox-satellite-pill">
          <UserCheck className="h-3.5 w-3.5 text-[#FF6A1F]" />
          <span className="text-white/80 font-semibold">
            {isCloneActive ? "Persona aktiv" : "Persona bereit"}
          </span>
        </div>
      </div>

      {/* ── Central Hero Content ───────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-4xl space-y-4 px-4">
        {/* Main Display Title (Exactly matching Cryptox typography) */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl font-sans leading-[1.08]">
          <span className="block drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">Step Into The Future Of</span>
          <span className="block drop-shadow-[0_4px_24px_rgba(255,77,23,0.35)]">Carousel Creation</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-white/75 font-normal leading-relaxed drop-shadow">
          AI-optimized carousel series with human-grade storytelling, high-contrast visuals, and instant ZIP export.
        </p>

        {/* Primary Glowing Orange CTA Button (Matching 'Get Started ->' from image) */}
        <div className="pt-3">
          <button
            type="button"
            onClick={onCtaClick}
            disabled={isLoading}
            className="cryptox-orange-btn text-sm sm:text-base px-7 py-3"
          >
            <span>{isLoading ? "Erzeuge…" : ctaLabel}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
