import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  Key,
  ShieldCheck,
  Send,
  Layers,
  Clock,
  ChevronRight,
  ArrowRight,
  Check,
  Copy,
  RefreshCw,
  X,
  Share2,
  Lock,
  Flame,
  Briefcase,
  Dumbbell,
  Coins,
  Brain,
  Bot,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { BATCH_NICHE_PRESETS, type NichePreset, type BatchDayTemplate } from "../data/batch-niche-presets";
import { ZernioApiClient } from "../zernio/client";
import { sanitizeNoGedankenstriche, generateViralCaption } from "../caption-generator";
import type { ApiSettings, ScheduledPost, SocialChannel } from "../types";
import { cn } from "@/lib/utils";

interface ThirtyDayBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
  channels: SocialChannel[];
  onUpdatePosts: (posts: ScheduledPost[]) => void;
  existingPosts: ScheduledPost[];
}

const TOOL_LINKS = [
  {
    name: "Socialcraft Direct Hub (Publisher Engine)",
    badge: "Auto-Posting",
    icon: Share2,
    color: "from-orange-500 to-red-500 text-orange-400 border-orange-500/30",
    description: "Veröffentlicht & plant automatisch auf TikTok, Instagram, Facebook & LinkedIn.",
    getKeyUrl: "https://zernio.com/dashboard/api-keys",
    field: "zernioApiKey" as const,
    placeholder: "sk_c8d8bef5559f3903f5848fa66f...",
    freeTier: "Gratis Startguthaben",
  },
  {
    name: "KIE.ai / ONYX Ultra Render Engine",
    badge: "Bilder & Visuals",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-500 text-purple-400 border-purple-500/30",
    description: "Generiert fotorealistische 3D Karussell-Folien & High-Contrast Visuals.",
    getKeyUrl: "https://kie.ai/api-key",
    field: "kieApiKey" as const,
    placeholder: "kie_live_9a8b7c6d5e4f...",
    freeTier: "Ultra-HD Rendering",
  },
  {
    name: "Google Gemini AI (100% Kostenlos)",
    badge: "Prompt & Text Engine",
    icon: Zap,
    color: "from-blue-500 to-cyan-500 text-cyan-400 border-cyan-500/30",
    description: "Erstellt 30 virale Hooks, Storylines & universelle Captions.",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    field: "geminiApiKey" as const,
    placeholder: "AIzaSyD9...",
    freeTier: "Kostenlos bei Google",
  },
  {
    name: "OpenAI / ChatGPT Plus API",
    badge: "Optional",
    icon: Bot,
    color: "from-emerald-500 to-teal-500 text-emerald-400 border-emerald-500/30",
    description: "Optionale Text-Generierung über GPT-4o & ChatGPT.",
    getKeyUrl: "https://platform.openai.com/api-keys",
    field: "openaiApiKey" as const,
    placeholder: "sk-proj-9x8y7z...",
    freeTier: "Pay-as-you-go",
  },
];

