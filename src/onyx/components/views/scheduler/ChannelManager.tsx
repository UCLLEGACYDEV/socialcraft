import React, { useState } from "react";
import {
  Share2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Zap,
  Check,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import type { SocialChannel, SocialPlatform } from "@/onyx/types";
import {
  PLATFORM_ICONS,
  SCHEDULER_CONNECT_PLATFORMS,
} from "@/onyx/components/widgets/scheduler-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChannelManagerProps {
  channels: SocialChannel[];
  onToggleChannel: (channelId: string) => void;
  onDisconnectChannel: (channelId: string) => void;
  onAddChannel: (channel: SocialChannel) => void;
  hasPublisherKey: boolean;
  isAdmin: boolean;
  onOpenPublisherSetup?: () => void;
}

export function ChannelManager({
  channels,
  onToggleChannel,
  onDisconnectChannel,
  onAddChannel,
  hasPublisherKey,
  isAdmin,
  onOpenPublisherSetup,
}: ChannelManagerProps) {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [mockAccountHandle, setMockAccountHandle] = useState("");
  const [mockAccountName, setMockAccountName] = useState("");

  const handleStartConnect = (platformId: string) => {
    setConnectingPlatform(platformId);
    setMockAccountHandle(`@meine_${platformId}_seite`);
    setMockAccountName(`${platformId.toUpperCase()} Kanal`);
  };

  const handleConfirmConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingPlatform) return;

    const newChannel: SocialChannel = {
      id: `channel_${connectingPlatform}_${Date.now()}`,
      platform: connectingPlatform as SocialPlatform,
      name: mockAccountName.trim() || `${connectingPlatform.toUpperCase()} Kanal`,
      handle: mockAccountHandle.trim() || `@${connectingPlatform}_kanal`,
      channelId: `ch_${Date.now()}`,
      avatarUrl: "",
      isDefault: channels.length === 0,
    };

    onAddChannel(newChannel);
    setConnectingPlatform(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── Publisher Status Banner ───────────────────────────────────── */}
      <div className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white">
                Multi-Kanal Veröffentlichungs-Engine
              </h3>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 font-mono">
                Aktiv
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Direktes Veröffentlichen via offizielle APIs auf Instagram, LinkedIn, TikTok & Co.
            </p>
          </div>
        </div>

        {isAdmin && onOpenPublisherSetup && (
          <button
            type="button"
            onClick={onOpenPublisherSetup}
            className="cryptox-ghost-btn !py-2 !px-4 text-xs font-semibold border border-white/10 hover:text-white self-start sm:self-auto flex items-center gap-1.5"
          >
            <Key className="h-3.5 w-3.5 text-[#FF4D17]" />
            <span>Publisher-Schlüssel verwalten</span>
          </button>
        )}
      </div>

      {/* ── Connected Channels ────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Verbundene Kanäle ({channels.length})
        </h3>

        {channels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-zinc-500 space-y-2">
            <Share2 className="h-8 w-8 mx-auto text-zinc-600" />
            <p className="text-xs">Noch keine Social-Media-Kanäle verknüpft.</p>
            <p className="text-[11px] text-zinc-600">
              Wähle unten eine Plattform, um deinen ersten Kanal anzubinden.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((ch) => {
              const Icon = PLATFORM_ICONS[ch.platform] || Layers;
              return (
                <div
                  key={ch.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">{ch.handle}</p>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktiv
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onToggleChannel(ch.id)}
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        ch.isDefault ? "text-[#FF4D17] font-bold" : "text-zinc-500 hover:text-zinc-300",
                      )}
                    >
                      {ch.isDefault ? "Standard-Kanal" : "Als Standard setzen"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDisconnectChannel(ch.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Kanal trennen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Available Platforms to Connect ────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Weitere Plattform anbinden
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SCHEDULER_CONNECT_PLATFORMS.map((plat) => {
            const Icon = plat.icon;
            const isAlreadyConnected = channels.some((c) => c.platform === plat.id);

            return (
              <div
                key={plat.id}
                className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 flex flex-col justify-between space-y-3 hover:border-white/15 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white/[0.05] text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">{plat.name}</span>
                    </div>
                    {isAlreadyConnected && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="h-3 w-3" /> Verbunden
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed min-h-[32px]">
                    {plat.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartConnect(plat.id)}
                  className="w-full py-2 px-3 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Konto verbinden</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal: Connect Account Dialog ─────────────────────────────── */}
      {connectingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in-50">
          <div className="relative w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#0c0c0f] p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[#FF4D17]">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white capitalize">
                    {connectingPlatform} verbinden
                  </h3>
                  <p className="text-xs text-zinc-400">Offizieller OAuth / API Verbindungs-Assistent</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectingPlatform(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmConnect} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Kanal-Bezeichnung:</label>
                <input
                  type="text"
                  value={mockAccountName}
                  onChange={(e) => setMockAccountName(e.target.value)}
                  placeholder="z. B. Mein Brand Instagram"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#FF4D17]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Account Handle:</label>
                <input
                  type="text"
                  value={mockAccountHandle}
                  onChange={(e) => setMockAccountHandle(e.target.value)}
                  placeholder="z. B. @socialcraft_ai"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#FF4D17] font-mono"
                  required
                />
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-[11px] text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Berechtigungen: Multi-Slide Posting, Bildunterschriften, Insights-Abruf. Keine
                  Passwörter nötig.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConnectingPlatform(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="cryptox-orange-btn !py-2 !px-5 text-xs font-bold shadow-[0_0_20px_rgba(255,77,23,0.35)]"
                >
                  Kanal verknüpfen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
