import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Shield, Sparkles, User as UserIcon, X, Zap } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/onyx/auth";
import {
  DEFAULT_ADMIN_CREDENTIALS,
  hasSupabaseConfig,
  registerUser,
  signInUser,
} from "@/onyx/supabase-auth";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  initialMode?: "login" | "register";
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({ initialMode = "login", onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (targetEmail: string) => {
    setLoading(true);
    try {
      const defaultPassword =
        targetEmail === DEFAULT_ADMIN_CREDENTIALS.email
          ? DEFAULT_ADMIN_CREDENTIALS.password
          : "Socialcraft123!";
      const res = await signInUser(targetEmail, defaultPassword);
      if (res.success && res.user) {
        toast.success(`Willkommen zurück, ${res.user.name}! (${res.user.role.toUpperCase()})`);
        onSuccess(res.user);
        onClose();
      } else {
        toast.error(res.error || "Anmeldung fehlgeschlagen.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Bitte gib deine E-Mail und dein Passwort ein.");
      return;
    }

    setLoading(true);
    try {
      const res = await signInUser(email, password);
      if (!res.success || !res.user) {
        toast.error(res.error || "Kein Konto mit diesen Zugangsdaten gefunden.");
        return;
      }

      toast.success(`Erfolgreich angemeldet als ${res.user.name}!`);
      onSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Anmeldefehler");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    if (password.length < 6) {
      toast.error("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(email, password, name.trim());
      if (!res.success || !res.user) {
        toast.error(res.error || "Registrierung fehlgeschlagen.");
        return;
      }

      toast.success(`Konto erfolgreich erstellt! Willkommen, ${res.user.name}!`);
      onSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registrierungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-b from-white/[0.1] via-[#120E19]/92 to-[#0A0710]/98 p-6 sm:p-8 shadow-[0_35px_100px_-20px_rgba(0,0,0,0.95),inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_50px_-10px_rgba(255,77,23,0.3)] backdrop-blur-3xl transition-all animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] via-[#FF6A1F] to-[#FFA149] shadow-[0_0_25px_-3px_#FF4D17]">
            <div className="h-5 w-5 rounded-full border-2 border-white/90 border-t-transparent animate-[spin_8s_linear_infinite]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === "login" ? "Willkommen bei Socialcraft" : "Konto erstellen"}
          </h2>
          <p className="mt-1 text-xs text-white/60">
            {mode === "login"
              ? "Melde dich an, um Karussells zu erstellen und dein Studio zu verwalten."
              : "Starte jetzt und erhalte direkt 500 kostenlose Erstellungs-Credits."}
          </p>
        </div>

        {/* Demo Login Quick Switcher */}
        <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/[0.06] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-primary-bright uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              1-Klick Demo Accounts
            </span>
            <span className="text-white/40 text-[10px] normal-case">Sofortiger Test</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("admin@socialcraft.ai")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-semibold text-white/90 hover:bg-white/[0.1] hover:text-white transition-all shadow-sm group"
            >
              <Shield className="h-3.5 w-3.5 text-primary-bright group-hover:scale-110 transition-transform" />
              <span>Admin Account</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("creator@socialcraft.ai")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-semibold text-white/90 hover:bg-white/[0.1] hover:text-white transition-all shadow-sm group"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Creator Account</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-semibold transition-all",
              mode === "login"
                ? "bg-[#FF4D17] text-white shadow-[0_0_15px_-2px_#FF4D17]"
                : "text-white/60 hover:text-white",
            )}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-semibold transition-all",
              mode === "register"
                ? "bg-[#FF4D17] text-white shadow-[0_0_15px_-2px_#FF4D17]"
                : "text-white/60 hover:text-white",
            )}
          >
            Registrieren
          </button>
        </div>

        {/* Forms */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">E-Mail-Adresse</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="field-input w-full pl-10 pr-4 py-2.5 text-sm rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-white/70">Passwort</label>
                <button
                  type="button"
                  onClick={() => toast.info("Nutze für den Demo-Test 'admin123' oder 'creator123'")}
                  className="text-[11px] text-primary-bright hover:underline"
                >
                  Passwort vergessen?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field-input w-full pl-10 pr-10 py-2.5 text-sm rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cryptox-orange-btn w-full mt-2 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <span>Anmelden →</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Vollständiger Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="field-input w-full pl-10 pr-4 py-2 text-sm rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">E-Mail-Adresse</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  className="field-input w-full pl-10 pr-4 py-2 text-sm rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/70">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 Zeichen"
                  className="field-input w-full px-3 py-2 text-sm rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/70">Bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Wiederholen"
                  className="field-input w-full px-3 py-2 text-sm rounded-xl"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-white/50 text-center pt-1">
              Mit der Registrierung stimmst du den Nutzungsbedingungen und Datenschutzrichtlinien zu.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="cryptox-orange-btn w-full mt-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <span>Konto erstellen (+500 Credits) →</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
