import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Trash2,
  Layers,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PostForMeApiClient } from "../postforme/client";
import type { PostForMeSocialAccount, PostForMePlatform } from "../postforme/types";
import type { ApiSettings, SocialChannel, SocialPlatform } from "../types";
import { ANCHORED_POSTFORME_API_KEY } from "../defaults";
import { cn } from "@/lib/utils";

interface PostForMeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  channels: SocialChannel[];
  onUpdateChannels: (channels: SocialChannel[]) => void;
  onComplete?: () => void;
}

interface SupportedPlatformConfig {
  id: PostForMePlatform;
  name: string;
  icon: React.ElementType;
  color: string;
  badge: string;
}

const SUPPORTED_CONNECT_PLATFORMS: SupportedPlatformConfig[] = [
  { id: "tiktok", name: "TikTok", icon: Video, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", badge: "Direct Post / Drafts" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-400 border-pink-500/30 bg-pink-500/10", badge: "Feed / Reels / Carousel" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", badge: "Pages & Groups" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-sky-400 border-sky-500/30 bg-sky-500/10", badge: "Profile & Company" },
  { id: "x", name: "X (Twitter)", icon: Share2, color: "text-zinc-200 border-zinc-500/30 bg-zinc-500/10", badge: "Posts & Threads" },
  { id: "youtube", name: "YouTube", icon: Video, color: "text-red-400 border-red-500/30 bg-red-500/10", badge: "Shorts & Community" },
  { id: "threads", name: "Threads", icon: MessageSquare, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", badge: "Meta Threads" },
  { id: "pinterest", name: "Pinterest", icon: Layers, color: "text-rose-400 border-rose-500/30 bg-rose-500/10", badge: "Pins & Boards" },
  { id: "bluesky", name: "Bluesky", icon: Globe, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10", badge: "AT Protocol" },
];

export function PostForMeSetupModal({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  channels,
  onUpdateChannels,
  onComplete,
}: PostForMeSetupModalProps) {
  const activeKey = settings.postForMeApiKey || ANCHORED_POSTFORME_API_KEY;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(activeKey ? 2 : 1);
  const [apiKeyInput, setApiKeyInput] = useState(activeKey);
  const [webhookSecretInput, setWebhookSecretInput] = useState(
    settings.postForMeWebhookSecret || ""
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedRedirectUrl, setCopiedRedirectUrl] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<PostForMeSocialAccount[]>([]);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const webhookEndpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/cloud/webhook/postforme`
    : "https://mein-socialcraft.de/api/cloud/webhook/postforme";

  const projectRedirectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/callback`
    : "https://mein-socialcraft.de/callback";

  const handleCopyRedirectUrl = () => {
    navigator.clipboard.writeText(projectRedirectUrl);
    setCopiedRedirectUrl(true);
    setTimeout(() => setCopiedRedirectUrl(false), 2000);
    toast.success("Project Redirect URL in Zwischenablage kopiert! 📋");
  };

  // Load connected accounts when opening or when step changes to 2/3
  useEffect(() => {
    if (isOpen && activeKey) {
      loadAccounts(activeKey);
    }
  }, [isOpen, activeKey]);

  const loadAccounts = async (key: string) => {
    if (!key.trim()) return;
    setIsLoadingAccounts(true);
    try {
      const client = new PostForMeApiClient(key);
      const accs = await client.getSocialAccounts();
      setConnectedAccounts(accs);
    } catch (err: any) {
      console.warn("Could not fetch connected accounts:", err.message);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (!apiKeyInput) return;
    navigator.clipboard.writeText(apiKeyInput);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success("API Key in die Zwischenablage kopiert!");
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
    toast.success("Webhook URL in Zwischenablage kopiert! 📋");
  };

  const handleVerifyStep1 = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed || trimmed.length < 8) {
      toast.error("Bitte gib einen gültigen Post for Me API Key ein.");
      return;
    }

    setIsVerifying(true);
    try {
      const client = new PostForMeApiClient(trimmed);
      const accs = await client.getSocialAccounts();
      setConnectedAccounts(accs);

      onChangeSettings({
        postForMeApiKey: trimmed,
        // keep backward compatibility
        zernioApiKey: trimmed,
        postForMeWebhookSecret: webhookSecretInput.trim(),
      });

      toast.success("Post for Me Engine erfolgreich verbunden! 🚀");
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(`Verbindung fehlgeschlagen: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectPlatform = async (platformId: PostForMePlatform) => {
    const key = settings.postForMeApiKey || apiKeyInput;
    if (!key) {
      toast.error("Bitte zuerst im Schritt 1 deinen Post for Me API Key verifizieren.");
      setCurrentStep(1);
      return;
    }

    setConnectingPlatform(platformId);
    try {
      const client = new PostForMeApiClient(key);
      const authUrl = await client.createAuthUrl(platformId, projectRedirectUrl);

      if (authUrl) {
        window.open(authUrl, "_blank", "width=650,height=750");
        toast.info(`Autorisierungsfenster für ${platformId.toUpperCase()} geöffnet...`, {
          description: "Sobald du die Autorisierung abschließt, wirst du automatisch verbunden.",
        });
      }
    } catch (err: any) {
      toast.error(`Fehler beim Starten des OAuth-Flows: ${err.message}`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accId: string) => {
    const key = settings.postForMeApiKey || apiKeyInput;
    if (!key) return;

    setDisconnectingId(accId);
    try {
      const client = new PostForMeApiClient(key);
      await client.disconnectSocialAccount(accId);
      toast.success("Account getrennt.");
      setConnectedAccounts((prev) => prev.filter((a) => a.id !== accId));
      onUpdateChannels(channels.filter((c) => c.postForMeAccountId !== accId && c.channelId !== accId));
    } catch (err: any) {
      toast.error(`Trennung fehlgeschlagen: ${err.message}`);
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSyncToSocialcraft = () => {
    if (connectedAccounts.length === 0) {
      toast.info("Keine verbundenen Accounts vorhanden.");
      return;
    }

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

    const imported: SocialChannel[] = connectedAccounts.map((acc) => {
      const targetPlatform = platformMapping[acc.platform.toLowerCase()] || "facebook";
      return {
        id: `pfm-${acc.id}`,
        platform: targetPlatform,
        name: acc.display_name || acc.username || `${acc.platform} Account`,
        channelId: acc.id,
        postForMeAccountId: acc.id,
        handle: acc.username ? (acc.username.startsWith("@") ? acc.username : `@${acc.username}`) : undefined,
        avatarUrl: acc.profile_picture_url || "/images/socialcraft-logo.png",
        isDefault: false,
      };
    });

    const existingIds = new Set(channels.map((c) => c.channelId));
    const newOnes = imported.filter((c) => !existingIds.has(c.channelId));

    if (newOnes.length > 0) {
      onUpdateChannels([...channels, ...newOnes]);
      toast.success(`${newOnes.length} Kanäle erfolgreich in Socialcraft übernommen! 🎉`);
    } else {
      toast.info("Alle Accounts sind bereits in Socialcraft integriert.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F0D15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 shrink-0">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF4D1C] to-[#FF8038] flex items-center justify-center shadow-lg shadow-[#FF4D1C]/25">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              socialcraft
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF4D1C]/20 text-[#FF8038] border border-[#FF4D1C]/30">
              Post for Me Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            Multi-Channel Publishing Hub
          </h2>
          <p className="text-xs text-white/60">
            Direktes Planen & Veröffentlichen auf TikTok, Instagram, Facebook, LinkedIn, X & YouTube via Post for Me API.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* STEP 1: API Key */}
          <div
            className={cn(
              "rounded-xl border transition-all duration-300 p-5",
              currentStep === 1
                ? "bg-[#16131F] border-white/20 shadow-lg ring-1 ring-white/10"
                : "bg-white/[0.02] border-white/5 opacity-80 hover:opacity-100"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  currentStep === 1
                    ? "bg-white text-black"
                    : activeKey
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-white/40"
                )}
              >
                {activeKey && currentStep !== 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-base">Post for Me API Key</h3>
                  {activeKey && currentStep !== 1 && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                      Aktiv
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1 mb-3">
                  Erhalte deinen Bearer API Key im{" "}
                  <a
                    href="https://app.postforme.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF8038] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Post for Me Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </p>

                {currentStep === 1 ? (
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="pfm_live_... oder Bearer Token"
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

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleVerifyStep1}
                        disabled={isVerifying || !apiKeyInput.trim()}
                        className="cryptox-orange-btn !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifiziere...</span>
                          </>
                        ) : (
                          <>
                            <span>Verifizieren & Weiter</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span className="font-mono">••••••••••••••••••••••••••••••••</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-[#FF8038] hover:underline"
                    >
                      Ändern
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Kanäle via OAuth verknüpfen */}
          <div
            className={cn(
              "rounded-xl border transition-all duration-300 p-5",
              currentStep === 2
                ? "bg-[#16131F] border-white/20 shadow-lg ring-1 ring-white/10"
                : "bg-white/[0.02] border-white/5 opacity-80 hover:opacity-100"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  currentStep === 2
                    ? "bg-white text-black"
                    : connectedAccounts.length > 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-white/40"
                )}
              >
                {connectedAccounts.length > 0 && currentStep !== 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-base">Kanäle verbinden (1-Klick OAuth)</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadAccounts(settings.postForMeApiKey || apiKeyInput)}
                      disabled={isLoadingAccounts}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 hover:bg-white/10"
                    >
                      <RefreshCw className={cn("w-3 h-3", isLoadingAccounts && "animate-spin text-orange-400")} />
                      <span>Aktualisieren</span>
                    </button>
                    {currentStep !== 2 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-[#FF8038] hover:underline"
                      >
                        Öffnen
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-1 mb-4">
                  Klicke auf eine Plattform, um dein Profil oder deine Unternehmensseite sicher zu autorisieren.
                </p>

                {currentStep === 2 && (
                  <>
                    {/* Project Redirect URL Banner */}
                    <div className="mb-4 p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#FF8038] uppercase tracking-wider flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Project Redirect URL (im Dashboard eintragen)
                        </span>
                        <a
                          href="https://app.postforme.dev"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-zinc-400 hover:text-white underline inline-flex items-center gap-1"
                        >
                          Im Dashboard eintragen <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Trage diese URL in deinen Post for Me Dashboard-Projekteinstellungen unter <strong className="text-white">Project Redirect URL</strong> ein, damit du nach der Autorisierung automatisch zurückgeleitet wirst:
                      </p>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          readOnly
                          value={projectRedirectUrl}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 pr-20 select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyRedirectUrl}
                          className="absolute right-1.5 px-2.5 py-1 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/15 rounded border border-white/10 transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedRedirectUrl ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                      {SUPPORTED_CONNECT_PLATFORMS.map((plat) => {
                        const Icon = plat.icon;
                        const isConnecting = connectingPlatform === plat.id;
                        const isAlreadyConnected = connectedAccounts.some(
                          (a) => a.platform.toLowerCase() === plat.id.toLowerCase()
                        );

                        return (
                          <button
                            key={plat.id}
                            type="button"
                            onClick={() => handleConnectPlatform(plat.id)}
                            disabled={isConnecting}
                            className={cn(
                              "relative flex flex-col items-start p-3 rounded-xl border text-left transition-all group cursor-pointer",
                              plat.color,
                              isAlreadyConnected && "ring-1 ring-emerald-500/40"
                            )}
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <Icon className="w-4 h-4" />
                              {isAlreadyConnected ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : isConnecting ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition" />
                              )}
                            </div>
                            <span className="font-bold text-xs text-white">{plat.name}</span>
                            <span className="text-[10px] text-white/50">{plat.badge}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Connected accounts list preview */}
                    {connectedAccounts.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {connectedAccounts.length} verbundene Accounts:
                          </span>
                          <button
                            type="button"
                            onClick={handleSyncToSocialcraft}
                            className="text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                          >
                            In Socialcraft übernehmen
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {connectedAccounts.map((acc) => (
                            <div
                              key={acc.id}
                              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold uppercase text-[10px] text-[#FF8038]">
                                  {acc.platform}
                                </span>
                                <span className="text-white">{acc.display_name || acc.username || acc.id}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDisconnect(acc.id)}
                                disabled={disconnectingId === acc.id}
                                className="text-zinc-500 hover:text-red-400 p-1 rounded transition"
                                title="Kanal trennen"
                              >
                                {disconnectingId === acc.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        Zurück zu Schritt 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="cryptox-orange-btn !py-2 !px-4 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>Weiter zu Webhooks & Live-Sync</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: Webhooks & Live Feedback */}
          <div
            className={cn(
              "rounded-xl border transition-all duration-300 p-5",
              currentStep === 3
                ? "bg-[#16131F] border-white/20 shadow-lg ring-1 ring-white/10"
                : "bg-white/[0.02] border-white/5 opacity-80 hover:opacity-100"
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-base">Echtzeit-Webhooks & Publishing Feed</h3>
                  {currentStep !== 3 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-[#FF8038] hover:underline"
                    >
                      Konfigurieren
                    </button>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1 mb-3">
                  Erhalte sofortige Push-Benachrichtigungen über den Veröffentlichungsstatus und Analytics direkt in deiner UI.
                </p>

                {currentStep === 3 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Deine Socialcraft Webhook-URL (in Post for Me hinterlegen):
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          readOnly
                          value={webhookEndpointUrl}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2 text-xs font-mono text-zinc-300 pr-20 select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyWebhookUrl}
                          className="absolute right-2 px-2.5 py-1 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/15 rounded border border-white/10 transition flex items-center gap-1"
                        >
                          {copiedWebhookUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        Zurück
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSyncToSocialcraft();
                          toast.success("Post for Me Einrichtung abgeschlossen! 🚀");
                          if (onComplete) onComplete();
                          onClose();
                        }}
                        className="cryptox-orange-btn !py-2.5 !px-5 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Fertigstellen & Jetzt starten</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between shrink-0 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Post for Me API v1 Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
