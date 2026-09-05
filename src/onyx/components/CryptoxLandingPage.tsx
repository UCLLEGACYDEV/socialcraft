import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  Flame,
  Gift,
  Globe,
  Layers,
  Lock,
  Maximize2,
  RefreshCw,
  Repeat,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import type { User } from "../auth";
import { cn } from "@/lib/utils";

interface CryptoxLandingPageProps {
  currentUser: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onNavigateStudio: () => void;
  onNavigateAdmin: () => void;
  onLogout: () => void;
}

export function CryptoxLandingPage({
  currentUser,
  onOpenAuth,
  onNavigateStudio,
  onNavigateAdmin,
  onLogout,
}: CryptoxLandingPageProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<string>("1D");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Wie erzeugt Socialcraft komplette Instagram-Karussells?",
      a: "Aus deinem Thema und deiner Zielgruppe analysiert unsere Storytelling-Engine virale Hooks, teilt die Kernaussagen auf 5 bis 10 Slides auf und generiert synchronisierte Prompts für visuelle KI-Modelle wie Nano Banana 2, FLUX und Gemini.",
    },
    {
      q: "Wie funktioniert der KI-Clone für konsistente Gesichter?",
      a: "Du lädst Referenzfotos von dir oder deiner Persona hoch. Unser System verankert deine Gesichtsgeometrie, Kleidungsstile und Bildkomposition in jedem Slide-Prompt, sodass dein Look über alle Folien hinweg 100% konsistent bleibt.",
    },
    {
      q: "Welche Bild- und Sprachmodelle kann ich nutzen?",
      a: "Standardmäßig ist der lokale Browser-Mock und Nano-Banana aktiv. Du kannst jedoch jederzeit eigene API-Keys für Google Vertex/Gemini, Anthropic Claude 3.5 Sonnet, fal.ai (FLUX Schnell) oder Replicate hinterlegen.",
    },
    {
      q: "Kann ich die fertigen Slides direkt exportieren?",
      a: "Ja! Mit einem Klick erzeugt das Studio ein vollständiges ZIP-Paket mit allen hochauflösenden Slides im perfekten Instagram 4:5 Format (1080x1350px) sowie den dazugehörigen Texten und Prompts.",
    },
    {
      q: "Gibt es kostenlose Test-Credits?",
      a: "Jeder neue Creator erhält direkt nach der Registrierung 500 kostenlose Start-Credits, um sofort eigene Karussells und Prompts auszuprobieren.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#07050A] text-white selection:bg-[#FF4D17]/30 overflow-x-hidden font-sans">
      {/* ── Fixed Ambient Background Glows ────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[750px] w-[950px] rounded-full bg-[radial-gradient(circle_at_center,#FF3B00_0%,#E64A19_25%,#601300_50%,transparent_75%)] opacity-35 blur-[130px]" />
        <div className="absolute top-[40%] -left-[10%] h-[500px] w-[500px] rounded-full bg-[#FF4D17]/10 blur-[140px]" />
        <div className="absolute top-[65%] -right-[10%] h-[600px] w-[600px] rounded-full bg-[#FF6A1F]/10 blur-[150px]" />
      </div>

      {/* ── 1. Top Navigation Bar (Cryptox Style) ──────────────────── */}
      <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={onNavigateStudio}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] via-[#FF6A1F] to-[#FFA149] shadow-[0_0_24px_-4px_#FF4D17] transition-transform duration-300 group-hover:scale-105">
              <div className="h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-[spin_8s_linear_infinite]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white font-sans">
              Cryptox
            </span>
          </div>

          {/* Center Floating Pill Nav */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-[#120F17]/80 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <a
              href="#hero"
              className="rounded-full bg-[#FF4D17] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_-2px_#FF4D17]"
            >
              Home
            </a>
            <a
              href="#features"
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Features
            </a>
            <a
              href="#why-choose"
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Why choose
            </a>
            <a
              href="#testimonials"
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.role === "admin" && (
                  <button
                    type="button"
                    onClick={onNavigateAdmin}
                    className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary-bright hover:bg-primary/30 transition-all shadow-[0_0_15px_-4px_#FF4D17]"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNavigateStudio}
                  className="cryptox-orange-btn rounded-full px-4 py-1.5 text-xs font-semibold"
                >
                  Zum Studio 🚀
                </button>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 px-2.5 backdrop-blur-xl">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-6 w-6 rounded-full object-cover border border-white/20"
                  />
                  <span className="hidden sm:inline text-xs font-medium text-white/90">
                    {currentUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs text-white/40 hover:text-red-400 ml-1 transition-colors"
                    title="Abmelden"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth("login")}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  Anmelden
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth("register")}
                  className="cryptox-orange-btn rounded-full px-4 py-1.5 text-xs font-semibold shadow-[0_0_20px_-3px_#FF4D17]"
                >
                  Registrieren
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section with Fiery Swirl Vortex & 3D Badges ───── */}
      <section id="hero" className="relative z-10 pt-16 pb-20 px-4">
        <div className="mx-auto max-w-5xl text-center relative">
          {/* Orbiting Satellite Badges (1:1 like screenshot) */}
          <div className="hidden lg:block absolute -left-12 top-10 pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/80 px-3.5 py-1.5 text-xs font-medium text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-[pulse_4s_ease-in-out_infinite]">
              <span>Bitora</span>
              <div className="h-3 w-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">
                ✦
              </div>
            </div>
          </div>

          <div className="hidden lg:block absolute -left-4 top-28 pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/80 px-3.5 py-1.5 text-xs font-medium text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <span>Chainly</span>
              <div className="h-3 w-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">
                ⚙
              </div>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-8 top-12 pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/80 px-3.5 py-1.5 text-xs font-medium text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="h-3 w-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">
                ✦
              </div>
              <span>Conza</span>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-16 top-28 pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/80 px-3.5 py-1.5 text-xs font-medium text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-[pulse_5s_ease-in-out_infinite]">
              <div className="h-3 w-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">
                ⚙
              </div>
              <span>Nexbit</span>
            </div>
          </div>

          {/* Central Fiery Swirl Vortex Portal */}
          <div className="relative mx-auto mb-8 flex items-center justify-center">
            <div className="relative h-[320px] w-[320px] sm:h-[420px] sm:w-[420px] rounded-full flex items-center justify-center">
              {/* Fiery Rings */}
              <div className="cryptox-vortex-portal absolute inset-0 rounded-full" />
              <div className="absolute inset-8 rounded-full border border-[#FF6A1F]/30 bg-black/60 backdrop-blur-md" />
              <div className="absolute inset-16 rounded-full border border-white/10 bg-black/80" />

              {/* Central Text inside vortex */}
              <div className="relative z-10 max-w-xl px-4">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                  Step Into The Future Of <br />
                  <span className="bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent">
                    Social Content
                  </span>
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  AI-optimized carousel workflows with human-grade storytelling & precision design.
                </p>
              </div>
            </div>
          </div>

          {/* Hero CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={onNavigateStudio}
              className="cryptox-orange-btn inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-bold shadow-[0_0_30px_rgba(255,77,23,0.5)] hover:scale-105 transition-all"
            >
              <span>Get Started</span>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#FF4D17]">
                <ArrowRight className="h-3 w-3 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>

        {/* ── 3. 3-Card Showcase Dashboard (1:1 from screenshot) ───── */}
        <div className="mx-auto max-w-6xl mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {/* Left Card: Markets */}
          <div className="cryptox-card rounded-3xl p-5 border border-white/10 bg-[#120E18]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white tracking-wide">Markets</span>
              <span className="text-[11px] font-semibold text-[#FF6A1F] hover:underline cursor-pointer">
                See All
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { symbol: "BTA", change: "+1.8%", price: "$28,659.35", sub: "51.54 BTC", color: "#6366F1" },
                { symbol: "CHY", change: "+1.8%", price: "$28,659.35", sub: "$14.44 SOL", color: "#FF5722" },
                { symbol: "NXB", change: "+1.8%", price: "$28,659.35", sub: "$1.44 XRP", color: "#06B6D4" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.symbol[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.symbol}</div>
                      <div className="text-[10px] font-medium text-emerald-400">{item.change}</div>
                    </div>
                  </div>

                  {/* Micro Sparkline Curve */}
                  <svg className="h-6 w-20 stroke-white/40 fill-none stroke-[1.5]" viewBox="0 0 80 24">
                    <path d="M0,18 Q20,5 40,14 T80,8" />
                  </svg>

                  <div className="text-right">
                    <div className="text-xs font-bold text-white font-mono">{item.price}</div>
                    <div className="text-[10px] text-white/40">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Card: Elevated Main Balance Graph */}
          <div className="cryptox-card-elevated rounded-3xl p-6 border border-white/15 bg-[#171220]/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] md:-translate-y-4">
            {/* Top Sub-Nav Pills */}
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-white font-semibold">Home</span>
                <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Leverage</span>
                <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Earn</span>
                <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">NFT</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Gift className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Bell className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Large Balance Display */}
            <div className="mb-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                $15,4.75 <span className="text-xs font-normal text-white/50">USD</span>
              </div>
            </div>

            {/* Large Waveform Graph */}
            <div className="relative h-28 w-full my-3">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="centerGraphGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5722" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FF5722" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,70 Q40,90 80,45 T160,55 T240,25 T300,50 L300,100 L0,100 Z"
                  fill="url(#centerGraphGrad)"
                />
                <path
                  d="M0,70 Q40,90 80,45 T160,55 T240,25 T300,50"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-white/60 font-medium">Total Balance</span>
              <span className="font-mono font-bold text-emerald-400">+$432.49 (+12%)</span>
            </div>
          </div>

          {/* Right Card: Crypto Exchange */}
          <div className="cryptox-card rounded-3xl p-5 border border-white/10 bg-[#120E18]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white tracking-wide">Crypto Exchange</span>
              <Maximize2 className="h-3.5 w-3.5 text-white/40 hover:text-white cursor-pointer" />
            </div>

            <div className="mb-3">
              <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                USDETH <span className="text-white/40 font-normal ml-1">Expires in 24 hrs</span>
              </span>
            </div>

            {/* Swap Input Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6366F1] text-[10px] font-bold">
                    B
                  </div>
                  <span className="text-xs font-bold text-white">BTA</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">40.679</div>
                  <div className="text-[10px] text-white/40">67.143</div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-1 relative z-10">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#201A29] text-white/80 hover:scale-110 transition-transform"
                >
                  <Repeat className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF4D17] text-[10px] font-bold">
                    N
                  </div>
                  <span className="text-xs font-bold text-white">NBX</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">1230.365</div>
                  <div className="text-[10px] text-white/40">90.143</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Brand & AI Engine Logo Bar (1:1 from screenshot) ───── */}
      <section className="relative z-10 py-10 border-y border-white/[0.06] bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-xs font-medium text-white/50 tracking-wider mb-6">
            Simplifying Blockchain Workflows For <strong className="text-white">2,500+ Organizations</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            {["Logoipsum", "Logoipsum", "Logoipsum", "Logoipsum", "Logoipsum"].map((logo, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/80 font-bold text-sm tracking-tight">
                <div className="h-5 w-5 rounded bg-white/20 flex items-center justify-center text-[10px]">
                  ❖
                </div>
                <span>{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Powerful Features Section (Waveform Hero Card) ──────── */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Powerful Features <br />
              For Smarter Crypto Trading
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/60">
              AI-optimized sales teams with human-grade decision-making
            </p>
          </div>

          {/* Large Waveform Feature Card (1:1 from screenshot) */}
          <div className="cryptox-card rounded-3xl border border-white/10 bg-[#120E18]/90 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Copy & CTA */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                Tools For Better <br />
                Cryptocurrency Trading
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Smart platforms designed to help you analyze markets and make informed decisions with zero latency.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateStudio}
                  className="cryptox-orange-btn inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-[0_0_20px_-2px_#FF4D17]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Col: Smooth Waveform Chart */}
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
              {/* Wave SVG */}
              <div className="relative h-44 w-full">
                <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glowFeatureGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D17" stopOpacity="0.85" />
                      <stop offset="70%" stopColor="#BF360C" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 Q50,130 100,50 T200,90 T300,30 T400,60 L400,140 L0,140 Z"
                    fill="url(#glowFeatureGrad)"
                  />
                  <path
                    d="M0,80 Q50,130 100,50 T200,90 T300,30 T400,60"
                    fill="none"
                    stroke="#FF7A30"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Timeframe Pill Switcher */}
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  {["1H", "1D", "1W", "1M", "1Y", "ALL"].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setActiveTimeframe(tf)}
                      className={cn(
                        "rounded px-2 py-0.5 transition-colors",
                        activeTimeframe === tf
                          ? "bg-[#FF4D17] text-white font-bold"
                          : "text-white/50 hover:text-white",
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-white/50">Your balance</div>
                  <div className="text-xs font-mono font-bold text-white">0.000000 ETH</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Bento Grid (Leaderboard & Persona Security Shield) ─── */}
      <section className="relative z-10 py-10 px-4">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bento Card 1: Leaderboard / Analytics */}
          <div className="cryptox-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-[#120E18]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="space-y-3 mb-6">
              {[
                { name: "Robert Brian", change: "+1.8%", val: "$28,659.35", sub: "51.54 BTC", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face" },
                { name: "Courtney Henry", change: "+2.5%", val: "$1,856.20", sub: "125.45 ETH", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face" },
                { name: "Cody Fisher", change: "-0.9%", val: "$0.51", sub: "250,000 XRP", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=face" },
                { name: "Darlene Robertson", change: "+5.1%", val: "$100.75", sub: "75.00 LTC", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face" },
              ].map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{user.name}</div>
                      <div className="text-[10px] font-semibold text-emerald-400">{user.change}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">{user.val}</div>
                    <div className="text-[10px] text-white/40">{user.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <h4 className="text-base font-bold text-white">Advanced Charting & Analytics</h4>
            <p className="mt-1 text-xs text-white/60">
              Echtzeit-Tracking von Follower-Wachstum und Reichweiten für maximale Karussell-Performance.
            </p>
          </div>

          {/* Bento Card 2: Persona Security Shield */}
          <div className="cryptox-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-[#120E18]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between">
            {/* Concentric Shield Graphic (1:1 from screenshot) */}
            <div className="my-auto py-6 flex flex-col items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                {/* Outermost ring */}
                <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.02]" />
                {/* Middle ring */}
                <div className="absolute inset-4 rounded-full border border-[#FF4D17]/30 bg-[#FF4D17]/[0.04]" />
                {/* Inner glowing circle */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] to-[#FFA149] shadow-[0_0_35px_rgba(255,77,23,0.7)]">
                  <ShieldCheck className="h-9 w-9 text-white stroke-[2.5]" />
                </div>
              </div>

              {/* Connected Pills above */}
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/70">
                  Face Geometry Locked
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400 font-medium">
                  100% Brand Safe
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Smart Risk Management & Persona Guard</h4>
              <p className="mt-1 text-xs text-white/60">
                Garantierte visuelle Identität und Markenschutz über alle generierten Folien hinweg.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Why Choose Us (Vorteile) ───────────────────────────── */}
      <section id="why-choose" className="relative z-10 py-20 px-4 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Warum Socialcraft & ONYX Studio?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/60">
              Gebaut für Creator, Agenturen und Marken, die virale organische Reichweite skalieren wollen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Zap,
                title: "10x Schnellere Produktion",
                desc: "Vom Stichwort zum fertigen 10-Slide-Karussell in unter 60 Sekunden.",
              },
              {
                icon: Users,
                title: "Konsistente KI-Klone",
                desc: "Dein Gesicht, dein Stil, deine Farbwelt synchron über jede einzelne Folie.",
              },
              {
                icon: Cpu,
                title: "Multi-Model Power",
                desc: "Kombiniere Nano-Banana 2, FLUX Schnell, Google Gemini und Claude 3.5.",
              },
              {
                icon: ArrowUpRight,
                title: "1-Klick Instagram ZIP",
                desc: "Perfekt gecroppt im 4:5 Hochformat, bereit zum sofortigen Posten.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D17]/40 transition-all group"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary-bright group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. Testimonials (Kundenstimmen) ───────────────────────── */}
      <section id="testimonials" className="relative z-10 py-16 px-4 bg-[#0A0710]/60">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Geliebt von 2.500+ Creatorn & Agenturen
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/60">
              Erfahre, wie andere Creator ihre organische Reichweite mit Socialcraft verzehnfacht haben.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Mit dem Serien-Parser produziere ich den Content für einen ganzen Monat an einem einzigen Nachmittag. Die Retention unserer Karussells ist um 94% gestiegen.",
                author: "Maximilian Koch",
                role: "Head of Social @ GrowthWave",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                stars: 5,
              },
              {
                quote:
                  "Der KI-Clone ist der absolute Wahnsinn. Mein Gesicht sieht in jeder Slide fotorealistisch und konsistent aus – keine peinlichen KI-Fehler mehr.",
                author: "Sarah Lindemann",
                role: "Personal Branding Creator (140k Follower)",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
                stars: 5,
              },
              {
                quote:
                  "Das Cryptox Dark Design und die Geschwindigkeit von ONYX Studio sind einfach Next-Level. Keine komplizierten Prompts mehr nötig.",
                author: "Julian Meier",
                role: "Agenturinhaber @ Apex Media",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                stars: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="cryptox-card rounded-2xl p-6 border border-white/10 bg-[#120E18]/80 backdrop-blur-xl flex flex-col justify-between"
              >
                <div className="mb-4 flex items-center gap-1 text-amber-400">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-10 w-10 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{t.author}</div>
                    <div className="text-[11px] text-white/50">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ Accordion ──────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Häufig gestellte Fragen (FAQ)
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/60">
              Alles, was du über die Nutzung von Socialcraft wissen musst.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-[#120F17]/80 backdrop-blur-xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-xs sm:text-sm font-semibold text-white hover:text-primary-bright transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-white/40 transition-transform duration-200",
                        isOpen && "rotate-180 text-primary-bright",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-white/70 leading-relaxed border-t border-white/[0.04] pt-3 animate-in fade-in-50 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 10. Call to Action Banner ─────────────────────────────── */}
      <section className="relative z-10 py-16 px-4">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#1E1325] to-[#100B17] p-8 sm:p-14 text-center shadow-[0_20px_70px_rgba(255,77,23,0.25)] relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-[#FF4D17]/30 blur-[80px] pointer-events-none" />

          <h2 className="relative z-10 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bereit für virale Instagram Karussells?
          </h2>
          <p className="relative z-10 mt-3 text-xs sm:text-sm text-white/70 max-w-xl mx-auto">
            Erstelle jetzt dein erstes Karussell kostenlos mit 500 Willkommens-Credits. Keine Kreditkarte erforderlich.
          </p>

          <div className="relative z-10 mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateStudio}
              className="cryptox-orange-btn inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold shadow-[0_0_25px_#FF4D17]"
            >
              <span>Jetzt im Studio starten →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 11. Footer (Cryptox Style) ────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#0A0710] py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] to-[#FFA149]">
              <div className="h-3 w-3 rounded-full border border-white/90 border-t-transparent animate-[spin_8s_linear_infinite]" />
            </div>
            <span className="font-bold text-white text-sm">Cryptox Socialcraft</span>
            <span>© 2026 Alle Rechte vorbehalten.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#why-choose" className="hover:text-white transition-colors">Vorteile</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Kunden</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button type="button" onClick={onNavigateStudio} className="hover:text-primary-bright transition-colors font-semibold">
              Studio
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
              Made with ❤️ in Germany
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
