'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { ArrowUpRight, Flame, Layers, Sparkles, Zap } from 'lucide-react';

interface SocialcraftParallaxHeroProps {
  onCtaClick?: () => void;
  onExploreClick?: () => void;
}

export function SocialcraftParallaxHero({
  onCtaClick,
  onExploreClick,
}: SocialcraftParallaxHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    if (!container) return;

    const layersContainer = container.querySelector('[data-parallax-scene]');
    if (!layersContainer) return;

    // Timeline for multi-layered parallax depth
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });

    // Layer 1: Background ambient glows & video (moves slow down)
    tl.to(
      container.querySelectorAll('[data-layer="bg"]'),
      { yPercent: 30, ease: 'none' },
      0,
    );

    // Layer 2: Text content (moves slightly faster up)
    tl.to(
      container.querySelectorAll('[data-layer="text"]'),
      { yPercent: -20, opacity: 0.85, ease: 'none' },
      0,
    );

    // Layer 3: Floating 3D badges (independent counter movements)
    tl.to(
      container.querySelectorAll('[data-layer="badge-left"]'),
      { yPercent: -50, xPercent: -10, ease: 'none' },
      0,
    );
    tl.to(
      container.querySelectorAll('[data-layer="badge-right"]'),
      { yPercent: -60, xPercent: 10, ease: 'none' },
      0,
    );

    // Layer 4: Main 3D Dashboard Mockup (rises dramatically towards camera)
    tl.to(
      container.querySelectorAll('[data-layer="mockup"]'),
      {
        yPercent: -35,
        scale: 1.05,
        rotateX: 0,
        ease: 'none',
      },
      0,
    );

    // Layer 5: Foreground floating metric cards
    tl.to(
      container.querySelectorAll('[data-layer="fg-card"]'),
      { yPercent: -80, ease: 'none' },
      0,
    );

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.killTweensOf(container);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#050508] text-white pt-10 pb-24"
    >
      {/* ── Layer 1: Clean Dark Canvas with Video & Delicate Dot Grid ─ */}
      <div
        data-layer="bg"
        className="pointer-events-none absolute inset-0 z-0 h-[140%] w-full overflow-hidden"
      >
        {/* Subtle Tech Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Jelly Video Background with clean blend */}
        <video
          autoPlay
          loop
          muted
          playsInline
          src="https://ease-one.vercel.app/bg/something.mp4"
          className="h-full w-full object-cover opacity-20 mix-blend-screen"
        />

        {/* Smooth Clean Fade Out */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-transparent to-[#050508]" />
      </div>

      {/* ── Parallax Scene Container ───────────────────────────────── */}
      <div data-parallax-scene className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Floating Satellite Badges (Parallax Layer 3) */}
        <div className="pointer-events-none absolute inset-x-0 top-16 hidden lg:block">
          {/* Top Left Badge */}
          <div
            data-layer="badge-left"
            className="absolute left-6 top-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/90 px-4 py-2 text-xs font-semibold text-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4D17] text-[10px] text-white shadow-[0_0_10px_#FF4D17]">
              <Flame className="h-3 w-3" />
            </div>
            <span>Viraler Hook Booster ✦</span>
          </div>

          {/* Bottom Left Badge */}
          <div
            data-layer="badge-left"
            className="absolute left-16 top-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/90 px-4 py-2 text-xs font-semibold text-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white shadow-[0_0_10px_#06B6D4]">
              <Zap className="h-3 w-3" />
            </div>
            <span>Storyline Optimierer ⚙</span>
          </div>

          {/* Top Right Badge */}
          <div
            data-layer="badge-right"
            className="absolute right-8 top-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/90 px-4 py-2 text-xs font-semibold text-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white shadow-[0_0_10px_#F59E0B]">
              ✦
            </div>
            <span>Nano Banana 2 Engine</span>
          </div>

          {/* Bottom Right Badge */}
          <div
            data-layer="badge-right"
            className="absolute right-14 top-44 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#120F17]/90 px-4 py-2 text-xs font-semibold text-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white shadow-[0_0_10px_#9333EA]">
              <Sparkles className="h-3 w-3" />
            </div>
            <span>Konsistenter KI-Klon</span>
          </div>
        </div>

        {/* ── Layer 2: Clean Apple Pro Display Typography & CTA ──────── */}
        <div data-layer="text" className="mx-auto max-w-4xl text-center pt-8 sm:pt-14 pb-12">
          {/* Top Category Capsule */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-zinc-300 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6A1F]" />
            <span>Socialcraft Studio · Der neue Standard für Instagram Karussells</span>
          </div>

          {/* Clean High-Contrast Headline (No Muddy Gradient) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] pb-3">
            Erstelle virale Karussells & skaliere deine Reichweite.
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Socialcraft ist der High-End KI-Karussell-Builder für Creator und Marken:
            Psychologische Hook-Führung, synchrone KI-Klone und 1-Klick-Exports für Instagram im 4:5-Format.
          </p>

          {/* CTA Button with Dual Arrow-Up-Right Animation */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onCtaClick}
              className="group inline-flex text-base sm:text-lg gap-x-2.5 backdrop-blur-xl text-white justify-center items-center py-3.5 px-8 rounded-2xl border border-[#FF4D17]/60 bg-gradient-to-r from-[#FF3B00] via-[#FF5722] to-[#FFA149] font-bold shadow-[0_0_35px_rgba(255,77,23,0.55)] hover:scale-105 hover:shadow-[0_0_50px_rgba(255,77,23,0.8)] transition-all duration-300 cursor-pointer"
            >
              <span>Jetzt im Studio starten</span>
              <div className="flex overflow-hidden relative justify-center items-center ml-1 w-5 h-5">
                <ArrowUpRight className="absolute transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-5" />
                <ArrowUpRight className="absolute transition-all duration-500 -translate-x-4 -translate-y-5 group-hover:translate-x-0 group-hover:translate-y-0" />
              </div>
            </button>

            {onExploreClick && (
              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-md cursor-pointer"
              >
                <span>Live Features erkunden</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Layer 4: 3D Perspective Socialcraft Studio Dashboard ────── */}
        <div data-layer="mockup" className="relative mt-2 sm:mt-6 z-20">
          <div className="relative mx-auto max-w-6xl rounded-3xl p-2 sm:p-4 bg-white/[0.04] shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl border border-white/15 transition-transform">
            {/* The 3D Mockup Image generated for Socialcraft */}
            <img
              src="/images/socialcraft-hero-3d.jpg"
              alt="Socialcraft AI Studio Interface 3D Mockup"
              className="w-full rounded-2xl object-cover shadow-2xl transition-all"
            />

            {/* Glowing Orange Rim Highlight */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
          </div>

          {/* ── Layer 5: Foreground Floating Interactive Metric Cards ── */}
          <div
            data-layer="fg-card"
            className="pointer-events-none absolute -bottom-10 left-4 sm:left-12 z-30 hidden sm:flex items-center gap-3 rounded-2xl border border-white/20 bg-[#120F17]/90 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF3B00] to-[#FFA149] text-white shadow-[0_0_20px_#FF4D17]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">4:5 Hochformat Karussell</div>
              <div className="text-[11px] text-emerald-400 font-semibold">+94.8% Höhere Durchleserate</div>
            </div>
          </div>

          <div
            data-layer="fg-card"
            className="pointer-events-none absolute -bottom-8 right-4 sm:right-12 z-30 hidden sm:flex items-center gap-3 rounded-2xl border border-white/20 bg-[#120F17]/90 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_#06B6D4]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">100% Konsistente Persona</div>
              <div className="text-[11px] text-white/60">Gesichtsgeometrie synchronisiert</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