export function ThirtyDayBatchModal({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  channels,
  onUpdatePosts,
  existingPosts,
}: ThirtyDayBatchModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedNicheId, setSelectedNicheId] = useState<string>("b2b_sales");
  const [customTopic, setCustomTopic] = useState("");
  const [customAudience, setCustomAudience] = useState("");
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isSchedulingBatch, setIsSchedulingBatch] = useState(false);

  // Selected schedule configuration
  const defaultChannel = channels.find((c) => c.isDefault) || channels[0];
  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannel?.id || "fb-main-page");
  const [batchStartDate, setBatchStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [activeWeekFilter, setActiveWeekFilter] = useState<number>(1);

  // Temporary Key Inputs
  const [tempKeys, setTempKeys] = useState({
    zernioApiKey: settings.zernioApiKey || "",
    kieApiKey: settings.kieApiKey || "",
    geminiApiKey: settings.geminiApiKey || "",
    openaiApiKey: settings.openaiApiKey || "",
  });

  const selectedPreset = BATCH_NICHE_PRESETS.find((p) => p.id === selectedNicheId) || BATCH_NICHE_PRESETS[0];

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    onChangeSettings(tempKeys);
    toast.success("API Keys erfolgreich aktualisiert & gespeichert! 🔐");
  };

  const handleSelectNiche = (nicheId: string) => {
    setSelectedNicheId(nicheId);
  };

  const handleScheduleAll30Days = async () => {
    const targetChannel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
    if (!targetChannel) {
      toast.error("Bitte wähle zuerst einen Ziel-Kanal.");
      return;
    }

    setIsSchedulingBatch(true);
    try {
      const startDate = new Date(batchStartDate);
      const newScheduledPosts: ScheduledPost[] = [];

      for (let i = 0; i < selectedPreset.days.length; i++) {
        const template = selectedPreset.days[i];
        const postDate = new Date(startDate);
        postDate.setDate(postDate.getDate() + i);

        // Fallback visual URLs or prompt-based indicators
        const mediaUrls = [
          `/images/socialcraft-logo.png`,
        ];

        const newPost: ScheduledPost = {
          id: `batch-post-${Date.now()}-${i + 1}`,
          title: `Tag ${template.day}: ${sanitizeNoGedankenstriche(template.headline)}`,
          caption: sanitizeNoGedankenstriche(template.universalCaption),
          hashtags: template.hashtags,
          mediaUrls,
          mediaType: "carousel",
          channelId: targetChannel.channelId,
          platform: targetChannel.platform,
          scheduledFor: postDate.toISOString(),
          status: "scheduled",
          createdAt: new Date().toISOString(),
        };

        newScheduledPosts.push(newPost);
      }

      onUpdatePosts([...newScheduledPosts, ...existingPosts]);
      toast.success(`🎉 30 Beiträge für die nächsten 30 Tage erfolgreich terminiert!`, {
        description: `Start: ${startDate.toLocaleDateString("de-DE")} auf ${targetChannel.name} (${targetChannel.platform})`,
        duration: 8000,
      });

      onClose();
    } catch (err: any) {
      toast.error(`Fehler bei der Batch-Planung: ${err.message}`);
    } finally {
      setIsSchedulingBatch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0F0D15] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4D1C] via-[#FF7A00] to-[#9333EA] flex items-center justify-center shadow-lg shadow-[#FF4D1C]/25 shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  30-Tage Monats-Batch & Auto-Scheduler
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Mass Content Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Erstelle 30 Tage Content per 1-Klick und plane den kompletten Monat automatisch vor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex items-center border-b border-white/[0.08] bg-black/40 px-5 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={cn(
              "py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer",
              activeStep === 1
                ? "border-[#FF4D1C] text-orange-400 bg-orange-500/5"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            <span>Nische & Branche wählen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={cn(
              "py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer",
              activeStep === 2
                ? "border-[#FF4D1C] text-orange-400 bg-orange-500/5"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
            <span>Tool API Keys (1-Klick)</span>
            {settings.zernioApiKey && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={cn(
              "py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer",
              activeStep === 3
                ? "border-[#FF4D1C] text-orange-400 bg-orange-500/5"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span>
            <span>30-Tage Kalender & Auto-Schedule</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ── STEP 1: NICHE & INDUSTRY PRESETS ───────────────────────── */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  1. Wähle deine Nische / Branche:
                </h4>
                <p className="text-xs text-zinc-400">
                  Wähle ein vorkonfiguriertes Set oder erstelle ein individuelles 30-Tage Content-Briefing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BATCH_NICHE_PRESETS.map((preset) => {
                  const isSelected = selectedNicheId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectNiche(preset.id)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3",
                        isSelected
                          ? "bg-[#FF4D17]/15 border-[#FF4D17] shadow-[0_0_15px_rgba(255,77,23,0.3)] ring-1 ring-[#FF4D17]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{preset.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                        </div>
                        <h5 className="text-xs font-bold text-white">{preset.name}</h5>
                        <p className="text-[11px] text-zinc-400 line-clamp-2">{preset.description}</p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{preset.days.length} fertige Tage</span>
                        <span className="text-orange-400 font-semibold">30 Posts bereit</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Topic Input */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Oder individuelles Spezial-Thema für 30 Tage eingeben:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="z. B. Steuerberatung & Vermögenssicherung für Ärzte"
                    className="bg-[#120F17] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    value={customAudience}
                    onChange={(e) => setCustomAudience(e.target.value)}
                    placeholder="Zielgruppe (z. B. Fachärzte & Praxisinhaber in DE/AT)"
                    className="bg-[#120F17] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="cryptox-orange-btn !py-2.5 !px-6 text-xs font-bold flex items-center gap-2"
                >
                  <span>Weiter zu API Keys & Tools</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: 1-CLICK API KEYS & TOOL SETUP ──────────────────── */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  2. Tool-Verbindungen & API Keys (1-Klick Setup):
                </h4>
                <p className="text-xs text-zinc-400">
                  Hole dir die kostenlosen oder günstigen API Keys direkt aus den offiziellen Dashboards der Tools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOOL_LINKS.map((tool) => {
                  const Icon = tool.icon;
                  const currentVal = tempKeys[tool.field] || "";
                  const isConfigured = Boolean(currentVal.trim());

                  return (
                    <div
                      key={tool.field}
                      className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-white">{tool.name}</span>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                            isConfigured
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-white/5 text-zinc-400 border-white/10"
                          )}>
                            {isConfigured ? "✅ Verbunden" : tool.freeTier}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400">{tool.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-zinc-400 font-mono">API Key:</label>
                          <a
                            href={tool.getKeyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-orange-400 hover:underline flex items-center gap-1"
                          >
                            <span>Key im Dashboard holen</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>

                        <input
                          type="password"
                          value={currentVal}
                          onChange={(e) => setTempKeys({ ...tempKeys, [tool.field]: e.target.value })}
                          placeholder={tool.placeholder}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  ← Zurück zu Nische
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveKeys}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-zinc-200"
                  >
                    Keys speichern
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveKeys();
                      setActiveStep(3);
                    }}
                    className="cryptox-orange-btn !py-2.5 !px-6 text-xs font-bold flex items-center gap-2"
                  >
                    <span>Weiter zum 30-Tage Kalender</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: 30-DAY PREVIEW & 1-CLICK AUTO-SCHEDULE ─────────── */}
          {activeStep === 3 && (
            <div className="space-y-5">
              {/* Target Channel & Start Date Bar */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    1. Ziel-Kanal für Veröffentlichung:
                  </label>
                  <select
                    value={selectedChannelId}
                    onChange={(e) => setSelectedChannelId(e.target.value)}
                    className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {channels.map((chan) => (
                      <option key={chan.id} value={chan.id}>
                        {chan.name} ({chan.platform.toUpperCase()} - ID: {chan.channelId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    2. Startdatum & Uhrzeit der 30-Tage Serie:
                  </label>
                  <input
                    type="datetime-local"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full bg-[#120F17] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Week Filter Buttons */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white mr-2">Wochen-Filter:</span>
                  {[1, 2, 3, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setActiveWeekFilter(w)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer",
                        activeWeekFilter === w
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-white/5 text-zinc-400 hover:text-white"
                      )}
                    >
                      Woche {w} (Tage {(w - 1) * 7 + 1}–{Math.min(w * 7, 30)})
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono text-zinc-400">
                  {selectedPreset.days.length} Posts generiert
                </span>
              </div>

              {/* 30 Days Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedPreset.days
                  .filter((d) => d.week === activeWeekFilter)
                  .map((template) => {
                    const postDate = new Date(batchStartDate);
                    postDate.setDate(postDate.getDate() + (template.day - 1));

                    return (
                      <div
                        key={template.day}
                        className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2.5 hover:border-white/20 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-mono font-bold text-xs">
                              Tag {template.day}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {postDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })} um 18:00
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                            {template.pillarLabel}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-white line-clamp-1">{template.headline}</h5>
                        <p className="text-[11px] text-zinc-300 line-clamp-2 bg-black/40 p-2 rounded-lg border border-white/5 font-sans">
                          {template.universalCaption}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                          <span>{template.slides.length} Folien Prompts</span>
                          <span className="font-mono text-orange-400/80">{template.hashtags.join(" ")}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 1-Click Schedule Action Footer */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-purple-950/30 to-black/60 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>30 Tage Content fertig vorbereitet & geprüft</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Wird automatisch auf 30 Tage kalendarisch verteilt und für deinen Kanal eingeplant.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Keys anpassen
                  </button>

                  <button
                    type="button"
                    disabled={isSchedulingBatch}
                    onClick={handleScheduleAll30Days}
                    className="cryptox-orange-btn !py-2.5 !px-6 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSchedulingBatch ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Terminiere 30 Tage...</span>
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-4 h-4" />
                        <span>🚀 Alle 30 Tage jetzt einplanen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
