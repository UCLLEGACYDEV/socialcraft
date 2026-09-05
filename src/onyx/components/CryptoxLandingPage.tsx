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
  Coins,
  Cpu,
  Eye,
  Flame,
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
import { SocialcraftParallaxHero } from "@/components/ui/socialcraft-parallax-hero";
import type { User } from "../auth";
import { cn } from "@/lib/utils";

interface CryptoxLandingPageProps {
  currentUser: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onNavigateStudio: () => void;
  onNavigateAdmin: () => void;
  onOpenCreditsUpgrade?: () => void;
  onLogout: () => void;
}

export function CryptoxLandingPage({
  currentUser,
  onOpenAuth,
  onNavigateStudio,
  onNavigateAdmin,
  onOpenCreditsUpgrade,
  onLogout,
}: CryptoxLandingPageProps) {
  const [activeSlideFilter, setActiveSlideFilter] = useState<string>("Gesamt");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Smooth scroll without altering window.location.hash (prevents jump on reload)
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

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
    <div className="relative min-h-screen bg-[#050508] text-white selection:bg-[#FF4D17]/30 overflow-x-hidden font-sans">
      {/* ── Sleek Dark Tech Grid Canvas (No Muddy Radial Glow Blobs) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />

      {/* ── 1. Top Navigation Bar (Cryptox Dark Ember Look) ────────── */}
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
              Socialcraft
            </span>
          </div>

          {/* Center Floating Pill Nav (Programmatic Scroll without Hash) */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-[#120F17]/80 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => scrollToSection("hero")}
              className="rounded-full bg-[#FF4D17] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_-2px_#FF4D17] cursor-pointer"
            >
              Startseite
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("showcase")}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Showcase
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("why-choose")}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Vorteile
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("testimonials")}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Kundenstimmen
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Universal Admin Button */}
            <button
              type="button"
              onClick={onNavigateAdmin}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary-bright hover:bg-primary/25 transition-all shadow-[0_0_15px_-4px_#FF4D17] cursor-pointer"
              title="Admin Dashboard öffnen"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin-Bereich</span>
            </button>

            {/* Credits Upgrade Button */}
            {onOpenCreditsUpgrade && (
              <button
                type="button"
                onClick={onOpenCreditsUpgrade}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                title="Credits aufladen & upgraden"
              >
                <Coins className="h-3.5 w-3.5 text-[#FF6A1F]" />
                <span>Credits aufladen</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
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
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  Anmelden
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth("register")}
                  className="cryptox-orange-btn rounded-full px-4 py-1.5 text-xs font-semibold shadow-[0_0_20px_-3px_#FF4D17] cursor-pointer"
                >
                  Registrieren
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section: Socialcraft Parallax Hero (2nd Component UI + Parallax) ── */}
      <section id="hero" className="relative z-10">
        <SocialcraftParallaxHero
          onCtaClick={onNavigateStudio}
          onExploreClick={() => {
            const el = document.getElementById("showcase");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

      {/* ── 3. 3-Card Showcase Dashboard (Content & Carousel Theme) ─ */}
      <section id="showcase" className="relative z-10 pt-4 pb-14 px-4">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {/* Left Card: Design Archetypen */}
          <div className="cryptox-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white tracking-wide">Design-Archetypen</span>
              <span
                onClick={onNavigateStudio}
                className="text-[11px] font-semibold text-[#FF6A1F] hover:underline cursor-pointer"
              >
                Alle Stile
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { symbol: "MIN", name: "Minimalismus Clean", change: "+94% Retention", price: "142.5k", sub: "Trend #1", color: "#6366F1" },
                { symbol: "HCB", name: "High Contrast Bold", change: "+88% Hook-Rate", price: "284.1k", sub: "Trend #2", color: "#FF5722" },
                { symbol: "NEO", name: "Neo-Brutalism Dark", change: "+92% Saves", price: "318.9k", sub: "Trend #3", color: "#06B6D4" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.symbol}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] font-medium text-emerald-400">{item.change}</div>
                    </div>
                  </div>

                  {/* Micro Sparkline Curve */}
                  <svg className="h-6 w-16 stroke-white/40 fill-none stroke-[1.5]" viewBox="0 0 80 24">
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

          {/* Center Card: Elevated Storyline Retention Curve */}
          <div className="cryptox-card-elevated p-6 md:-translate-y-4">
            {/* Top Sub-Nav Pills */}
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-white font-semibold">Hook</span>
                <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Content</span>
                <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Visuals</span>
                <span className="px-1.5 py-0.5 hover:text-white cursor-pointer">Export</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 cursor-pointer" />
                <Bell className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Large Retention Display */}
            <div className="mb-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                94.8% <span className="text-xs font-normal text-white/50">Hook-Retention</span>
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
              <span className="text-white/60 font-medium">Reichweiten-Zuwachs</span>
              <span className="font-mono font-bold text-emerald-400">+4.320 Follower (+18%)</span>
            </div>
          </div>

          {/* Right Card: Content Transformer (Prompt to Slides) */}
          <div className="cryptox-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white tracking-wide">Content Transformer</span>
              <Maximize2 className="h-3.5 w-3.5 text-white/40 hover:text-white cursor-pointer" />
            </div>

            <div className="mb-3">
              <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                Nano-Banana 2 <span className="text-white/40 font-normal ml-1">Renderzeit: 1.4s</span>
              </span>
            </div>

            {/* Transform Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6366F1] text-[10px] font-bold">
                    💡
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Prompt-Thema</div>
                    <div className="text-[10px] text-white/50">10 Growth Hacks 2026</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-primary-bright">1 Klick</div>
                </div>
              </div>

              {/* Transform Arrow */}
              <div className="flex justify-center -my-1 relative z-10">
                <button
                  type="button"
                  onClick={onNavigateStudio}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#201A29] text-white/80 hover:scale-110 transition-transform shadow-md"
                  title="Im Studio öffnen"
                >
                  <Repeat className="h-3 w-3 text-primary-bright" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF4D17] text-[10px] font-bold">
                    📸
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Fertige Karussells</div>
                    <div className="text-[10px] text-emerald-400">7 Slides + ZIP Export</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">4:5 HD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Brand & AI Engine Logo Bar ─────────────────────────── */}
      <section className="relative z-10 py-10 border-y border-white/[0.06] bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-xs font-medium text-white/50 tracking-wider mb-6">
            Vereinfachte Content-Workflows für <strong className="text-white">2.500+ Creator & Social Media Teams</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            {["Instagram", "LinkedIn", "TikTok", "Midjourney", "Claude AI", "OpenAI"].map((brand, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/80 font-bold text-sm tracking-tight">
                <div className="h-5 w-5 rounded bg-white/20 flex items-center justify-center text-[10px]">
                  ✦
                </div>
                <span>{brand}</span>
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
              Mächtige Features <br />
              Für Maximale Social Media Reichweite
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/60">
              KI-gestützte Storytelling-Algorithmen mit redaktioneller Ästhetik und psychologischer Leserführung
            </p>
          </div>

          {/* Large Waveform Feature Card */}
          <div className="cryptox-card-elevated p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Copy & CTA */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                Tools Für Unwiderstehliche <br />
                Instagram Karussells
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Entwickelt, um die Verweildauer (Dwell Time) zu maximieren, Drop-Offs nach Slide 1 zu stoppen und maximale Saves & Shares zu erzielen.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateStudio}
                  className="cryptox-orange-btn inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-[0_0_20px_-2px_#FF4D17]"
                >
                  <span>Jetzt Karussell erstellen</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Col: Smooth Waveform Chart */}
            <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-black/40 p-4 sm:p-6 backdrop-blur-xl">
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
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  {["Slide 1", "Slide 3", "Slide 5", "Slide 7", "Closing", "Gesamt"].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setActiveSlideFilter(tf)}
                      className={cn(
                        "rounded px-2 py-0.5 transition-colors",
                        activeSlideFilter === tf
                          ? "bg-[#FF4D17] text-white font-bold"
                          : "text-white/50 hover:text-white",
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-white/50">Durchleserate</div>
                  <div className="text-xs font-mono font-bold text-white">94.2% Retention</div>
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
          <div className="cryptox-card p-6 sm:p-8">
            <div className="space-y-3 mb-6">
              {[
                { name: "Robert Brian", change: "+18.4% Engagement", val: "51.5k Saves", sub: "Tech & SaaS", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face" },
                { name: "Courtney Henry", change: "+24.5% Reichweite", val: "125.4k Views", sub: "Lifestyle", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face" },
                { name: "Cody Fisher", change: "+12.9% Klicks", val: "25.0k Shares", sub: "Finanzen", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=face" },
                { name: "Darlene Robertson", change: "+35.1% Follower", val: "75.0k Views", sub: "Coaching", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face" },
              ].map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
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
            <h4 className="text-base font-bold text-white">Top Creator & Viral Leaderboard</h4>
            <p className="mt-1 text-xs text-white/60">
              Echtzeit-Tracking von Follower-Wachstum, Verweildauer und Interaktionsraten über alle Karussell-Serien.
            </p>
          </div>

          {/* Bento Card 2: Persona Security Shield */}
          <div className="cryptox-card p-6 sm:p-8 flex flex-col justify-between">
            {/* Concentric Shield Graphic */}
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
                  100% Brand Safe & Konsistent
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white">KI Persona Schutz & Visuelle Marken-Konsistenz</h4>
              <p className="mt-1 text-xs text-white/60">
                Garantierte Wiedererkennung: Dein Gesicht und deine Brand Identity bleiben über alle Slides, Farben und Blickwinkel hinweg fehlerfrei synchronisiert.
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
                  className="glass-card p-6 group cursor-pointer"
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
                className="cryptox-card p-6 flex flex-col justify-between"
              >
                <div className="mb-4 flex items-center gap-1 text-amber-400">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 border-t border-white/[0.08] pt-4">
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
                  className="glass-card overflow-hidden transition-all"
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
                    <div className="px-5 pb-5 text-xs text-white/70 leading-relaxed border-t border-white/[0.06] pt-3 animate-in fade-in-50 duration-200">
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
        <div className="cryptox-card-elevated mx-auto max-w-5xl p-8 sm:p-14 text-center relative overflow-hidden">
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

      {/* ── 11. Footer ────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#0A0710] py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] to-[#FFA149]">
              <div className="h-3 w-3 rounded-full border border-white/90 border-t-transparent animate-[spin_8s_linear_infinite]" />
            </div>
            <span className="font-bold text-white text-sm">Socialcraft Studio</span>
            <span>© 2026 Alle Rechte vorbehalten.</span>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">
              Features
            </button>
            <button type="button" onClick={() => scrollToSection("why-choose")} className="hover:text-white transition-colors cursor-pointer">
              Vorteile
            </button>
            <button type="button" onClick={() => scrollToSection("testimonials")} className="hover:text-white transition-colors cursor-pointer">
              Kundenstimmen
            </button>
            <button type="button" onClick={() => scrollToSection("faq")} className="hover:text-white transition-colors cursor-pointer">
              FAQ
            </button>
            <button type="button" onClick={onNavigateStudio} className="hover:text-primary-bright transition-colors font-semibold cursor-pointer">
              Studio
            </button>
            <button type="button" onClick={onNavigateAdmin} className="text-primary-bright hover:underline font-semibold flex items-center gap-1 cursor-pointer">
              <Shield className="h-3 w-3" />
              <span>Admin-Bereich</span>
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
