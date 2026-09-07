import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Share2, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { PostForMeApiClient } from "@/onyx/postforme/client";
import { ANCHORED_POSTFORME_API_KEY, DEFAULT_API_SETTINGS } from "@/onyx/defaults";
import { LS } from "@/onyx/storage";
import type { SocialChannel, SocialPlatform, ApiSettings } from "@/onyx/types";

export const Route = createFileRoute("/callback")({
  head: () => ({
    meta: [
      { title: "Social Account Verbunden — Socialcraft Studio" },
      { name: "description", content: "Erfolgreich autorisiert über Post for Me." },
    ],
  }),
  component: PostForMeCallbackPage,
});

function PostForMeCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const [platformName, setPlatformName] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    let timer: any;
    const processCallback = async () => {
      try {
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const errParam = urlParams?.get("error") || urlParams?.get("error_description");
        const platformParam = urlParams?.get("platform") || "";
        if (platformParam) setPlatformName(platformParam);

        if (errParam) {
          throw new Error(errParam);
        }

        // 1. Get API Key
        let apiKey = ANCHORED_POSTFORME_API_KEY;
        try {
          const raw = localStorage.getItem(LS.apiSettings) || localStorage.getItem("onyx.apiSettings");
          if (raw) {
            const parsed = JSON.parse(raw) as ApiSettings;
            if (parsed.postForMeApiKey) apiKey = parsed.postForMeApiKey;
          }
        } catch {}

        // 2. Fetch all social accounts from Post for Me
        const client = new PostForMeApiClient(apiKey);
        const accounts = await client.getSocialAccounts();
        setConnectedCount(accounts.length);

        // 3. Sync to local channels
        const platformMapping: Record<string, SocialPlatform> = {
          tiktok: "tiktok",
          instagram: "instagram",
          facebook: "facebook",
          linkedin: "linkedin",
          x: "twitter",
          twitter: "twitter",
          youtube: "youtube",
          threads: "threads",
          pinterest: "pinterest",
          bluesky: "bluesky",
        };

        const imported: SocialChannel[] = accounts.map((acc) => ({
          id: `pfm-${acc.id}`,
          platform: platformMapping[acc.platform.toLowerCase()] || "facebook",
          name: acc.display_name || acc.username || `${acc.platform} Account`,
          channelId: acc.id,
          postForMeAccountId: acc.id,
          handle: acc.username ? (acc.username.startsWith("@") ? acc.username : `@${acc.username}`) : undefined,
          avatarUrl: acc.profile_picture_url || "/images/socialcraft-logo.png",
          isDefault: false,
        }));

        try {
          const storedChannelsRaw = localStorage.getItem(LS.socialChannels);
          const currentChannels: SocialChannel[] = storedChannelsRaw ? JSON.parse(storedChannelsRaw) : [];
          const existingIds = new Set(currentChannels.map((c) => c.channelId));
          const newOnes = imported.filter((c) => !existingIds.has(c.channelId));

          if (newOnes.length > 0) {
            localStorage.setItem(LS.socialChannels, JSON.stringify([...currentChannels, ...newOnes]));
          }
        } catch {}

        setStatus("success");

        // 4. Notify parent window if opened as popup
        if (typeof window !== "undefined" && window.opener) {
          try {
            window.opener.postMessage(
              {
                type: "POSTFORME_AUTH_SUCCESS",
                platform: platformParam,
                accountsCount: accounts.length,
              },
              "*"
            );
          } catch {}

          // Auto-close popup countdown
          let currentSec = 3;
          timer = setInterval(() => {
            currentSec -= 1;
            setCountdown(currentSec);
            if (currentSec <= 0) {
              clearInterval(timer);
              window.close();
            }
          }, 1000);
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err?.message || "Unbekannter Autorisierungsfehler");
      }
    };

    void processCallback();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A090D] text-white flex flex-col items-center justify-center p-4 selection:bg-[#FF4D1C]/30 selection:text-white">
      {/* Glow effects */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF4D1C]/20 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#120F1C]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF4D1C] to-[#FF8038] flex items-center justify-center shadow-lg shadow-[#FF4D1C]/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">socialcraft</span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF4D1C]/20 text-[#FF8038] border border-[#FF4D1C]/30">
            Post for Me
          </span>
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-[#FF8038] animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">Autorisierung wird synchronisiert...</h2>
            <p className="text-xs text-zinc-400">
              Deine Zugriffsrechte werden überprüft und die Kanäle in Socialcraft importiert.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-2">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Kanal erfolgreich verknüpft! 🎉</h2>
              {platformName && (
                <p className="text-xs font-semibold text-[#FF8038] uppercase tracking-wider">
                  {platformName}
                </p>
              )}
              <p className="text-xs text-zinc-400 pt-1">
                Dein Social-Media-Profil ist jetzt über die Post for Me API startklar für automatische Veröffentlichungen.
              </p>
            </div>

            {connectedCount > 0 && (
              <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/5 text-xs text-zinc-300">
                <span className="font-bold text-emerald-400">{connectedCount} aktive Social Accounts</span> sind in deiner Pipeline registriert.
              </div>
            )}

            {typeof window !== "undefined" && window.opener ? (
              <div className="pt-2 text-xs text-zinc-500">
                Fenster schließt sich automatisch in <span className="font-mono text-white font-bold">{countdown}s</span>...
              </div>
            ) : (
              <div className="pt-4">
                <Link
                  to="/"
                  search={{ tab: "scheduler" }}
                  className="cryptox-orange-btn w-full !py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>Direkt zum Beitrags-Planer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Verbindung fehlgeschlagen</h2>
              <p className="text-xs text-red-300 font-mono bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-left overflow-x-auto">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="w-full inline-block px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition"
              >
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
