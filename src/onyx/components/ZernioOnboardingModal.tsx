import React, { useState } from "react";
import {
  Key,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  Video,
  Instagram,
  Facebook,
  Linkedin,
  MessageSquare,
  Globe,
  Radio,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ZernioApiClient } from "../zernio/client";
import type { ApiSettings, SocialChannel } from "../types";
import { cn } from "@/lib/utils";

interface ZernioOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  channels: SocialChannel[];
  onUpdateChannels: (channels: SocialChannel[]) => void;
  onComplete?: () => void;
}

const SUPPORTED_CONNECT_PLATFORMS = [
  { id: "tiktok", name: "TikTok", icon: Video, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { id: "bluesky", name: "Bluesky", icon: Globe, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  { id: "discord", name: "Discord", icon: MessageSquare, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
];

export function ZernioOnboardingModal({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  channels,
  onUpdateChannels,
  onComplete,
}: ZernioOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(settings.zernioApiKey ? 2 : 1);
  const [apiKeyInput, setApiKeyInput] = useState(settings.zernioApiKey || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState<number>(0);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (!apiKeyInput) return;
    navigator.clipboard.writeText(apiKeyInput);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success("API Key in die Zwischenablage kopiert!");
  };

  const handleVerifyStep1 = async () => {
    if (!apiKeyInput || apiKeyInput.trim().length < 10) {
      toast.error("Bitte gib einen gültigen Engine Key ein (beginnt mit sk_).");
      return;
    }

    setIsVerifying(true);
    try {
      const client = new ZernioApiClient(apiKeyInput);
      const res = await client.getProfiles();
      
      let profileId = settings.zernioProfileId;
      if (!profileId && res.profiles && res.profiles.length > 0) {
        profileId = res.profiles[0]._id;
      }

      onChangeSettings({
        zernioApiKey: apiKeyInput.trim(),
        zernioProfileId: profileId,
      });

      // Try fetching accounts
      try {
        const accs = await client.listAccounts(profileId);
        if (accs.accounts && accs.accounts.length > 0) {
          setConnectedCount(accs.accounts.length);
        }
      } catch {
        // ignore
      }

      toast.success("Auto-Publishing Engine erfolgreich verbunden! 🎉");
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(`Verbindung fehlgeschlagen: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    if (!settings.zernioApiKey && !apiKeyInput) {
      toast.error("Bitte zuerst im Schritt 1 deinen Engine Key verifizieren.");
      setCurrentStep(1);
      return;
    }

    setConnectingPlatform(platformId);
    try {
      const key = settings.zernioApiKey || apiKeyInput;
      const client = new ZernioApiClient(key);
      const res = await client.getConnectUrl(platformId as any, settings.zernioProfileId);

      if (res.authUrl) {
        window.open(res.authUrl, "_blank", "width=600,height=700");
        toast.info(`Autorisierungsfenster für ${platformId.toUpperCase()} geöffnet...`, {
          description: "Sobald du den Zugriff autorisierst, ist der Kanal verknüpft.",
        });
      }
    } catch (err: any) {
      toast.error(`Fehler beim Starten des Connect-Flows: ${err.message}`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0F0D15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF4D1C] to-[#FF8038] flex items-center justify-center shadow-lg shadow-[#FF4D1C]/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              socialcraft
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF4D1C]/20 text-[#FF8038] border border-[#FF4D1C]/30">
              Direct Hub
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome, let's get you set up
          </h2>
          <p className="text-sm text-white/60">
            Three quick steps to connect your channels and start direct publishing.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="space-y-4">
          {/* STEP 1: API Key */}
          <div
            className={cn(
              "rounded-xl border transition-all duration-300 p-5",
              currentStep === 1
                ? "bg-[#16131F] border-white/20 shadow-lg ring-1 ring-white/10"
                : "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  currentStep === 1
                    ? "bg-white text-black"
                    : settings.zernioApiKey
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-white/40"
                )}
              >
                {settings.zernioApiKey && currentStep !== 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-base">Engine Key einbinden</h3>
                  {settings.zernioApiKey && currentStep !== 1 && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                      Aktiviert
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1 mb-3">
                  Verbindet deine Multi-Channel Veröffentlichungs-Pipeline (TikTok, IG, FB, X, etc.).
                </p>

                {currentStep === 1 ? (
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk_c8d8bef5559f3903f5848fa66f87185a8fb55941f0178508a..."
                        className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4D1C] focus:ring-1 focus:ring-[#FF4D1C] pr-20"
                      />
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="absolute right-2 px-2.5 py-1 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/15 rounded border border-white/10 transition flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={handleVerifyStep1}
                      className="w-full py-2.5 px-4 bg-[#FF4D1C] hover:bg-[#E03E0E] active:scale-[0.99] text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D1C]/25 transition disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <span>Prüfe Verbindung...</span>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setCurrentStep(1)}
                    className="cursor-pointer text-xs font-mono text-white/40 hover:text-white/80 transition truncate"
                  >
                    {settings.zernioApiKey ? `${settings.zernioApiKey.slice(0, 14)}...${settings.zernioApiKey.slice(-8)}` : "Klicken zum Bearbeiten"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Connect first platform */}
          <div
            className={cn(
              "rounded-xl border transition-all duration-300 p-5",
              currentStep === 2
                ? "bg-[#16131F] border-white/20 shadow-lg ring-1 ring-white/10"
                : "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  currentStep === 2
                    ? "bg-white text-black"
                    : connectedCount > 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-white/40"
                )}
              >
                2
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-base">Social-Media Kanäle verknüpfen</h3>
                <p className="text-xs text-white/50 mt-1 mb-3">
                  Wähle deine Zielplattformen und autorisiere den Direktzugriff mit 1 Klick.
                </p>

                {currentStep === 2 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {SUPPORTED_CONNECT_PLATFORMS.map((p) => {
                        const Icon = p.icon;
                        const isConnecting = connectingPlatform === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={isConnecting}
                            onClick={() => handleConnectPlatform(p.id)}
                            className={cn(
                              "p-3 rounded-lg border text-left flex flex-col justify-between transition hover:scale-[1.02] active:scale-[0.98]",
                              p.color
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="w-5 h-5" />
                              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                            </div>
                            <span className="text-xs font-semibold text-white">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-white/50 hover:text-white transition"
                      >
                        ← Zurück zu Schritt 1
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition"
                      >
                        <span>Weiter zu Schritt 3</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* STEP 3: Start building */}
          <div
            className={cn(
              "rounded-xl border transition-all duration-300 p-5",
              currentStep === 3
                ? "bg-[#16131F] border-white/20 shadow-lg ring-1 ring-white/10"
                : "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  currentStep === 3 ? "bg-white text-black" : "bg-white/10 text-white/40"
                )}
              >
                3
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-base">Direktveröffentlichung starten</h3>
                <p className="text-xs text-white/50 mt-1 mb-2">
                  Erstelle KI-Karussells und veröffentliche sie direkt auf all deinen Kanälen.
                </p>

                {currentStep === 3 && (
                  <div className="pt-2 space-y-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Socialcraft Direct Hub ist voll einsatzbereit!</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onComplete?.();
                        onClose();
                        toast.success("Direct Hub bereit! Viel Erfolg beim Veröffentlichen.");
                      }}
                      className="w-full py-2.5 px-4 bg-[#FF4D1C] hover:bg-[#E03E0E] text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D1C]/25 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Jetzt im Studio loslegen</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Skip onboarding */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-white/40 hover:text-white/80 transition"
          >
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
