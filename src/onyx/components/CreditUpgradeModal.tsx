import { useState } from "react";
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  HelpCircle,
  Layers,
  Percent,
  Shield,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { ModalShell } from "./SlideEditModal";
import { type User, getStoredUsers, saveStoredCurrentUser, saveStoredUsers } from "../auth";
import { Slider } from "@/components/ui/slider";
import type { ApiSettings, CreditStatus } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreditUpgradeModalProps {
  currentUser: User | null;
  onClose: () => void;
  onCreditsUpdated: (newTotal: number) => void;
  onNavigateAdmin?: () => void;
  settings?: ApiSettings | undefined;
  onChangeSettings?: ((patch: Partial<ApiSettings>) => void) | undefined;
  creditStatus?: CreditStatus | undefined;
  onRefreshCredits?: (() => void) | undefined;
}

const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Booster",
    badge: "Schnellstart",
    badgeColor: "bg-white/10 text-white/80 border-white/20",
    credits: 1000,
    bonusCredits: 0,
    price: "19 €",
    desc: "Perfekt zum Testen und für Gelegenheits-Karussells.",
    features: [
      "1.000 Credits sofort verfügbar",
      "~10 vollständige 7-Slide Karussells",
      "Nano-Banana 2 Bild-Pipeline",
      "Kostenloser 1080×1350 ZIP-Export",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro Creator Pack",
    badge: "Empfohlen · +500 Bonus",
    badgeColor: "bg-[#FF4D17]/20 text-[#FFA149] border-[#FF4D17]/50 shadow-[0_0_12px_#FF4D17]",
    credits: 5000,
    bonusCredits: 500,
    price: "49 €",
    desc: "Das beliebteste Paket für ambitionierte Social Media Creator.",
    features: [
      "5.000 + 500 Bonus = 5.500 Credits",
      "~50 bis 60 Karussells inkl. KI-Klon",
      "Priorisierte Nano-Banana 2 Pipeline",
      "Unbegrenzte Entwürfe & ZIP-Exporte",
      "Konsistente Gesichtsanpassung (KI-Klon)",
    ],
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency Power Pack",
    badge: "Maximaler Wert · +3.000 Bonus",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_#9333EA]",
    credits: 20000,
    bonusCredits: 3000,
    price: "149 €",
    desc: "Für Agenturen, Teams und automatisierte Serienproduktion.",
    features: [
      "20.000 + 3.000 Bonus = 23.000 Credits",
      "~250 Karussells oder Serien-Massenproduktion",
      "Höchste Priorität in der Render-Warteschlange",
      "Multi-Profil KI-Klon Unterstützung",
      "Eigene API-Keys ohne Plattformlimits",
    ],
    highlight: false,
  },
];

const PROMO_CODES: Record<string, { credits: number; label: string }> = {
  CREATOR2026: { credits: 1000, label: "Creator Starter Bonus" },
  SOCIALCRAFT: { credits: 2500, label: "Community Sonder-Guthaben" },
  ADMINFREE: { credits: 10000, label: "VIP Admin Test-Guthaben" },
  VIP2026: { credits: 5000, label: "Early Adopter Paket" },
};

