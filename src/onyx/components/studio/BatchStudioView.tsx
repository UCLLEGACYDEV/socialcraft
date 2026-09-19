import React, { useState, useRef } from "react";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Send,
  Trash2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Download,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ScheduledPost, SocialChannel, ApiSettings, BrandKit, SlideContent } from "@/onyx/types";
import type { User } from "@/onyx/auth";
import { getStoredCurrentUser } from "@/onyx/auth";
import { parseBlock } from "@/onyx/parse-prompt-block";
import { generateImageUnified } from "@/onyx/mock-api";
import { saveImageToS4, makeProjectFolderName } from "@/onyx/s4-storage";
import { exportCarouselAsZip } from "@/onyx/export-zip";

export interface BatchPromptItem {
  id: string;
  slideNumber: number;
  roleLabel: string;
  headline: string;
  subtext: string;
  prompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
  progress?: number;
  status: "idle" | "generating" | "done" | "error";
  errorMessage?: string;
}

interface BatchStudioViewProps {
  socialChannels: SocialChannel[];
  onSchedulePosts: (posts: ScheduledPost[]) => void;
  settings: ApiSettings;
  brandKit?: BrandKit;
  currentUser?: User | null;
}

const EXAMPLE_CLAUDE_CAROUSEL = `Für dieses Karussell kürzere Subtexte, wie gewünscht (ein knapper Satz statt 2 bis 3). Setup bleibt: Deutsch, kein Handle, Hochformat 4:5, CTA "folge für mehr". 7 Slides: Hook, 5 Fehler, Closing.

**Slide 1 – Hook/Cover**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, dark near-black background (#0A0A10) with soft deep-purple glow (#4C1D95 → #6D28D9) and faint grid lines and soft circular bokeh shapes, a classical marble bust with five thin fracture lines radiating outward from the mouth, each fracture releasing a faint wisp of purple light, dramatic studio lighting, purple rim light (#8B5CF6–#A78BFA) tracing the jaw, positioned right of center.
Bold display headline text reading 'KOMMUNIKATION' in a small rounded purple pill badge, below it huge headline 'WARUM DEINE GESPRÄCHE IMMER WIEDER KIPPEN'.
Below the headline, a short subtext reading 'Diese 5 Fehler machen fast jeder, oft ohne es zu merken.'.
Swipe indicator text reading 'Swipe weiter →'.
No handle text, no watermark, no logo."

**Slide 2 – Fehler 01**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, dark near-black background (#0A0A10) with soft deep-purple glow, two marble profiles facing each other.
Bold display headline text reading 'FEHLER 01' in a small rounded purple pill badge, below it huge headline 'STÄNDIG UNTERBRECHEN'.
Below the headline, a short subtext reading 'Wer ständig dazwischenredet, signalisiert, dass die eigene Meinung wichtiger ist als die Antwort.'.
Swipe indicator text reading 'Swipe weiter →'."

**Slide 3 – Fehler 02**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, dark near-black background (#0A0A10), a marble profile bust with small polished chrome word shapes flying toward its ear.
Bold display headline text reading 'FEHLER 02' in a small rounded purple pill badge, below it huge headline 'ZUHÖREN UM ZU ANTWORTEN'.
Below the headline, a short subtext reading 'Wenn im Kopf schon die eigene Erwiderung läuft, kommt das Gesagte gar nicht mehr wirklich an.'."

**Slide 4 – Fehler 03**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, a marble figure standing on a small pedestal under a harsh spotlight.
Bold display headline text reading 'FEHLER 03' in a small rounded purple pill badge, below it huge headline 'KRITIK VOR ANDEREN'.
Below the headline, a short subtext reading 'Öffentliche Kritik löst selten Einsicht aus, meistens nur Scham und Rückzug.'."

**Slide 5 – Fehler 04**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, a marble mouth carved shut beneath a thin layer of stone.
Bold display headline text reading 'FEHLER 04' in a small rounded purple pill badge, below it huge headline 'SCHWEIGEN STATT ANSPRECHEN'.
Below the headline, a short subtext reading 'Unausgesprochenes verschwindet nicht, es sammelt sich nur leise an.'."

**Slide 6 – Fehler 05**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, a marble face with a faint calm smile carved on its surface.
Bold display headline text reading 'FEHLER 05' in a small rounded purple pill badge, below it huge headline 'SARKASMUS STATT EHRLICHKEIT'.
Below the headline, a short subtext reading 'Hinter jedem spitzen Kommentar steckt meistens ein echtes Anliegen, das nie direkt ausgesprochen wird.'."

**Slide 7 – Closing/CTA**
Prompt:
"Ultra-detailed cinematic 3D render, vertical 4:5, 1080x1350px social media carousel graphic, a small path of smooth marble stones each glowing faintly purple.
Huge headline reading 'KLEINE ÄNDERUNG GROSSE WIRKUNG'.
Below the headline, a short subtext reading 'Häng dir einfach den einen Fehler ab, den du am ehesten bei dir wiedererkennst.'.
A small rounded purple pill button reading 'folge für mehr'."

**Caption-Vorschlag:**
Diese Fehler machen fast alle, ohne es zu merken.

Welcher Fehler passiert dir am häufigsten? Schreib die Nummer in die Kommentare.

#kommunikation #beziehungstipps #achtsamkeit #selbstreflexion #zwischenmenschlich #mentalhealth`;

