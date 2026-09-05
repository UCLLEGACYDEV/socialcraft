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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreditUpgradeModalProps {
  currentUser: User | null;
  onClose: () => void;
  onCreditsUpdated: (newTotal: number) => void;
  onNavigateAdmin?: () => void;
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

  const handleRedeemPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (redeemedCodes.includes(cleanCode)) {
      toast.error("Dieser Gutscheincode wurde bereits eingelöst.");
      return;
    }

    const reward = PROMO_CODES[cleanCode];
    if (reward) {
      const newBalance = currentCredits + reward.credits;
      setRedeemedCodes((prev) => [...prev, cleanCode]);
      setPromoCodeInput("");

      if (currentUser) {
        const updatedUser: User = { ...currentUser, credits: newBalance };
        saveStoredCurrentUser(updatedUser);
        const allUsers = getStoredUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
        saveStoredUsers(allUsers);
      }

      onCreditsUpdated(newBalance);
      toast.success(`Gutscheincode „${cleanCode}“ eingelöst! 🎁`, {
        description: `+${reward.credits.toLocaleString()} Credits hinzugefügt (${reward.label}).`,
      });
    } else {
      toast.error("Ungültiger Gutscheincode.", {
        description: "Versuche z. B. „CREATOR2026“ oder „SOCIALCRAFT“.",
      });
    }
  };

  // Calculator estimations
  const estimatedSlides = carouselCount * 7;
  const estimatedCreditsNeeded = carouselCount * 10 + estimatedSlides * 15; // 10 text + 15 visual per slide
  const recommendedPkg = (
    estimatedCreditsNeeded <= 1000
      ? CREDIT_PACKAGES[0]
      : estimatedCreditsNeeded <= 5500
        ? CREDIT_PACKAGES[1]
        : CREDIT_PACKAGES[2]
  ) as (typeof CREDIT_PACKAGES)[number];

  return (
    <ModalShell title="Credits aufladen & Kontingent erweitern" onClose={onClose} maxHeight="90vh">
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
                  (~{Math.floor(currentCredits / 115)} vollständige Karussells)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          <div className="flex rounded-full border border-white/10 bg-black/40 p-1">
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

        {/* ── TAB 1: Credit Packages (1-Click Instant Upgrade) ────────── */}
        {activeTab === "packages" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CREDIT_PACKAGES.map((pkg) => {
                const isSelected = pkg.highlight;
                const isPurchasing = purchasingId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-3xl border p-5 transition-all",
                      isSelected
                        ? "border-[#FF4D17] bg-[#FF4D17]/10 shadow-[0_0_30px_-5px_rgba(255,77,23,0.3)] ring-1 ring-[#FF4D17]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="space-y-4">
                      {/* Badge */}
                      <div className="flex items-center justify-between">
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", pkg.badgeColor)}>
                          {pkg.badge}
                        </span>
                        {pkg.bonusCredits > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <Sparkles className="h-3 w-3" />
                            +{pkg.bonusCredits} Bonus
                          </span>
                        )}
                      </div>

                      {/* Package Name & Price */}
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {pkg.name}
                        </h3>
                        <p className="text-xs text-white/60 mt-1 min-h-[32px]">
                          {pkg.desc}
                        </p>
                      </div>

                      {/* Big Credit Number */}
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
                        <span className="text-2xl font-black text-white font-mono block">
                          {(pkg.credits + pkg.bonusCredits).toLocaleString()} cr
                        </span>
                        <span className="text-[11px] font-bold text-[#FF6A1F]">
                          für {pkg.price}
                        </span>
                      </div>

                      {/* Features bullet list */}
                      <ul className="space-y-2 text-xs text-white/70">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary-bright shrink-0 mt-0.5" />
                            <span className="leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-5 mt-4 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => handleApplyPackage(pkg)}
                        disabled={Boolean(purchasingId)}
                        className={cn(
                          "w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                          isSelected
                            ? "cryptox-orange-btn shadow-[0_0_20px_rgba(255,77,23,0.6)]"
                            : "border border-white/15 bg-white/5 text-white hover:bg-white/15 hover:border-white/30",
                        )}
                      >
                        {isPurchasing ? (
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <Coins className="h-3.5 w-3.5" />
                            <span>Jetzt aufladen ({pkg.price})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Promo Code Box ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary-bright" />
                    Gutschein- oder Promo-Code einlösen
                  </h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Tester-Codes: <code className="text-[#FFA149]">CREATOR2026</code> (+1.000 cr) oder <code className="text-[#FFA149]">SOCIALCRAFT</code> (+2.500 cr)
                  </p>
                </div>

                <form onSubmit={handleRedeemPromoCode} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="z. B. CREATOR2026"
                    className="w-full sm:w-44 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white uppercase placeholder:text-white/30 outline-none focus:border-[#FF4D17]"
                  />
                  <button
                    type="submit"
                    className="cryptox-orange-btn !py-1.5 !px-3 text-xs font-semibold shrink-0"
                  >
                    Einlösen
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Interactive Usage Calculator ─────────────────────── */}
        {activeTab === "calculator" && (
          <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="max-w-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[#FF6A1F]" />
                  Monatliche Karussell-Produktion:
                </label>
                <span className="font-mono text-base font-extrabold text-primary-bright">
                  {carouselCount} Karussells / Monat
                </span>
              </div>

              <Slider
                value={[carouselCount]}
                min={5}
                max={100}
                step={5}
                onValueChange={([v]) => v !== undefined && setCarouselCount(v)}
              />

              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="text-[10px] text-white/50 block">Erzeugte Slides</span>
                  <span className="text-lg font-bold text-white font-mono">{estimatedSlides}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="text-[10px] text-white/50 block">Benötigte Credits</span>
                  <span className="text-lg font-bold text-[#FFA149] font-mono">{estimatedCreditsNeeded.toLocaleString()} cr</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="text-[10px] text-white/50 block">Kosten pro Slide</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">~0,11 €</span>
                </div>
              </div>
            </div>

            {/* Recommended Package Card based on calculation */}
            <div className="rounded-2xl border border-[#FF4D17]/40 bg-[#FF4D17]/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6A1F]">
                  Empfohlene Lösung für dein Volumen:
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {recommendedPkg.name} ({(recommendedPkg.credits + recommendedPkg.bonusCredits).toLocaleString()} Credits für {recommendedPkg.price})
                </h4>
                <p className="text-xs text-white/60">
                  Deckt deinen geschätzten Monatsbedarf von {estimatedCreditsNeeded.toLocaleString()} Credits optimal ab.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleApplyPackage(recommendedPkg)}
                className="cryptox-orange-btn text-xs font-bold px-5 py-2.5 shrink-0"
              >
                Dieses Paket wählen →
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: Transparent Action Cost Breakdown ────────────────── */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
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
