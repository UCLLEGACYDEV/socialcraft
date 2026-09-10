import React, { useState } from "react";
import { Globe, Lock, User, ExternalLink, X, ShieldCheck, RefreshCw, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { PostForMeApiClient } from "@/onyx/postforme/client";
import { cn } from "@/lib/utils";

interface BlueskyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSuccess?: () => void;
}

export const BlueskyConnectModal: React.FC<BlueskyConnectModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSuccess,
}) => {
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanHandle = handle.trim().replace(/^@/, "");
    const cleanPassword = appPassword.trim();

    if (!cleanHandle) {
      toast.error("Bitte gib deinen Bluesky-Handle ein (z. B. deinname.bsky.social).");
      return;
    }

    if (!cleanPassword) {
      toast.error("Bitte gib dein Bluesky App-Passwort ein.");
      return;
    }

    if (!apiKey) {
      toast.error("Kein Post for Me API Key konfiguriert.");
      return;
    }

    setIsSubmitting(true);
    try {
      const client = new PostForMeApiClient(apiKey);
      const authUrl = await client.createAuthUrl("bluesky", undefined, {
        bluesky: {
          handle: cleanHandle,
          app_password: cleanPassword,
        },
      });

      if (authUrl) {
        window.open(authUrl, "_blank", "width=650,height=750");
        toast.info("Bluesky-Autorisierungsfenster geöffnet... 🔗", {
          description: "Schließe die Verknüpfung im Popup-Fenster ab. Dein Account wird anschließend synchronisiert.",
        });
        setAppPassword("");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error("Keine Autorisierungs-URL von Post for Me erhalten.");
      }
    } catch (err: any) {
      toast.error(`Bluesky-Verbindung fehlgeschlagen: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F0D15] border border-white/15 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.15)] p-6 sm:p-7 text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Bluesky verknüpfen
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AT Protocol
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Direkte Verknüpfung über App-Passwort</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explain why App Password is required */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/[0.07] border border-indigo-500/20 text-xs text-indigo-200/90 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Warum ein App-Passwort?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-300">
            Bluesky nutzt das dezentrale AT Protocol ohne klassische OAuth-Fenster. Ein separates App-Passwort schützt deinen Haupt-Account und kann jederzeit mit 1 Klick in Bluesky widerrufen werden.
          </p>
          <div className="pt-1.5 border-t border-indigo-500/20 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">In Bluesky: Einstellungen ➔ Datenschutz ➔ App-Passwörter</span>
            <a
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 underline underline-offset-2"
            >
              <span>Öffnen</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Bluesky Handle</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="deinname.bsky.social oder domain.tld"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                autoFocus
                required
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              Dein Handle auf Bluesky (ohne vorangestelltes @).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span>App-Passwort</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition tracking-wider"
                required
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              Erstelle ein App-Passwort in deinen Bluesky-Einstellungen (z. B. Name &quot;SocialCraft&quot;).
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-lg",
                "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 shadow-indigo-500/20 active:scale-[0.98]",
                isSubmitting && "opacity-60 pointer-events-none"
              )}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Wird verknüpft...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Bluesky verbinden</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