const EXAMPLE_CLAUDE_BLOCK = `### Post 1: Die 3 größten Fehler bei B2B-Sales
Die meisten Vertriebler pitchen zu früh, statt die wahren Schmerzpunkte zu diagnostizieren. 
Schritt 1: Erst Problem isolieren, dann Lösung anbieten.
Hashtags: #B2BSales #Vertrieb #Unternehmertum

---

### Post 2: Warum 90% der KI-Automatisierungen scheitern
Viele Unternehmen automatisieren ineffiziente Prozesse. Das erzeugt nur schnelleres Chaos.
Regel: Erst den Workflow manuell perfektionieren, dann mit KI skalieren.
Hashtags: #KIFürUnternehmen #Automation #Effizienz

---

### Post 3: Wie du in 30 Tagen eine Thought-Leadership-Marke aufbaust
1. Definiere 1 Kernüberzeugung, die 80% deiner Branche anzweifeln.
2. Teile wöchentlich 3 datenbasierte Fallstudien.
3. Beantworte jeden Kommentar innerhalb der ersten 60 Minuten.
Hashtags: #PersonalBranding #LinkedInTipps #Wachstum`;

function makeBatchId() {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function BatchStudioView({
  socialChannels,
  onSchedulePosts,
  settings,
  brandKit,
  currentUser,
}: BatchStudioViewProps) {
  const [rawTextBlock, setRawTextBlock] = useState("");
  const [batchTitle, setBatchTitle] = useState("");
  const [batchCaption, setBatchCaption] = useState("");
  const [batchHashtags, setBatchHashtags] = useState<string[]>([]);
  const [promptItems, setPromptItems] = useState<BatchPromptItem[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(new Set());
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const activeChannel = socialChannels[0] || {
    id: "default-channel",
    platform: "instagram",
    name: "Instagram Account",
  };

  const handleParseBlock = (textToParse?: string) => {
    const text = (textToParse || rawTextBlock).trim();
    if (!text) {
      toast.error("Bitte füge zuerst einen Textblock ein.");
      return;
    }

    // 1. Try structured carousel parsing first (exact Claude / ChatGPT format)
    const structuredCarousels = parseBlock(text);
    if (structuredCarousels.length > 0 && structuredCarousels.some((c) => c.slides.length > 0)) {
      const c = structuredCarousels[0];
      const hashtags = c.caption
        ? c.caption.match(/#\w+/g) || ["#Socialcraft", "#Karussell"]
        : ["#Socialcraft", "#Karussell"];

      const captionClean = c.caption
        ? c.caption.replace(/#\w+/g, "").trim()
        : c.slides[0]?.subtext || c.title;

      const items: BatchPromptItem[] = c.slides.map((s, idx) => ({
        id: makeBatchId(),
        slideNumber: s.slideNumber || idx + 1,
        roleLabel: s.title || `Folie ${idx + 1}`,
        headline: s.headline || s.title,
        subtext: s.subtext || "",
        prompt: s.prompt || "",
        status: "idle",
        progress: 0,
      }));

      setBatchTitle(c.title || "Socialcraft Karussell");
      setBatchCaption(captionClean);
      setBatchHashtags(hashtags);
      setPromptItems(items);
      setIsScheduled(false);
      setIsInputExpanded(false); // collapse input to focus on visual cards!
      toast.success(`${items.length} Prompts präzise aus Claude-Block erkannt! 🎯`, {
        description: "Alle Visual-Prompts und Folientexte sind bereit zum 1-Klick Rendern.",
      });
      return;
    }

    // 2. Fallback to generic chunk split
    const chunks = text
      .split(/(?:---+|(?=###\s*Post|\bPost\s*\d+:?))/i)
      .map((c) => c.trim())
      .filter((c) => c.length > 20);

    const items: BatchPromptItem[] = chunks.map((chunk, idx) => {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      const titleLine = lines[0]?.replace(/^#+\s*/, "").replace(/^Post\s*\d+:?\s*/i, "") || `Post ${idx + 1}`;
      const captionLines = lines.slice(1).filter((l) => !l.toLowerCase().startsWith("hashtags:"));
      const hashtagLine = lines.find((l) => l.toLowerCase().startsWith("hashtags:"));
      const hashtags = hashtagLine
        ? hashtagLine.replace(/^hashtags:\s*/i, "").split(/\s+/).filter((t) => t.startsWith("#"))
        : ["#Socialcraft", "#BatchContent"];

      return {
        id: makeBatchId(),
        slideNumber: idx + 1,
        roleLabel: `Post ${idx + 1}`,
        headline: titleLine,
        subtext: captionLines[0] || "",
        prompt: captionLines.join(" ") || titleLine,
        status: "idle",
        progress: 0,
      };
    });

    setBatchTitle(items[0]?.headline || "Batch Serie");
    setBatchCaption(items.map((it) => it.headline).join("\n\n"));
    setBatchHashtags(["#Socialcraft", "#ContentPlanung"]);
    setPromptItems(items);
    setIsScheduled(false);
    setIsInputExpanded(false);
    toast.success(`${items.length} Prompts aus Textblock extrahiert! 🎯`);
  };

  const updateItem = (itemId: string, patch: Partial<BatchPromptItem>) => {
    setPromptItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    );
  };

  const togglePromptExpanded = (itemId: string) => {
    setExpandedPromptIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // ── 1-Click Flow: Alle Bilder generieren ────────────────────────────
  const handleGenerateAll = async () => {
    if (promptItems.length === 0) return;
    setIsBatchGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const effectiveUser = currentUser || getStoredCurrentUser();
    const batchFolder = makeProjectFolderName(batchTitle || "batch_prompts");
    let generatedCount = 0;

    try {
      for (let i = 0; i < promptItems.length; i++) {
        if (controller.signal.aborted) break;
        const item = promptItems[i];

        setPromptItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, isGenerating: true, status: "generating", progress: 10 }
              : it,
          ),
        );
        setBatchProgressText(`Rendere Bild ${i + 1} von ${promptItems.length}: "${item.headline || item.roleLabel}"...`);

        try {
          const res = await generateImageUnified({
            slideNumber: item.slideNumber,
            prompt: item.prompt,
            settings,
            aspectRatio: brandKit?.aspectRatio || "4:5",
            signal: controller.signal,
            onProgress: (info) => {
              if (info.percent !== undefined) {
                setPromptItems((prev) =>
                  prev.map((it) =>
                    it.id === item.id ? { ...it, progress: info.percent } : it,
                  ),
                );
              }
            },
          });

          setPromptItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    imageUrl: res.imageUrl,
                    isGenerating: false,
                    status: "done",
                    progress: 100,
                  }
                : it,
            ),
          );
          generatedCount++;

          if (settings.s4AutoSave) {
            void saveImageToS4({
              imageUrl: res.imageUrl,
              prompt: item.prompt,
              category: "carousel",
              aspectRatio: brandKit?.aspectRatio || "4:5",
              user: effectiveUser,
              customFilename: `slide_${String(item.slideNumber).padStart(2, "0")}.jpg`,
              subfolder: `batch/${batchFolder}`,
              projectName: batchFolder,
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Fehler beim Rendern";
          setPromptItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    isGenerating: false,
                    status: "error",
                    errorMessage: msg,
                    progress: 0,
                  }
                : it,
            ),
          );
          if (controller.signal.aborted) break;
        }
      }

      if (!controller.signal.aborted) {
        toast.success(`🎉 ${generatedCount} von ${promptItems.length} Bildern erfolgreich gerendert!`);
      }
    } finally {
      setIsBatchGenerating(false);
      setBatchProgressText("");
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsBatchGenerating(false);
      setBatchProgressText("");
      toast.info("Bildgenerierung abgebrochen.");
    }
  };

  // ── Einzelnes Bild neu generieren ──────────────────────────────────
  const handleRegenerateSingle = async (itemId: string) => {
    const item = promptItems.find((it) => it.id === itemId);
    if (!item) return;

    setPromptItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, isGenerating: true, status: "generating", progress: 15, errorMessage: undefined }
          : it,
      ),
    );

    const effectiveUser = currentUser || getStoredCurrentUser();
    const batchFolder = makeProjectFolderName(batchTitle || "batch_prompts");

    try {
      const res = await generateImageUnified({
        slideNumber: item.slideNumber,
        prompt: item.prompt,
        settings,
        aspectRatio: brandKit?.aspectRatio || "4:5",
        onProgress: (info) => {
          if (info.percent !== undefined) {
            setPromptItems((prev) =>
              prev.map((it) => (it.id === itemId ? { ...it, progress: info.percent } : it)),
            );
          }
        },
      });

      setPromptItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                imageUrl: res.imageUrl,
                isGenerating: false,
                status: "done",
                progress: 100,
              }
            : it,
        ),
      );

      if (settings.s4AutoSave) {
        void saveImageToS4({
          imageUrl: res.imageUrl,
          prompt: item.prompt,
          category: "carousel",
          aspectRatio: brandKit?.aspectRatio || "4:5",
          user: effectiveUser,
          customFilename: `slide_${String(item.slideNumber).padStart(2, "0")}_reroll.jpg`,
          subfolder: `batch/${batchFolder}`,
          projectName: batchFolder,
        });
      }

      toast.success(`Folie ${item.slideNumber} neu generiert! 🎨`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Generieren";
      setPromptItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, isGenerating: false, status: "error", errorMessage: msg }
            : it,
        ),
      );
      toast.error(`Fehler bei Folie ${item.slideNumber}: ${msg}`);
    }
  };

  // ── Planer & ZIP Export ────────────────────────────────────────────
  const handle1ClickSchedule = () => {
    if (promptItems.length === 0) return;

    const postDate = new Date(Date.now() + 86400000);
    postDate.setHours(9, 0, 0, 0);

    const mediaUrls = promptItems
      .map((it) => it.imageUrl)
      .filter((url): url is string => Boolean(url));

    const newPost: ScheduledPost = {
      id: makeBatchId(),
      title: batchTitle || "Batch Karussell",
      caption: `${batchCaption}\n\n${batchHashtags.join(" ")}`.trim(),
      hashtags: batchHashtags,
      mediaUrls,
      mediaType: "carousel",
      channelId: activeChannel.id,
      platform: activeChannel.platform,
      scheduledFor: postDate.toISOString(),
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    onSchedulePosts([newPost]);
    setIsScheduled(true);
    toast.success(`Karussell mit ${mediaUrls.length} Bildern für ${activeChannel.name} eingeplant! 🚀`, {
      description: `Terminiert für ${postDate.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })} um 09:00 Uhr.`,
    });
  };

  const handleExportZip = async () => {
    const renderedSlides: SlideContent[] = promptItems.map((it) => ({
      id: it.id,
      slideNumber: it.slideNumber,
      role: it.slideNumber === 1 ? "hook" : it.slideNumber === promptItems.length ? "closing" : "concept",
      roleLabel: it.roleLabel,
      headline: it.headline,
      subtext: it.subtext,
      visualPrompt: it.prompt,
      coreMetaphor: it.headline,
      primaryProps: [],
      imageUrl: it.imageUrl,
    }));

    const count = await exportCarouselAsZip(
      renderedSlides,
      batchTitle || "Batch_Karussell",
      { brandKit, withOverlay: false },
    );

    if (count > 0) {
      toast.success(`${count} Bilder als ZIP heruntergeladen! 📦`);
    } else {
      toast.error("Keine Bilder zum Herunterladen vorhanden. Generiere sie zuerst!");
    }
  };

  const renderedCount = promptItems.filter((it) => Boolean(it.imageUrl)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Claude-Prompt Parser & 1-Klick Bild-Flow
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Batch Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Füge deinen Claude-Prompt-Block ein — Socialcraft unterteilt ihn in Prompts, generiert alle 4:5 Bilder per 1-Klick und bietet für jedes Visual einen separaten Neu-Generieren-Button.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setRawTextBlock(EXAMPLE_CLAUDE_CAROUSEL);
              handleParseBlock(EXAMPLE_CLAUDE_CAROUSEL);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FF4D17]/30 bg-[#FF4D17]/10 hover:bg-[#FF4D17]/20 text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FF4D17]" />
            <span>7-Slide Karussell laden</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRawTextBlock(EXAMPLE_CLAUDE_BLOCK);
              handleParseBlock(EXAMPLE_CLAUDE_BLOCK);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            <span>3-Post Serie laden</span>
          </button>
        </div>
      </div>

      {/* ── Collapsible Input Box ────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-[#0F0C15]/80 p-5 shadow-2xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsInputExpanded(!isInputExpanded)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Claude Prompt-Block {promptItems.length > 0 ? `(${promptItems.length} Prompts aktiv)` : "eingeben"}</span>
            {isInputExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2">
            {promptItems.length > 0 && !isInputExpanded && (
              <span className="text-xs text-zinc-400 font-medium">
                Thema: <span className="text-white font-bold">{batchTitle}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handleParseBlock()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Prompts analysieren & aufteilen</span>
            </button>
          </div>
        </div>

        {isInputExpanded && (
          <div className="space-y-3 pt-2">
            <textarea
              value={rawTextBlock}
              onChange={(e) => setRawTextBlock(e.target.value)}
              placeholder="Füge hier deinen kompletten Textblock von Claude ein... (z. B. mit '**Slide 1 – Hook/Cover**', 'Prompt: ...', 'Caption-Vorschlag:...')"
              rows={7}
              className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-[#FF4D17] focus:outline-none resize-y leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* ── Flow & Visual Action Control Bar ────────────────────────── */}
      {promptItems.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-black/80 via-[#130E1D]/90 to-black/80 p-4 sm:p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">{batchTitle}</h2>
              <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                {promptItems.length} Slides erkannt
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span>Status:</span>
              <span className={cn("font-semibold", renderedCount === promptItems.length ? "text-emerald-400" : "text-amber-400")}>
                {renderedCount} von {promptItems.length} Bildern gerendert
              </span>
              {batchProgressText && (
                <span className="text-[#FF6A1F] animate-pulse">· {batchProgressText}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1-Click Flow Trigger */}
            {isBatchGenerating ? (
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-300 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generierung stoppen</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] hover:scale-[1.02] active:scale-[0.98] text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>🚀 Alle {promptItems.length} Bilder mit 1 Klick erstellen</span>
              </button>
            )}

            {/* ZIP Export */}
            {renderedCount > 0 && (
              <button
                type="button"
                onClick={handleExportZip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
                title="Alle gerenderten Bilder als ZIP laden"
              >
                <Download className="h-4 w-4 text-zinc-400" />
                <span>ZIP ({renderedCount})</span>
              </button>
            )}

            {/* Schedule Button */}
            <button
              type="button"
              onClick={handle1ClickSchedule}
              disabled={isScheduled}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg",
                isScheduled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25",
              )}
            >
              {isScheduled ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Bereits im Planer</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>Im Planer vorplanen</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Grid of Recognized Prompts with Visual Frame & Neu-Generieren Button ── */}
      {promptItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {promptItems.map((item) => {
            const isExpanded = expandedPromptIds.has(item.id);
            const isRendering = item.isGenerating;

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-[#0E0B14]/90 p-4 space-y-3 relative group hover:border-[#FF4D17]/40 transition-all flex flex-col justify-between shadow-lg"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-6 px-2 rounded-lg bg-white/10 text-[10px] font-bold text-white flex items-center font-mono">
                      #{item.slideNumber}
                    </span>
                    <span className="text-[11px] font-bold text-[#FF6A1F] uppercase tracking-wider truncate max-w-[120px]">
                      {item.roleLabel}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {item.status === "done" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Fertig
                    </span>
                  )}
                  {item.status === "generating" && (
                    <span className="flex items-center gap-1 rounded-full bg-[#FF4D17]/10 border border-[#FF4D17]/30 px-2 py-0.5 text-[10px] font-bold text-[#FF6A1F]">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      {item.progress || 15}%
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      Fehler
                    </span>
                  )}
                  {item.status === "idle" && (
                    <span className="text-[10px] text-zinc-500 font-mono">Bereit</span>
                  )}
                </div>

                {/* ── Visual Frame (4:5 Aspect Ratio) ────────────────── */}
                <div className="relative aspect-[4/5] rounded-2xl bg-zinc-950 overflow-hidden border border-white/10 group/img">
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.headline}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      />
                      {/* Hover overlay to preview full image */}
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(item.imageUrl!)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-semibold cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Vergrößern</span>
                      </button>
                    </>
                  ) : isRendering ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-black text-center space-y-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-2 border-[#FF4D17]/30 border-t-[#FF4D17] animate-spin" />
                        <Sparkles className="h-5 w-5 text-[#FF6A1F] absolute inset-0 m-auto" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Generiere 4K Visual...</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.progress || 10}% abgeschlossen</p>
                      </div>
                      <div className="w-3/4 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] transition-all duration-300"
                          style={{ width: `${item.progress || 10}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-b from-[#14101D] to-black text-zinc-400">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">
                          Extrahierter Visual-Prompt
                        </span>
                        <p className="text-[11px] text-zinc-300 italic line-clamp-5 leading-relaxed">
                          &quot;{item.prompt}&quot;
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                        <ImageIcon className="h-3.5 w-3.5 text-zinc-600" />
                        <span>Wartet auf 1-Klick Start</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content & Inline Edit */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={item.headline}
                    onChange={(e) => updateItem(item.id, { headline: e.target.value })}
                    className="w-full bg-transparent text-xs font-bold text-white border-b border-transparent focus:border-[#FF4D17] focus:outline-none transition-colors"
                    placeholder="Headline"
                  />
                  <textarea
                    value={item.subtext}
                    onChange={(e) => updateItem(item.id, { subtext: e.target.value })}
                    rows={2}
                    className="w-full bg-transparent text-[11px] text-zinc-400 border-b border-transparent focus:border-[#FF4D17] focus:outline-none resize-none transition-colors"
                    placeholder="Subtext"
                  />
                </div>

                {/* ── Actions on Card: Neu generieren & Prompt Edit ───── */}
                <div className="pt-2 border-t border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* Dedicated NEU GENERIEREN Button */}
                    <button
                      type="button"
                      onClick={() => handleRegenerateSingle(item.id)}
                      disabled={isRendering || isBatchGenerating}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#FF4D17]/40 hover:bg-[#FF4D17]/10 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      title="Generiert dieses Bild mit dem aktuellen Prompt neu"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5 text-[#FF6A1F]", isRendering && "animate-spin")} />
                      <span>{item.imageUrl ? "Neu generieren" : "Jetzt rendern"}</span>
                    </button>

                    {/* Toggle Prompt Edit */}
                    <button
                      type="button"
                      onClick={() => togglePromptExpanded(item.id)}
                      className={cn(
                        "p-2 rounded-xl border transition-colors cursor-pointer",
                        isExpanded
                          ? "border-[#FF4D17] bg-[#FF4D17]/10 text-white"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:text-white",
                      )}
                      title="Visual-Prompt bearbeiten"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expandable Prompt Textarea */}
                  {isExpanded && (
                    <div className="pt-1.5 space-y-1 animate-in fade-in-50">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Visual Prompt anpassen:
                      </label>
                      <textarea
                        value={item.prompt}
                        onChange={(e) => updateItem(item.id, { prompt: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-black/60 p-2 text-[10px] font-mono text-zinc-300 focus:border-[#FF4D17] focus:outline-none resize-y"
                      />
                    </div>
                  )}

                  {/* Error display if any */}
                  {item.errorMessage && (
                    <p className="text-[10px] text-red-400 bg-red-500/10 rounded-lg p-1.5 border border-red-500/20">
                      {item.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty State if no prompt block parsed ───────────────────── */}
      {promptItems.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#FF4D17]/20 to-[#6D28D9]/20 border border-white/10 flex items-center justify-center mx-auto text-[#FF6A1F]">
            <Layers className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Noch keine Prompts geladen</h3>
            <p className="text-xs text-zinc-400">
              Kopiere oben deinen Claude-Textblock rein oder klicke auf einen der Beispiel-Buttons, um alle Prompts automatisch zu zerlegen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRawTextBlock(EXAMPLE_CLAUDE_CAROUSEL);
              handleParseBlock(EXAMPLE_CLAUDE_CAROUSEL);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white shadow-xl shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Claude-Beispiel ausprobieren</span>
          </button>
        </div>
      )}

      {/* ── Image Preview Zoom Modal ─────────────────────────────────── */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-[#FF4D17] transition-colors p-2"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
