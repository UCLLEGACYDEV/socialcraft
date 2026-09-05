import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  Layers,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoxBentoProps {
  onStartCarousel: () => void;
  onOpenPromptHub: () => void;
  onOpenCloneStudio: () => void;
}

const BRAND_LOGOS = [
  { name: "Claude AI", icon: Zap },
  { name: "ChatGPT", icon: Sparkles },
  { name: "Gemini Pro", icon: Cpu },
  { name: "Midjourney", icon: Layers },
  { name: "Flux Pro", icon: Flame },
];

const COMMUNITY_PROMPT_SNIPPETS = [
  {
    name: "Tariq Hasan",
    handle: "@tariqHasanSyed",
    topic: "Urban Reflection in Dramatic Light",
    likes: "2.1k",
    tag: "Cinematic",
  },
  {
    name: "Eduardo Ferreira",
    handle: "@edferreirajr",
    topic: "Retrato editorial masculino premium",
    likes: "1.1k",
    tag: "Fashion",
  },
  {
    name: "Raffa Nascimento",
    handle: "@_raffanascimento",
    topic: "Submerged in Water Minimal",
    likes: "1.0k",
    tag: "Portrait",
  },
];

export function CryptoxBento({
  onStartCarousel,
  onOpenPromptHub,
  onOpenCloneStudio,
}: CryptoxBentoProps) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-10 pb-24 space-y-16 select-none">
      {/* ── Social Proof Bar (Logoipsum style) ──────────────────── */}
      <div className="space-y-6 text-center border-t border-b border-white/[0.06] py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          Simplifying Carousel Workflows For 2,500+ Creators & Brands
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70">
          {BRAND_LOGOS.map((brand) => (
            <div key={brand.name} className="flex items-center gap-2 text-white/80 font-semibold text-sm">
              <brand.icon className="h-4 w-4 text-[#FF6A1F]" />
              <span>{brand.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section Header ─────────────────────────────────────── */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
          <span className="block">Powerful Features</span>
          <span className="block text-white/90">For Smarter Carousel Creation</span>
        </h2>
        <p className="text-sm sm:text-base text-white/60">
          KI-optimierte Workflows für virale Instagram-Karussells mit menschlicher Text- & Bild-Präzision.
        </p>
      </div>

      {/* ── Big Bento Feature Card 1 (Waveform Chart Card) ─────── */}
      <div className="cryptox-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Text & CTA */}
        <div className="space-y-5 lg:col-span-5">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            Tools For Better Social Storytelling
          </h3>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            Strukturierte 7-Slide-Frameworks: Starke Hooks, schmerzhafte Problemanalysen,
            klare Lösungen und virale Call-to-Actions mit maximaler Save- & Share-Rate.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartCarousel}
              className="cryptox-orange-btn text-xs sm:text-sm px-6 py-2.5"
            >
              <span>Get Started</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Glowing Orange Wave Chart Graphic */}
        <div className="lg:col-span-7 relative rounded-2xl border border-white/10 bg-black/50 p-6 overflow-hidden">
          {/* Timeline pills */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4 text-xs">
            <span className="font-semibold text-white">Engagement Progression</span>
            <div className="flex gap-1.5 text-[11px] font-semibold text-white/60">
              <span className="text-[#FF6A1F] bg-[#FF4D17]/15 px-2 py-0.5 rounded-md">Slide 1</span>
              <span className="px-2 py-0.5">Slide 3</span>
              <span className="px-2 py-0.5">Slide 5</span>
              <span className="px-2 py-0.5">Slide 7 (CTA)</span>
            </div>
          </div>

          {/* SVG Glowing Wave */}
          <div className="relative h-44 w-full">
            <svg
              viewBox="0 0 500 160"
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="cryptoxWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D17" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FF4D17" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="cryptoxLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF3B00" />
                  <stop offset="50%" stopColor="#FF7A29" />
                  <stop offset="100%" stopColor="#FFA048" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d="M 0,110 C 60,60 120,150 180,95 C 240,40 300,80 360,35 C 420,0 460,40 500,20 L 500,160 L 0,160 Z"
                fill="url(#cryptoxWaveGrad)"
              />
              {/* Stroke line */}
              <path
                d="M 0,110 C 60,60 120,150 180,95 C 240,40 300,80 360,35 C 420,0 460,40 500,20"
                fill="none"
                stroke="url(#cryptoxLineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-2">
            <span>Aufmerksamkeit / Hook</span>
            <span className="font-bold text-[#FF6A1F]">+94 % Verweildauer</span>
          </div>
        </div>
      </div>

      {/* ── Bento 2-Card Grid (Matching Lower Screenshot) ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Prompt Hub & Community Cards (Left card in screenshot) */}
        <div
          onClick={onOpenPromptHub}
          className="cryptox-card p-6 sm:p-8 flex flex-col justify-between space-y-6 cursor-pointer group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A1F] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Prompt Hub
              </span>
              <span className="text-xs text-white/40 group-hover:text-white transition-colors flex items-center gap-1">
                Öffnen <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Kuratierte Banana Prompts
            </h3>
            <p className="text-xs text-white/60">
              Über 220 erprobte Social-Media Prompts aus der Creator-Community mit Like-Rankings und Ein-Klick-Übernahme.
            </p>

            {/* Floating Transaction-style Snippets */}
            <div className="space-y-2.5 pt-2">
              {COMMUNITY_PROMPT_SNIPPETS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 backdrop-blur-md transition-all group-hover:border-[#FF4D17]/30"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4D17]/15 text-[#FF6A1F] font-bold text-xs">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block truncate max-w-[180px]">
                        {item.topic}
                      </span>
                      <span className="text-[10px] text-white/50">{item.handle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                      <Flame className="h-3 w-3 text-[#FF6A1F]" />
                      {item.likes}
                    </span>
                    <span className="text-[10px] text-white/40">{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Persona & Risk-Free Quality (Concentric rings with shield) */}
        <div
          onClick={onOpenCloneStudio}
          className="cryptox-card p-6 sm:p-8 flex flex-col justify-between space-y-6 cursor-pointer group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A1F] flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" /> KI Persona Studio
              </span>
              <span className="text-xs text-white/40 group-hover:text-white transition-colors flex items-center gap-1">
                Öffnen <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Konsistente Marken-Präsenz
            </h3>
            <p className="text-xs text-white/60">
              Automatische Synchronisation deiner visuellen Persona auf Hook & CTA ohne Stilbrüche.
            </p>

            {/* Concentric Glowing Security Rings (Matching Right Card in Screenshot) */}
            <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40">
              {/* Outer rings */}
              <div className="absolute h-44 w-44 rounded-full border border-white/[0.06]" />
              <div className="absolute h-32 w-32 rounded-full border border-white/[0.08]" />
              <div className="absolute h-20 w-20 rounded-full border border-[#FF4D17]/30 bg-[#FF4D17]/5" />

              {/* Glowing Shield Badge in Center */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] via-[#FF6A1F] to-[#FFA149] shadow-[0_0_35px_rgba(255,77,23,0.75)]">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>

              {/* Status pills floating on top */}
              <div className="absolute top-3 left-4 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/70">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Konsistenter Stil</span>
              </div>
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/70">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>100 % Local Storage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
