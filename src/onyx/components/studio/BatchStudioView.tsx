import React, { useState } from "react";
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
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ScheduledPost, SocialChannel, ApiSettings } from "@/onyx/types";
import { parseBlock } from "@/onyx/parse-prompt-block";

interface ParsedBatchPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  slideCount: number;
  scheduledForDay: string;
}

interface BatchStudioViewProps {
  socialChannels: SocialChannel[];
  onSchedulePosts: (posts: ScheduledPost[]) => void;
  settings: ApiSettings;
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

export function BatchStudioView({
  socialChannels,
  onSchedulePosts,
  settings,
}: BatchStudioViewProps) {
  const [rawTextBlock, setRawTextBlock] = useState("");
  const [parsedPosts, setParsedPosts] = useState<ParsedBatchPost[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);

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

    const now = new Date();

    // 1. Try structured carousel parsing first (exact Claude / ChatGPT format)
    const structuredCarousels = parseBlock(text);
    if (structuredCarousels.length > 0 && structuredCarousels.some((c) => c.slides.length > 0)) {
      const results: ParsedBatchPost[] = structuredCarousels.map((c, idx) => {
        const postDate = new Date(now.getTime() + (idx + 1) * 86400000);
        postDate.setHours(9, 0, 0, 0);

        const hashtags = c.caption
          ? c.caption.match(/#\w+/g) || ["#Socialcraft", "#Karussell"]
          : ["#Socialcraft", "#Karussell"];

        const captionClean = c.caption
          ? c.caption.replace(/#\w+/g, "").trim()
          : c.slides[0]?.subtext || c.title;

        return {
          id: `batch-${Date.now()}-${idx}`,
          title: c.title || `Karussell ${idx + 1}`,
          caption: captionClean,
          hashtags,
          slideCount: c.slides.length || 7,
          scheduledForDay: postDate.toLocaleDateString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          }),
        };
      });

      setParsedPosts(results);
      setIsScheduled(false);
      toast.success(`${results.length} vollständige Karussells aus Claude-Format extrahiert! 🎉`);
      return;
    }

    // 2. Fallback to generic chunk split
    const chunks = text
      .split(/(?:---+|(?=###\s*Post|\bPost\s*\d+:?))/i)
      .map((c) => c.trim())
      .filter((c) => c.length > 20);

    const results: ParsedBatchPost[] = chunks.map((chunk, idx) => {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      const titleLine = lines[0]?.replace(/^#+\s*/, "").replace(/^Post\s*\d+:?\s*/i, "") || `Post ${idx + 1}`;
      const captionLines = lines.slice(1).filter((l) => !l.toLowerCase().startsWith("hashtags:"));
      const hashtagLine = lines.find((l) => l.toLowerCase().startsWith("hashtags:"));

      const hashtags = hashtagLine
        ? hashtagLine.replace(/^hashtags:\s*/i, "").split(/\s+/).filter((t) => t.startsWith("#"))
        : ["#Socialcraft", "#BatchContent"];

      const postDate = new Date(now.getTime() + (idx + 1) * 86400000);
      postDate.setHours(9, 0, 0, 0);

      return {
        id: `batch-${Date.now()}-${idx}`,
        title: titleLine,
        caption: captionLines.join("\n"),
        hashtags,
        slideCount: 6,
        scheduledForDay: postDate.toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }),
      };
    });

    setParsedPosts(results);
    setIsScheduled(false);
    toast.success(`${results.length} Beiträge erfolgreich aus Textblock extrahiert! 🎉`);
  };

  const handle1ClickSchedule = () => {
    if (parsedPosts.length === 0) return;

    const newScheduled: ScheduledPost[] = parsedPosts.map((p, idx) => {
      const postDate = new Date(Date.now() + (idx + 1) * 86400000);
      postDate.setHours(9, 0, 0, 0);

      return {
        id: p.id,
        title: p.title,
        caption: `${p.caption}\n\n${p.hashtags.join(" ")}`,
        hashtags: p.hashtags,
        mediaUrls: [],
        mediaType: "carousel",
        channelId: activeChannel.id,
        platform: activeChannel.platform,
        scheduledFor: postDate.toISOString(),
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
    });

    onSchedulePosts(newScheduled);
    setIsScheduled(true);
    toast.success(`Alle ${parsedPosts.length} Posts mit 1 Klick im Planer hinterlegt! 🚀`, {
      description: `Geplant für ${activeChannel.name} über die nächsten ${parsedPosts.length} Tage.`,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4D17] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4D17]">
              Massen-Content Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans mt-1">
            Batch Studio (Claude-Block & 1-Klick Planer)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Füge deinen generierten Textblock ein — Socialcraft unterteilt ihn automatisch in Beiträge und plant sie vor.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span>3-Post Serie</span>
          </button>
        </div>
      </div>

      {/* ── Block Input Card ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-[#0F0C15]/80 p-6 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Prompt- / Content-Block einfügen:
          </label>
          <span className="text-[11px] font-mono text-zinc-500">
            Erkennt Trenner wie &quot;---&quot;, &quot;### Post 1&quot;, etc.
          </span>
        </div>

        <textarea
          value={rawTextBlock}
          onChange={(e) => setRawTextBlock(e.target.value)}
          placeholder="Füge hier deinen Textblock aus Claude oder ChatGPT ein..."
          rows={7}
          className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 text-xs font-mono text-white placeholder-zinc-600 focus:border-[#FF4D17] focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setRawTextBlock("")}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Feld leeren
          </button>

          <button
            type="button"
            onClick={() => handleParseBlock()}
            disabled={!rawTextBlock.trim()}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg cursor-pointer",
              !rawTextBlock.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] hover:scale-[1.01] shadow-orange-500/20",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Block in Beiträge unterteilen</span>
          </button>
        </div>
      </div>

      {/* ── Parsed Posts Grid & 1-Click Scheduling ──────────────────── */}
      {parsedPosts.length > 0 && (
        <div className="space-y-4 pt-2 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {parsedPosts.length} Beiträge erfolgreich vorbereitet
                </h3>
                <p className="text-xs text-zinc-400">
                  Ziel-Kanal: <strong className="text-white">{activeChannel.name}</strong> ({activeChannel.platform})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handle1ClickSchedule}
              disabled={isScheduled}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white shadow-xl transition-all cursor-pointer whitespace-nowrap",
                isScheduled
                  ? "bg-emerald-600 cursor-default"
                  : "bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] hover:scale-[1.02] shadow-orange-500/25",
              )}
            >
              {isScheduled ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Bereits im Kalender eingeplant!</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>🚀 Mit 1 Klick alle vorplanen</span>
                </>
              )}
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parsedPosts.map((post, idx) => (
              <div
                key={post.id}
                className="rounded-2xl border border-white/10 bg-[#0F0C15]/70 p-5 space-y-3 relative group hover:border-[#FF4D17]/40 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#FF6A1F] font-bold">Post #{idx + 1}</span>
                    <span className="flex items-center gap-1 text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>{post.scheduledForDay}, 09:00</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{post.title}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">{post.caption}</p>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-mono">{post.hashtags.slice(0, 2).join(" ")}</span>
                  <span className="text-emerald-400 font-medium">Bereit zum Vorplanen</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
