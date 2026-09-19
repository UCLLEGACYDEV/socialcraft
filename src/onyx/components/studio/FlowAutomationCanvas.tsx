import React, { useState, useRef, useEffect, useMemo } from "react";
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
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  Cloud,
  ChevronRight,
  Zap,
  Globe,
  SlidersHorizontal,
  Bot,
  Image as ImageIcon,
  Send,
  X,
  Eye,
  Workflow,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SocialChannel, ScheduledPost, ApiSettings, BrandKit } from "@/onyx/types";
import type { User } from "@/onyx/auth";
import { getStoredCurrentUser } from "@/onyx/auth";

export type FlowNodeType =
  | "trigger_schedule"
  | "trigger_manual"
  | "ai_gemini"
  | "ai_carousel_writer"
  | "render_visuals"
  | "cloud_storage"
  | "channel_publisher";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  data: {
    // trigger_schedule
    days?: string[]; // e.g. ["Mo", "Mi", "Fr"]
    time?: string; // e.g. "09:00"
    frequency?: "weekly" | "daily" | "biweekly";

    // ai_gemini
    topic?: string;
    model?: "gemini-1.5-flash" | "gemini-2.0-flash" | "gemini-1.5-pro";
    temperature?: number;

    // ai_carousel_writer
    slideCount?: number;
    hookStyle?: string;

    // render_visuals
    aspectRatio?: "4:5" | "1:1";
    visualStyle?: string;

    // cloud_storage
    folderName?: string;
    autoSave?: boolean;

    // channel_publisher
    channelId?: string;
    publishMode?: "scheduled" | "draft";
  };
  status: "idle" | "running" | "success" | "error";
  lastOutput?: string;
}

