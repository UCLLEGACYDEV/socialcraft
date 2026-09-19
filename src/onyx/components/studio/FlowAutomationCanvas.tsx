import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Share2,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  Activity,
  Layers,
  Settings2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SocialChannel, ScheduledPost } from "@/onyx/types";

interface FlowConnection {
  id: string;
  fromDayId: string;
  toPromptId: string;
  toChannelId: string;
}

interface DayTriggerNode {
  id: string;
  day: string;
  time: string;
}

interface PromptGeneratorNode {
  id: string;
  title: string;
  topic: string;
  format: "Karussell (7 Slides)" | "Single Image" | "Infografik";
}

interface ChannelNode {
  id: string;
  platform: string;
  name: string;
  handle: string;
}

interface FlowAutomationCanvasProps {
  socialChannels: SocialChannel[];
  onSchedulePost: (post: ScheduledPost) => void;
}

export function FlowAutomationCanvas({
  socialChannels,
  onSchedulePost,
}: FlowAutomationCanvasProps) {
  const [isActive, setIsActive] = useState(true);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Default Wochentage
  const [days, setDays] = useState<DayTriggerNode[]>([
    { id: "day-mon", day: "Jeden Montag", time: "09:00 Uhr" },
    { id: "day-wed", day: "Jeden Mittwoch", time: "18:00 Uhr" },
    { id: "day-fri", day: "Jeden Freitag", time: "12:00 Uhr" },
  ]);

  // Default Prompt Generatoren
  const [prompts, setPrompts] = useState<PromptGeneratorNode[]>([
    {
      id: "prompt-mindset",
      title: "Mindset & Motivation",
      topic: "Inspirierendes Zitat mit tiefem Kontext & 3 praktischen Lektionen",
      format: "Karussell (7 Slides)",
    },
    {
      id: "prompt-casestudy",
      title: "B2B Case Study",
      topic: "Vorher-Nachher Fallstudie mit exakten Kennzahlen und Prozessschritten",
      format: "Karussell (7 Slides)",
    },
    {
      id: "prompt-hacks",
      title: "Wochenend-Insights",
      topic: "3 Hebel für sofortige Produktivität & Zeitersparnis",
      format: "Karussell (7 Slides)",
    },
  ]);

  // Available Channels
  const channels: ChannelNode[] = socialChannels.length > 0
    ? socialChannels.map((c) => ({
        id: c.id,
        platform: c.platform,
        name: c.name,
        handle: c.handle || `@${c.platform}`,
      }))
    : [
        { id: "ch-ig", platform: "instagram", name: "Instagram Pro", handle: "@socialcraft.ai" },
        { id: "ch-fb", platform: "facebook", name: "Facebook Seite", handle: "@facebook.page" },
      ];

  // Active Flow Connections (n8n Wires)
  const [connections, setConnections] = useState<FlowConnection[]>([
    {
      id: "flow-1",
      fromDayId: "day-mon",
      toPromptId: "prompt-mindset",
      toChannelId: channels[0]?.id || "ch-ig",
    },
    {
      id: "flow-2",
      fromDayId: "day-wed",
      toPromptId: "prompt-casestudy",
      toChannelId: channels[1]?.id || channels[0]?.id || "ch-ig",
    },
    {
      id: "flow-3",
      fromDayId: "day-fri",
      toPromptId: "prompt-hacks",
      toChannelId: channels[0]?.id || "ch-ig",
    },
  ]);

  const [selectedDay, setSelectedDay] = useState<string>("day-mon");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("prompt-mindset");
  const [selectedChannel, setSelectedChannel] = useState<string>(channels[0]?.id || "");

  const handleCreateConnection = () => {
    const newConn: FlowConnection = {
      id: `flow-${Date.now()}`,
      fromDayId: selectedDay,
      toPromptId: selectedPrompt,
      toChannelId: selectedChannel || channels[0]?.id || "default",
    };
    setConnections((prev) => [...prev, newConn]);
    toast.success("Neuer n8n-Flow erfolgreich verbunden! ⚡");
  };

  const handleDeleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    toast.info("Verbindung entfernt");
  };

  const handleTestWeeklyRun = async () => {
    setIsRunningTest(true);
    try {
      // Simulate test run of all active flows
      await new Promise((r) => setTimeout(r, 1200));

      connections.forEach((conn, idx) => {
        const p = prompts.find((pr) => pr.id === conn.toPromptId);
        const d = days.find((dy) => dy.id === conn.fromDayId);
        const ch = channels.find((c) => c.id === conn.toChannelId);

        if (p && d && ch) {
          const fakePost: ScheduledPost = {
            id: `flow-post-${Date.now()}-${idx}`,
            title: `${p.title} (${d.day})`,
            caption: `${p.topic}\n\nAutomatisch erstellt & vorgeplant über Socialcraft Flow.`,
            hashtags: ["#SocialcraftFlow", "#Automated"],
            mediaUrls: [],
            mediaType: "carousel",
            channelId: ch.id,
            platform: ch.platform as any,
            scheduledFor: new Date(Date.now() + (idx + 1) * 86400000).toISOString(),
            status: "scheduled",
            createdAt: new Date().toISOString(),
          };
          onSchedulePost(fakePost);
        }
      });

      toast.success(`Wochen-Flow ausgeführt! ${connections.length} Posts wurden automatisch erstellt & vorgeplant 🚀`);
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Visuelle Automatisierung
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Flow Automation (n8n-Style Canvas)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verbinde Wochentage mit KI-Themen und deinen Social-Media-Kanälen für eine vollautomatische Wochen-Pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
              isActive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-900 border-white/10 text-zinc-400",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-600")} />
            <span>{isActive ? "Autopilot: Aktiv" : "Autopilot: Pausiert"}</span>
          </button>

          <button
            type="button"
            onClick={handleTestWeeklyRun}
            disabled={isRunningTest || connections.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] hover:scale-[1.02] text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Play className={cn("h-3.5 w-3.5", isRunningTest && "animate-spin")} />
            <span>{isRunningTest ? "Erzeuge Test-Woche..." : "Jetzt Flow testen"}</span>
          </button>
        </div>
      </div>

      {/* ── The Visual Canvas Workspace ─────────────────────────────── */}
      <div className="relative rounded-3xl border border-white/10 bg-[#0A0710] p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* 3 Node Columns (Trigger -> Logic -> Output) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* 1. Trigger Column (Wochentag) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="h-6 w-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                1. Trigger (Wochentag)
              </h3>
            </div>

            <div className="space-y-3">
              {days.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer relative group",
                    selectedDay === d.id
                      ? "border-[#FF4D17] bg-[#FF4D17]/10 shadow-lg shadow-orange-500/10"
                      : "border-white/10 bg-black/40 hover:border-white/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{d.day}</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">
                      {d.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Löst wöchentlich aus</p>

                  {/* Node Port Dot Right */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#FF4D17] border-2 border-black" />
                </div>
              ))}
            </div>
          </div>

          {/* 2. Generator Column (Thema / Prompt) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                2. KI-Generator (Thema)
              </h3>
            </div>

            <div className="space-y-3">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPrompt(p.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer relative group",
                    selectedPrompt === p.id
                      ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                      : "border-white/10 bg-black/40 hover:border-white/20",
                  )}
                >
                  {/* Node Port Dot Left */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-purple-500 border-2 border-black" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.title}</span>
                    <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {p.format}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{p.topic}</p>

                  {/* Node Port Dot Right */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-purple-500 border-2 border-black" />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Output Column (Social-Media-Kanal) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="h-6 w-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Share2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                3. Veröffentlichung (Kanal)
              </h3>
            </div>

            <div className="space-y-3">
              {channels.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedChannel(c.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer relative group",
                    selectedChannel === c.id
                      ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                      : "border-white/10 bg-black/40 hover:border-white/20",
                  )}
                >
                  {/* Node Port Dot Left */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-cyan-500 border-2 border-black" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase">{c.platform}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1">{c.handle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Connect Action Bar */}
        <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Aktuelle Auswahl:{" "}
            <strong className="text-white">
              {days.find((d) => d.id === selectedDay)?.day}
            </strong>{" "}
            ➔{" "}
            <strong className="text-purple-400">
              {prompts.find((p) => p.id === selectedPrompt)?.title}
            </strong>{" "}
            ➔{" "}
            <strong className="text-cyan-400">
              {channels.find((c) => c.id === selectedChannel)?.name || "Kanal"}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleCreateConnection}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer border border-white/15"
          >
            <Plus className="h-3.5 w-3.5 text-[#FF4D17]" />
            <span>Diese Verbindung hinzufügen</span>
          </button>
        </div>
      </div>

      {/* ── Active Flow List (Connections) ─────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Aktive n8n-Verbindungen ({connections.length}):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {connections.map((conn) => {
            const dayObj = days.find((d) => d.id === conn.fromDayId);
            const promptObj = prompts.find((p) => p.id === conn.toPromptId);
            const channelObj = channels.find((c) => c.id === conn.toChannelId);

            return (
              <div
                key={conn.id}
                className="p-4 rounded-2xl border border-white/10 bg-[#0F0C15] flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>{dayObj?.day}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-500" />
                    <span className="text-purple-400 truncate">{promptObj?.title}</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    ➔ {channelObj?.name || "Kanal"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteConnection(conn.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Verbindung löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