export function CreditUpgradeModal({
  currentUser,
  onClose,
  onCreditsUpdated,
  onNavigateAdmin,
  settings,
  onChangeSettings,
  creditStatus,
  onRefreshCredits,
}: CreditUpgradeModalProps) {
  const [activeTab, setActiveTab] = useState<"packages" | "calculator" | "pricing">("packages");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);
  const [carouselCount, setCarouselCount] = useState<number>(20);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const currentCredits = currentUser?.credits ?? 4320;

  const handleApplyPackage = (pkg: (typeof CREDIT_PACKAGES)[number]) => {
    setPurchasingId(pkg.id);
    setTimeout(() => {
      setPurchasingId(null);
      const totalAdded = pkg.credits + pkg.bonusCredits;
      const newBalance = currentCredits + totalAdded;

      // Update in storage
      if (currentUser) {
        const updatedUser: User = { ...currentUser, credits: newBalance };
        saveStoredCurrentUser(updatedUser);
        const allUsers = getStoredUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
        saveStoredUsers(allUsers);
      }

      onCreditsUpdated(newBalance);
      toast.success(`${pkg.name} erfolgreich aufgeladen! 🎉`, {
        description: `+${totalAdded.toLocaleString()} Credits wurden deinem Account gutgeschrieben. Neues Guthaben: ${newBalance.toLocaleString()} cr`,
      });
      onClose();
    }, 600);
  };

  const handleRedeemPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (redeemedCodes.includes(code)) {
      toast.error("Dieser Code wurde in dieser Sitzung bereits eingelöst.");
      return;
    }

    const promo = PROMO_CODES[code];
    if (promo) {
      const newBalance = currentCredits + promo.credits;
      if (currentUser) {
        const updatedUser: User = { ...currentUser, credits: newBalance };
        saveStoredCurrentUser(updatedUser);
        const allUsers = getStoredUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
        saveStoredUsers(allUsers);
      }
      setRedeemedCodes((prev) => [...prev, code]);
      setPromoCodeInput("");
      onCreditsUpdated(newBalance);
      toast.success(`Code ${code} eingelöst! 🎁`, {
        description: `+${promo.credits.toLocaleString()} Credits hinzugefügt (${promo.label})`,
      });
    } else {
      toast.error("Ungültiger Gutscheincode. Bitte teste: CREATOR2026 oder SOCIALCRAFT");
    }
  };

  // Calculator calculations
  const slidesPerCarousel = 7;
  const creditsPerSlide = 15;
  const creditsPerStory = 10;
  const creditsPerCarousel = slidesPerCarousel * creditsPerSlide + creditsPerStory; // 115 cr
  const neededCredits = carouselCount * creditsPerCarousel;

  let recommendedPackage = CREDIT_PACKAGES[0]!;
  if (neededCredits > 5000) {
    recommendedPackage = CREDIT_PACKAGES[2]!;
  } else if (neededCredits > 1000) {
    recommendedPackage = CREDIT_PACKAGES[1]!;
  }

  return (
    <ModalShell
      title="Credits & Guthaben aufladen"
      onClose={onClose}
      maxHeight="88vh"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* ── Top Balance Bar ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF3B00] to-[#FFA149] text-white shadow-[0_0_20px_#FF4D17]">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
                Dein aktueller Kontostand
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {currentCredits.toLocaleString()} cr
                </span>
                <span className="text-xs text-white/50">
                  (~{Math.floor(currentCredits / 115)} Karussells)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Engine status badge */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[#FF6A1F]" />
              <div>
                <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Engine Status</div>
                <div className="font-mono font-bold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400">ONYX Ultra Pipeline</span>
                </div>
              </div>
            </div>

            {currentUser?.role === "admin" && onNavigateAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateAdmin();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary-bright hover:bg-primary/25 transition-all"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Kontingente</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Switcher ────────────────────────────────────────────── */}
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap justify-center rounded-full border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("packages")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeTab === "packages"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_15px_#FF4D17]"
                  : "text-white/60 hover:text-white",
              )}
            >
              Credit-Pakete (1-Klick)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeTab === "calculator"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_15px_#FF4D17]"
                  : "text-white/60 hover:text-white",
              )}
            >
              Verbrauchsrechner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pricing")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeTab === "pricing"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_15px_#FF4D17]"
                  : "text-white/60 hover:text-white",
              )}
            >
              Kosten pro Aktion
            </button>
          </div>
        </div>

        {/* ── Tab 1: Packages & Promo Codes ──────────────────────────── */}
        {activeTab === "packages" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 backdrop-blur-xl",
                    pkg.highlight
                      ? "border-[#FF4D17]/80 bg-gradient-to-b from-[#1E1210] to-[#120D15] shadow-[0_10px_35px_-5px_rgba(255,77,23,0.3)] scale-[1.02]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", pkg.badgeColor)}>
                        {pkg.badge}
                      </span>
                      {pkg.highlight && <Crown className="h-4 w-4 text-[#FFA149]" />}
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{pkg.name}</h3>
                    <p className="text-xs text-white/60 mb-4 min-h-[32px]">{pkg.desc}</p>

                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span className="text-2xl font-black text-white font-mono">{pkg.price}</span>
                      <span className="text-xs text-white/40">einmalig</span>
                    </div>

                    <div className="border-t border-white/[0.08] pt-3.5 mb-5 space-y-2">
                      {pkg.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-xs text-white/70">
                          <Check className="h-3.5 w-3.5 text-[#FF6A1F] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPackage(pkg)}
                    disabled={purchasingId !== null}
                    className={cn(
                      "w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      pkg.highlight
                        ? "bg-gradient-to-r from-[#FF3B00] to-[#FF6A1F] text-white shadow-[0_0_20px_#FF4D17] hover:brightness-110"
                        : "border border-white/20 bg-white/10 text-white hover:bg-white/20",
                    )}
                  >
                    {purchasingId === pkg.id ? (
                      <span>Wird aktiviert…</span>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>Jetzt aufladen</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Promo Code Box */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#FFA149]" />
                    <span>Hast du einen Promo- oder Gutscheincode?</span>
                  </h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Gib deinen VIP- oder Creator-Code ein, um sofort Gratis-Guthaben freizuschalten.
                  </p>
                </div>

                <form onSubmit={handleRedeemPromoCode} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="z. B. CREATOR2026"
                    className="field-input uppercase font-mono text-xs py-2 px-3 w-full sm:w-44"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all shrink-0 cursor-pointer"
                  >
                    Einlösen
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Interactive Calculator ──────────────────────────── */}
        {activeTab === "calculator" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#FF6A1F]" />
                    <span>Wie viele Karussells möchtest du pro Monat erstellen?</span>
                  </label>
                  <span className="font-mono text-lg font-extrabold text-[#FFA149]">
                    {carouselCount} Karussells
                  </span>
                </div>

                <Slider
                  value={[carouselCount]}
                  onValueChange={(val) => setCarouselCount(val[0] || 5)}
                  min={5}
                  max={100}
                  step={5}
                  className="py-4"
                />

                <div className="flex justify-between text-[11px] text-white/40 font-mono">
                  <span>5 Karussells (Hobby)</span>
                  <span>25 Karussells (Creator)</span>
                  <span>50 Karussells (Agentur)</span>
                  <span>100 Karussells (Power)</span>
                </div>
              </div>

              {/* Live Calculator Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                  <span className="text-[10px] text-white/40 block uppercase font-bold tracking-wider">Folien-Gesamt</span>
                  <span className="font-mono text-lg font-bold text-white">
                    {carouselCount * slidesPerCarousel} Slides
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                  <span className="text-[10px] text-white/40 block uppercase font-bold tracking-wider">Benötigte Credits</span>
                  <span className="font-mono text-lg font-bold text-[#FFA149]">
                    {neededCredits.toLocaleString()} cr
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                  <span className="text-[10px] text-white/40 block uppercase font-bold tracking-wider">Kosten pro Slide</span>
                  <span className="font-mono text-lg font-bold text-emerald-400">
                    ab ~0,06 €
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                  <span className="text-[10px] text-white/40 block uppercase font-bold tracking-wider">Zeit-Ersparnis</span>
                  <span className="font-mono text-lg font-bold text-cyan-400">
                    ~{Math.round(carouselCount * 2.5)} Std.
                  </span>
                </div>
              </div>

              {/* Dynamic Recommendation Box */}
              <div className="rounded-2xl border border-[#FF4D17]/50 bg-gradient-to-r from-[#FF3B00]/10 to-[#FFA149]/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4D17]/20 text-[#FFA149] border border-[#FF4D17]/40">
                      Optimale Empfehlung
                    </span>
                    <h4 className="text-sm font-bold text-white">{recommendedPackage.name}</h4>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Deckt deine {carouselCount} Monats-Karussells komplett ab inklusive Puffer für KI-Klon Gesichtsabgleich.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPackage(recommendedPackage)}
                  disabled={purchasingId !== null}
                  className="cryptox-orange-btn !py-2 !px-5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  {recommendedPackage.price} · Jetzt wählen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Action Pricing Breakdown ────────────────────────── */}
        {activeTab === "pricing" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <p className="text-xs text-white/60">
              Bei Socialcraft gibt es keine versteckten Kosten. Credits werden nur für tatsächliche Rechenleistung und KI-Modelle abgezogen:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-[#FF6A1F] shrink-0">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">Komplette Karussell-Story</h4>
                    <span className="font-mono text-xs font-bold text-[#FFA149]">10 cr</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Umfasst alle 5–10 Slides: Hook, Struktur, Headlines, Subtexte und generierte Bild-Prompts.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">Visual Folie rendern</h4>
                    <span className="font-mono text-xs font-bold text-cyan-400">15 cr / Folie</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Fotorealistisches 4:5 Rendering via Nano-Banana 2 mit Studio-Beleuchtung.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">KI-Klon Face-Lock Sync</h4>
                    <span className="font-mono text-xs font-bold text-purple-400">40 cr / Folie</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Verankert deine persönliche Gesichtsgeometrie nahtlos in jedem Slide-Motiv.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">1080×1350 ZIP-Export</h4>
                    <span className="font-mono text-xs font-bold text-emerald-400">0 cr (Gratis)</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Download aller Slides, Metadaten und Prompts im ZIP-Paket ist für alle Nutzer kostenlos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