export interface FlowWire {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface FlowRunLog {
  id: string;
  timestamp: string;
  summary: string;
  status: "success" | "error";
  details: string;
}

interface FlowAutomationCanvasProps {
  socialChannels: SocialChannel[];
  onSchedulePost: (post: ScheduledPost) => void;
  settings?: ApiSettings;
  onChangeSettings?: (patch: Partial<ApiSettings>) => void;
  brandKit?: BrandKit;
  currentUser?: User | null;
}

const ALL_WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// ── Default Preset Templates ──────────────────────────────────────────
const TEMPLATE_INSTAGRAM_AUTOPILOT: { nodes: FlowNode[]; wires: FlowWire[] } = {
  nodes: [
    {
      id: "node-trig-1",
      type: "trigger_schedule",
      title: "Wöchentlicher Zeitplan",
      subtitle: "Mo, Mi, Fr um 09:00 Uhr",
      x: 40,
      y: 120,
      data: {
        days: ["Mo", "Mi", "Fr"],
        time: "09:00",
        frequency: "weekly",
      },
      status: "idle",
    },
    {
      id: "node-ai-1",
      type: "ai_gemini",
      title: "Gemini Content Engine",
      subtitle: "B2B & Karussell Themen",
      x: 320,
      y: 120,
      data: {
        topic: "3 fatale Fehler in der B2B-Kommunikation und wie man sie sofort löst",
        model: "gemini-1.5-flash",
        temperature: 0.7,
      },
      status: "idle",
    },
    {
      id: "node-write-1",
      type: "ai_carousel_writer",
      title: "Karussell Texter",
      subtitle: "7 Slides Hochformat",
      x: 600,
      y: 120,
      data: {
        slideCount: 7,
        hookStyle: "Provokanter Scroll-Stopper",
      },
      status: "idle",
    },
    {
      id: "node-vis-1",
      type: "render_visuals",
      title: "Kie AI 4K Renderer",
      subtitle: "Aspect 4:5 · Dark Aesthetic",
      x: 880,
      y: 120,
      data: {
        aspectRatio: "4:5",
        visualStyle: "3D Matte Marble with Purple Rim Light",
      },
      status: "idle",
    },
    {
      id: "node-pub-1",
      type: "channel_publisher",
      title: "Instagram Veröffentlichung",
      subtitle: "PostForMe Channel",
      x: 1160,
      y: 120,
      data: {
        publishMode: "scheduled",
      },
      status: "idle",
    },
  ],
  wires: [
    { id: "w-1", fromNodeId: "node-trig-1", toNodeId: "node-ai-1" },
    { id: "w-2", fromNodeId: "node-ai-1", toNodeId: "node-write-1" },
    { id: "w-3", fromNodeId: "node-write-1", toNodeId: "node-vis-1" },
    { id: "w-4", fromNodeId: "node-vis-1", toNodeId: "node-pub-1" },
  ],
};

const TEMPLATE_DAILY_QUOTES: { nodes: FlowNode[]; wires: FlowWire[] } = {
  nodes: [
    {
      id: "node-trig-daily",
      type: "trigger_schedule",
      title: "Täglicher Morgen-Trigger",
      subtitle: "Täglich um 08:00 Uhr",
      x: 40,
      y: 120,
      data: {
        days: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
        time: "08:00",
        frequency: "daily",
      },
      status: "idle",
    },
    {
      id: "node-ai-quotes",
      type: "ai_gemini",
      title: "Zitate- & Mindset-Generator",
      subtitle: "Philosophische Deep Dives",
      x: 340,
      y: 120,
      data: {
        topic: "Tägliches stoisches Zitat mit 3 konkreten Denkansätzen für den Tag",
        model: "gemini-1.5-flash",
      },
      status: "idle",
    },
    {
      id: "node-vis-quotes",
      type: "render_visuals",
      title: "Minimalist Visuals",
      subtitle: "1080x1350px 4:5",
      x: 640,
      y: 120,
      data: {
        aspectRatio: "4:5",
        visualStyle: "Minimalist Dark Obsidian & Gold Accent",
      },
      status: "idle",
    },
    {
      id: "node-pub-quotes",
      type: "channel_publisher",
      title: "Social Channel",
      subtitle: "Instagram & Facebook",
      x: 940,
      y: 120,
      data: {
        publishMode: "scheduled",
      },
      status: "idle",
    },
  ],
  wires: [
    { id: "wq-1", fromNodeId: "node-trig-daily", toNodeId: "node-ai-quotes" },
    { id: "wq-2", fromNodeId: "node-ai-quotes", toNodeId: "node-vis-quotes" },
    { id: "wq-3", fromNodeId: "node-vis-quotes", toNodeId: "node-pub-quotes" },
  ],
};

export function FlowAutomationCanvas({
  socialChannels,
  onSchedulePost,
  settings,
  onChangeSettings,
  brandKit,
  currentUser,
}: FlowAutomationCanvasProps) {
  // 100% Local-First Storage for Nodes, Wires & Logs (Zero Supabase DB costs!)
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("onyx.flowAutomationNodes");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return TEMPLATE_INSTAGRAM_AUTOPILOT.nodes;
  });

  const [wires, setWires] = useState<FlowWire[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("onyx.flowAutomationWires");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return TEMPLATE_INSTAGRAM_AUTOPILOT.wires;
  });

  const [runLogs, setRunLogs] = useState<FlowRunLog[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("onyx.flowAutomationLogs");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunningFlow, setIsRunningFlow] = useState(false);
  const [activeWireStart, setActiveWireStart] = useState<string | null>(null);
  const [isAddingNodeOpen, setIsAddingNodeOpen] = useState(false);

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever nodes or wires change
  useEffect(() => {
    try {
      localStorage.setItem("onyx.flowAutomationNodes", JSON.stringify(nodes));
    } catch {}
  }, [nodes]);

  useEffect(() => {
    try {
      localStorage.setItem("onyx.flowAutomationWires", JSON.stringify(wires));
    } catch {}
  }, [wires]);

  useEffect(() => {
    try {
      localStorage.setItem("onyx.flowAutomationLogs", JSON.stringify(runLogs));
    } catch {}
  }, [runLogs]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  // ── Node Updates ──────────────────────────────────────────────────
  const updateNodeData = (nodeId: string, patchData: Partial<FlowNode["data"]>) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...patchData } }
          : n,
      ),
    );
  };

  const updateNodeMeta = (nodeId: string, patch: Partial<FlowNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setWires((prev) => prev.filter((w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    toast.info("Node und zugehörige Verbindungen gelöscht.");
  };

  const addNode = (type: FlowNodeType) => {
    const newId = `node-${Date.now()}`;
    const titles: Record<FlowNodeType, { title: string; subtitle: string }> = {
      trigger_schedule: { title: "Wöchentlicher Zeitplan", subtitle: "Mo, Mi, Fr um 09:00 Uhr" },
      trigger_manual: { title: "Manueller Sofort-Trigger", subtitle: "Auf Knopfdruck ausführen" },
      ai_gemini: { title: "Google Gemini KI", subtitle: "Themen- & Prompt-Engine" },
      ai_carousel_writer: { title: "Karussell Texter", subtitle: "7 Slides Gliederung" },
      render_visuals: { title: "Kie AI Visuals", subtitle: "4K 3D Dark Render" },
      cloud_storage: { title: "Mega S4 Cloud", subtitle: "Automatische Sicherung" },
      channel_publisher: { title: "PostForMe Publisher", subtitle: "Instagram / Social Channel" },
    };

    const initialData: FlowNode["data"] = {
      days: ["Mo", "Mi", "Fr"],
      time: "09:00",
      frequency: "weekly",
      topic: "3 wichtige Lektionen für mehr Erfolg",
      model: "gemini-1.5-flash",
      temperature: 0.7,
      slideCount: 7,
      hookStyle: "Provokant",
      aspectRatio: "4:5",
      visualStyle: "3D Matte Marble with Purple Glow",
      folderName: "flow_content",
      publishMode: "scheduled",
    };

    const newNode: FlowNode = {
      id: newId,
      type,
      title: titles[type].title,
      subtitle: titles[type].subtitle,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      data: initialData,
      status: "idle",
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setIsAddingNodeOpen(false);
    toast.success(`${titles[type].title} Node zum Canvas hinzugefügt! ⚡`);
  };

  // ── Wires / Connections ───────────────────────────────────────────
  const handleConnectPort = (nodeId: string) => {
    if (!activeWireStart) {
      setActiveWireStart(nodeId);
      toast.info("Klicke jetzt auf die Ziel-Node, um sie zu verbinden 🔌");
      return;
    }

    if (activeWireStart === nodeId) {
      setActiveWireStart(null);
      return;
    }

    // Check if already connected
    const exists = wires.some(
      (w) => w.fromNodeId === activeWireStart && w.toNodeId === nodeId,
    );
    if (!exists) {
      const newWire: FlowWire = {
        id: `wire-${Date.now()}`,
        fromNodeId: activeWireStart,
        toNodeId: nodeId,
      };
      setWires((prev) => [...prev, newWire]);
      toast.success("Nodes erfolgreich verbunden! ⚡");
    }
    setActiveWireStart(null);
  };

  const deleteWire = (wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    toast.info("Verbindung getrennt.");
  };

  // ── Drag & Drop on Canvas ─────────────────────────────────────────
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    };
    setDraggingNodeId(nodeId);
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    const newX = Math.max(10, Math.min(1800, e.clientX - rect.left - dragOffsetRef.current.x));
    const newY = Math.max(10, Math.min(1200, e.clientY - rect.top - dragOffsetRef.current.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n)),
    );
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  // ── 1-Click Execution Engine (Test Run) ─────────────────────────────
  const handleRunFlow = async () => {
    if (nodes.length === 0) return;
    setIsRunningFlow(true);

    // Reset status
    setNodes((prev) => prev.map((n) => ({ ...n, status: "idle" })));

    const now = new Date();
    const targetChannel = socialChannels[0] || {
      id: "ch-default",
      platform: "instagram" as const,
      name: "Instagram Account",
    };

    try {
      // 1. Highlight triggers
      const triggerNodes = nodes.filter((n) => n.type.startsWith("trigger"));
      for (const t of triggerNodes) {
        setNodes((prev) => prev.map((n) => (n.id === t.id ? { ...n, status: "running" } : n)));
        await new Promise((r) => setTimeout(r, 400));
        setNodes((prev) =>
          prev.map((n) => (n.id === t.id ? { ...n, status: "success", lastOutput: "Trigger aktiv" } : n)),
        );
      }

      // 2. Run AI nodes
      const aiNodes = nodes.filter((n) => n.type === "ai_gemini" || n.type === "ai_carousel_writer");
      let generatedTitle = "Socialcraft Automatisierter Beitrag";
      for (const a of aiNodes) {
        setNodes((prev) => prev.map((n) => (n.id === a.id ? { ...n, status: "running" } : n)));
        await new Promise((r) => setTimeout(r, 600));

        if (a.data.topic) generatedTitle = a.data.topic;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === a.id
              ? { ...n, status: "success", lastOutput: `7 Slides generiert: "${generatedTitle}"` }
              : n,
          ),
        );
      }

      // 3. Run visual nodes
      const visualNodes = nodes.filter((n) => n.type === "render_visuals" || n.type === "cloud_storage");
      for (const v of visualNodes) {
        setNodes((prev) => prev.map((n) => (n.id === v.id ? { ...n, status: "running" } : n)));
        await new Promise((r) => setTimeout(r, 500));
        setNodes((prev) =>
          prev.map((n) =>
            n.id === v.id
              ? { ...n, status: "success", lastOutput: "4K Visuals gerendert & in Cloud gesichert" }
              : n,
          ),
        );
      }

      // 4. Run publisher nodes
      const pubNodes = nodes.filter((n) => n.type === "channel_publisher");
      for (const p of pubNodes) {
        setNodes((prev) => prev.map((n) => (n.id === p.id ? { ...n, status: "running" } : n)));
        await new Promise((r) => setTimeout(r, 400));

        // Create the real scheduled post
        const postDate = new Date(now.getTime() + 86400000);
        postDate.setHours(9, 0, 0, 0);

        const newPost: ScheduledPost = {
          id: `flow-post-${Date.now()}`,
          title: generatedTitle,
          caption: `${generatedTitle}\n\nAutomatischer Workflow-Beitrag über Socialcraft Flow Builder.\n\n#socialcraft #automation #content`,
          hashtags: ["#socialcraft", "#automation", "#content"],
          mediaUrls: [],
          mediaType: "carousel",
          channelId: targetChannel.id,
          platform: targetChannel.platform,
          scheduledFor: postDate.toISOString(),
          status: "scheduled",
          createdAt: new Date().toISOString(),
        };

        onSchedulePost(newPost);
        setNodes((prev) =>
          prev.map((n) =>
            n.id === p.id
              ? { ...n, status: "success", lastOutput: `Eingeplant für ${targetChannel.name} (09:00 Uhr)` }
              : n,
          ),
        );
      }

      // Add to run history
      const newLog: FlowRunLog = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        summary: `Erfolgreicher Testlauf: "${generatedTitle.slice(0, 40)}..."`,
        status: "success",
        details: `Alle ${nodes.length} Nodes durchlaufen. 1 Karussell im Planer für ${targetChannel.name} hinterlegt.`,
      };
      setRunLogs((prev) => [newLog, ...prev.slice(0, 9)]);

      toast.success("🚀 Flow erfolgreich durchlaufen! Neuer Beitrag im Planer angelegt.");
    } finally {
      setIsRunningFlow(false);
    }
  };

  const loadTemplate = (tmpl: typeof TEMPLATE_INSTAGRAM_AUTOPILOT) => {
    setNodes(tmpl.nodes);
    setWires(tmpl.wires);
    setSelectedNodeId(null);
    toast.success("Vorlage erfolgreich in den Flow-Canvas geladen! ✨");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* ── Top Header & Flow Controls ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              n8n Visual Automation Builder
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Flow Automation
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Erstelle, verschiebe und verbinde Nodes für deine Content-Pipeline frei auf dem Canvas. Vollständig lokal gespeichert (0 € Supabase-Kosten).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Template Switcher */}
          <button
            type="button"
            onClick={() => loadTemplate(TEMPLATE_INSTAGRAM_AUTOPILOT)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Workflow className="h-3.5 w-3.5 text-purple-400" />
            <span>Instagram Karussell Vorlage</span>
          </button>

          <button
            type="button"
            onClick={() => loadTemplate(TEMPLATE_DAILY_QUOTES)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Tägliche Zitate Vorlage</span>
          </button>

          {/* Add Node Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddingNodeOpen(!isAddingNodeOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#FF4D17]/40 bg-[#FF4D17]/10 hover:bg-[#FF4D17]/20 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#FF4D17]" />
              <span>Node hinzufügen</span>
            </button>

            {isAddingNodeOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/15 bg-[#120E1C] p-2 shadow-2xl z-50 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 block">
                  Trigger
                </span>
                <button
                  type="button"
                  onClick={() => addNode("trigger_schedule")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Zeitplan / Wochentag</span>
                </button>
                <button
                  type="button"
                  onClick={() => addNode("trigger_manual")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Manueller Trigger</span>
                </button>

                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 block pt-1">
                  KI & Erstellung
                </span>
                <button
                  type="button"
                  onClick={() => addNode("ai_gemini")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Bot className="h-3.5 w-3.5 text-[#FF6A1F]" />
                  <span>Google Gemini Engine</span>
                </button>
                <button
                  type="button"
                  onClick={() => addNode("ai_carousel_writer")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  <span>Karussell Texter</span>
                </button>
                <button
                  type="button"
                  onClick={() => addNode("render_visuals")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-pink-400" />
                  <span>Kie AI 4K Visuals</span>
                </button>

                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 block pt-1">
                  Aktionen
                </span>
                <button
                  type="button"
                  onClick={() => addNode("cloud_storage")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Mega S4 Cloud Saver</span>
                </button>
                <button
                  type="button"
                  onClick={() => addNode("channel_publisher")}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>PostForMe Publisher</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Run CTA */}
          <button
            type="button"
            onClick={handleRunFlow}
            disabled={isRunningFlow}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] hover:scale-[1.02] active:scale-[0.98] text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all cursor-pointer"
          >
            {isRunningFlow ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Flow läuft...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>🚀 Flow ausführen (Test Run)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Active Wire Connecting Mode Banner ──────────────────────── */}
      {activeWireStart && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 flex items-center justify-between text-xs text-purple-200 animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
            <span>Verbindungsmodus aktiv: Wähle die Ziel-Node aus, um das Datenkabel zu spannen.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveWireStart(null)}
            className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg bg-black/40"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* ── Canvas & Inspector Layout ────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Visual Node Canvas Area */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="relative flex-1 min-h-[620px] max-h-[700px] rounded-3xl border border-white/10 bg-[#07050A] overflow-hidden select-none shadow-2xl"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        >
          {/* SVG Connection Cables (n8n Wires) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {wires.map((wire) => {
              const from = nodes.find((n) => n.id === wire.fromNodeId);
              const to = nodes.find((n) => n.id === wire.toNodeId);
              if (!from || !to) return null;

              const startX = from.x + 220; // right edge of card
              const startY = from.y + 40;
              const endX = to.x; // left edge of card
              const endY = to.y + 40;
              const dx = Math.abs(endX - startX) * 0.5;

              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const isFlowActive = from.status === "running" || to.status === "running";

              return (
                <g key={wire.id} className="pointer-events-auto group">
                  {/* Glowing Cable */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isFlowActive ? "#FF4D17" : "#8B5CF6"}
                    strokeWidth={isFlowActive ? "3.5" : "2"}
                    strokeDasharray={isFlowActive ? "6 4" : "none"}
                    className={cn(isFlowActive && "animate-pulse")}
                    opacity={isFlowActive ? 1 : 0.6}
                  />
                  {/* Invisible thicker stroke for clicking to delete */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    onClick={() => deleteWire(wire.id)}
                    className="cursor-pointer"
                  >
                    <title>Kabel klicken zum Löschen</title>
                  </path>
                </g>
              );
            })}
          </svg>

          {/* Interactive Nodes on Canvas */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isConnectingFrom = activeWireStart === node.id;

            return (
              <div
                key={node.id}
                style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "absolute z-20 w-[220px] rounded-2xl border bg-[#0E0B16]/95 backdrop-blur-xl p-3.5 shadow-2xl transition-shadow cursor-grab active:cursor-grabbing space-y-2.5",
                  isSelected
                    ? "border-[#FF4D17] shadow-orange-500/20"
                    : isConnectingFrom
                    ? "border-purple-500 shadow-purple-500/30"
                    : "border-white/15 hover:border-white/30",
                  node.status === "running" && "ring-2 ring-[#FF4D17] animate-pulse",
                  node.status === "success" && "border-emerald-500/60",
                  node.status === "error" && "border-red-500",
                )}
              >
                {/* Node Drag Handle & Title */}
                <div
                  onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                  className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]"
                >
                  <div className="flex items-center gap-1.5">
                    {node.type.startsWith("trigger") && <Clock className="h-3.5 w-3.5 text-blue-400" />}
                    {node.type === "ai_gemini" && <Bot className="h-3.5 w-3.5 text-[#FF6A1F]" />}
                    {node.type === "ai_carousel_writer" && <Layers className="h-3.5 w-3.5 text-purple-400" />}
                    {node.type === "render_visuals" && <ImageIcon className="h-3.5 w-3.5 text-pink-400" />}
                    {node.type === "cloud_storage" && <Cloud className="h-3.5 w-3.5 text-cyan-400" />}
                    {node.type === "channel_publisher" && <Share2 className="h-3.5 w-3.5 text-emerald-400" />}
                    <span className="text-[11px] font-bold text-white tracking-tight truncate max-w-[130px]">
                      {node.title}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {node.status === "running" && <RefreshCw className="h-3 w-3 text-[#FF4D17] animate-spin" />}
                  {node.status === "success" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  {node.status === "error" && <AlertCircle className="h-3 w-3 text-red-400" />}
                </div>

                {/* Subtitle / Details */}
                <div className="text-[10px] text-zinc-400 leading-snug">
                  {node.subtitle}
                  {node.lastOutput && (
                    <p className="text-[9px] text-emerald-400/90 font-mono mt-1 truncate">
                      ✓ {node.lastOutput}
                    </p>
                  )}
                </div>

                {/* Connect Port Button */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectPort(node.id);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-lg border font-semibold transition-colors cursor-pointer text-[10px]",
                      isConnectingFrom
                        ? "bg-purple-600 text-white border-purple-400"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10",
                    )}
                  >
                    {isConnectingFrom ? "Verbinden..." : "Port verbinden 🔌"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Node löschen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right-Side Node Inspector Drawer ───────────────────────── */}
        <div className="w-full xl:w-96 rounded-3xl border border-white/10 bg-[#0C0913]/90 p-5 backdrop-blur-xl shadow-2xl flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#FF4D17]" />
                  <h3 className="text-sm font-bold text-white">Node-Eigenschaften</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Node Title Edit */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Node Bezeichnung:
                </label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => updateNodeMeta(selectedNode.id, { title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-[#FF4D17] focus:outline-none"
                />
              </div>

              {/* ── Type-Specific Settings ── */}
              {selectedNode.type === "trigger_schedule" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Wochentage wählen:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ALL_WEEKDAYS.map((day) => {
                        const isChecked = selectedNode.data.days?.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = selectedNode.data.days || [];
                              const nextDays = isChecked
                                ? currentDays.filter((d) => d !== day)
                                : [...currentDays, day];
                              updateNodeData(selectedNode.id, { days: nextDays });
                              updateNodeMeta(selectedNode.id, {
                                subtitle: `${nextDays.join(", ")} um ${selectedNode.data.time || "09:00"} Uhr`,
                              });
                            }}
                            className={cn(
                              "h-7 w-7 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                              isChecked
                                ? "bg-[#FF4D17] text-white"
                                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white",
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Uhrzeit:
                    </label>
                    <input
                      type="time"
                      value={selectedNode.data.time || "09:00"}
                      onChange={(e) => {
                        updateNodeData(selectedNode.id, { time: e.target.value });
                        updateNodeMeta(selectedNode.id, {
                          subtitle: `${(selectedNode.data.days || []).join(", ")} um ${e.target.value} Uhr`,
                        });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white focus:border-[#FF4D17] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "ai_gemini" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Thema / Prompt Anweisung:
                    </label>
                    <textarea
                      value={selectedNode.data.topic || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, { topic: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white focus:border-[#FF4D17] focus:outline-none resize-none"
                      placeholder="Worüber soll die KI Inhalte erstellen?"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Gemini Modell:
                    </label>
                    <select
                      value={selectedNode.data.model || "gemini-1.5-flash"}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          model: e.target.value as FlowNode["data"]["model"],
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#FF4D17] focus:outline-none"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Extrem schnell & sparsam)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen High Speed)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Tiefere Analysen)</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === "ai_carousel_writer" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Folien-Anzahl:
                    </label>
                    <div className="flex items-center gap-2">
                      {[4, 7, 10].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => updateNodeData(selectedNode.id, { slideCount: count })}
                          className={cn(
                            "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                            selectedNode.data.slideCount === count
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-zinc-400 hover:text-white border border-white/10",
                          )}
                        >
                          {count} Slides
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Hook-Tonalität:
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.hookStyle || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, { hookStyle: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#FF4D17] focus:outline-none"
                      placeholder="z. B. Provokant, Neugier, Zahlen"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "render_visuals" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Seitenverhältnis:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateNodeData(selectedNode.id, { aspectRatio: "4:5" })}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                          selectedNode.data.aspectRatio === "4:5"
                            ? "bg-[#FF4D17] text-white"
                            : "bg-white/5 text-zinc-400 hover:text-white border border-white/10",
                        )}
                      >
                        4:5 Hochformat
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNodeData(selectedNode.id, { aspectRatio: "1:1" })}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                          selectedNode.data.aspectRatio === "1:1"
                            ? "bg-[#FF4D17] text-white"
                            : "bg-white/5 text-zinc-400 hover:text-white border border-white/10",
                        )}
                      >
                        1:1 Quadrat
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Visueller Stil:
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.visualStyle || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, { visualStyle: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#FF4D17] focus:outline-none"
                      placeholder="3D Matte Marble with Purple Rim Light"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "cloud_storage" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Mega S4 Bucket / Zielordner:
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.folderName || "carousels/drafts"}
                      onChange={(e) => updateNodeData(selectedNode.id, { folderName: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#FF4D17] focus:outline-none"
                      placeholder="carousels/drafts"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "channel_publisher" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Social-Media-Kanal (PostForMe):
                    </label>
                    <select
                      value={selectedNode.data.channelId || socialChannels[0]?.id || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, { channelId: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#FF4D17] focus:outline-none"
                    >
                      {socialChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.platform})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Veröffentlichungs-Modus:
                    </label>
                    <select
                      value={selectedNode.data.publishMode || "scheduled"}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          publishMode: e.target.value as "scheduled" | "draft",
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#FF4D17] focus:outline-none"
                    >
                      <option value="scheduled">Direkt im Planer terminieren</option>
                      <option value="draft">Als Entwurf zur Freigabe speichern</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-zinc-500">
              <Workflow className="h-8 w-8 text-zinc-600" />
              <p className="text-xs font-medium">Klicke eine Node auf dem Canvas an, um ihre Eigenschaften zu bearbeiten.</p>
            </div>
          )}

          {/* Quick Stats at Bottom of Inspector */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <span>{nodes.length} Nodes aktiv</span>
            <span>{wires.length} Verbindungen</span>
          </div>
        </div>
      </div>

      {/* ── Run History Log Table ────────────────────────────────────── */}
      {runLogs.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0C0913]/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#FF4D17]" />
              <span>Ausführungs-Historie (Letzte Testläufe)</span>
            </h3>
            <button
              type="button"
              onClick={() => setRunLogs([])}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Historie leeren
            </button>
          </div>

          <div className="space-y-1.5">
            {runLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.06] bg-black/30 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">{log.summary}</span>
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">{log.details}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
