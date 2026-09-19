import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Download,
  Flame,
  MessageSquareQuote,
  BarChart3,
  RefreshCw,
  Layers,
  Edit3,
  Bot,
  User,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BriefValues, SlideContent, BrandKit, ApiSettings } from "@/onyx/types";

interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  hookOptions?: { id: string; label: string; hook: string; archetype: string }[];
  suggestedOutline?: string[];
  readyForGeneration?: boolean;
  topic?: string;
  createdAt: string;
}

interface ChatStudioViewProps {
  brief: BriefValues;
  onChangeBrief: (patch: Partial<BriefValues>) => void;
  slides: SlideContent[];
  onUpdateSlide: (id: string, patch: Partial<SlideContent>) => void;
  onGenerateStoryboard: () => Promise<void>;
  isGeneratingStoryboard: boolean;
  onRenderImages: () => Promise<void>;
  isRenderingImages: boolean;
  onReset: () => void;
  onExportZip: () => void;
  brandKit: BrandKit;
  settings: ApiSettings;
}

const INSPIRATION_PILLS = [
  "3 fatale Fehler beim B2B-Verkauf",
  "Wie man in 90 Tagen von 0 auf 10k wächst",
  "Warum die meisten bei Content Marketing scheitern",
  "5 KI-Hacks, die 10 Stunden Arbeitszeit sparen",
];

export function ChatStudioView({
  brief,
  onChangeBrief,
  slides,
  onUpdateSlide,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  onRenderImages,
  isRenderingImages,
  onReset,
  onExportZip,
  brandKit,
}: ChatStudioViewProps) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "assistant",
      text: "Hi! Worüber möchtest du heute ein Karussell erstellen? Schreib mir einfach dein Thema, ein Problem deiner Zielgruppe oder deinen Gedanken — ich strukturiere es für dich!",
      createdAt: new Date().toISOString(),
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGeneratingStoryboard]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    // Update brief topic
    onChangeBrief({ topic: text });

    // 2. Generate simulated intelligent AI response with 3 hook options
    const botMsg: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      sender: "assistant",
      text: `Starkes Thema! Für "${text}" habe ich 3 virale Hook-Ansätze entwickelt. Welcher gefällt dir am besten?`,
      topic: text,
      hookOptions: [
        {
          id: "hook-1",
          archetype: "Provokant",
          label: "Scroll-Stopper",
          hook: `Hör auf damit: Die meisten machen diesen fatalen Fehler bei "${text}".`,
        },
        {
          id: "hook-2",
          archetype: "Case Study",
          label: "Erfahrungsbericht",
          hook: `Wie wir das Problem mit "${text}" in unter 30 Tagen gelöst haben:`,
        },
        {
          id: "hook-3",
          archetype: "Zahlen & Fakten",
          label: "Autoritäts-Hook",
          hook: `94% übersehen diesen einen Hebel für "${text}". Hier ist der Beweis:`,
        },
      ],
      suggestedOutline: [
        "Folie 1: Hook & Aufhänger",
        "Folie 2: Der typische Fehler",
        "Folie 3: Der Perspektivenwechsel",
        "Folie 4-5: Die 2 wichtigsten Schritte",
        "Folie 6: Zusammenfassung & Key Takeaway",
        "Folie 7: Speichern & Handeln (CTA)",
      ],
      readyForGeneration: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputText("");
  };

  const handleSelectHook = (hookText: string) => {
    onChangeBrief({ topic: hookText });
    setMessages((prev) => [
      ...prev,
      {
        id: `user-hook-${Date.now()}`,
        sender: "user",
        text: `Ich nehme diesen Hook: "${hookText}"`,
        createdAt: new Date().toISOString(),
      },
      {
        id: `assistant-ready-${Date.now() + 1}`,
        sender: "assistant",
        text: "Perfekt! Alles steht bereit. Klicke jetzt auf 'Karussell generieren (Go)', um das Storyboard und alle Folien zu erzeugen!",
        readyForGeneration: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[900px] rounded-3xl border border-white/10 bg-[#0C0912]/80 backdrop-blur-2xl overflow-hidden shadow-2xl">
      {/* ── Chat Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#FF4D17] to-[#FF8C00] p-[1px] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <div className="h-full w-full rounded-[11px] bg-[#0A0710] flex items-center justify-center">
              <Bot className="h-4 w-4 text-[#FF4D17]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Socialcraft Karussell-Assistent</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Chat
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Sag mir, was du brauchst — ich formatiere es in fertige Slides</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <span className="text-zinc-400 px-2">Länge:</span>
            {[4, 7, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChangeBrief({ slideCount: num })}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                  brief.slideCount === num
                    ? "bg-[#FF4D17] text-white"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {num} Slides
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onReset();
              setMessages([
                {
                  id: "msg-init",
                  sender: "assistant",
                  text: "Hi! Worüber möchtest du heute ein Karussell erstellen? Schreib mir einfach dein Thema, ein Problem deiner Zielgruppe oder deinen Gedanken.",
                  createdAt: new Date().toISOString(),
                },
              ]);
            }}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Chat zurücksetzen"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Messages Stream ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => {
          const isAssistant = msg.sender === "assistant";
          return (
            <div
              key={msg.id}
              className={cn("flex gap-3 max-w-2xl animate-in fade-in-50", isAssistant ? "" : "ml-auto flex-row-reverse")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-md",
                  isAssistant
                    ? "bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[#FF6A1F]"
                    : "bg-zinc-800 border border-white/20 text-white",
                )}
              >
                {isAssistant ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-3">
                <div
                  className={cn(
                    "rounded-2xl p-4 text-sm leading-relaxed",
                    isAssistant
                      ? "bg-white/[0.04] border border-white/10 text-zinc-200"
                      : "bg-[#FF4D17] text-white font-medium shadow-lg shadow-orange-500/20",
                  )}
                >
                  {msg.text}
                </div>

                {/* Hook Options if present */}
                {msg.hookOptions && msg.hookOptions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Wähle deinen Hook:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.hookOptions.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectHook(opt.hook)}
                          className="group p-3 rounded-xl border border-white/10 bg-black/40 hover:border-[#FF4D17] hover:bg-[#FF4D17]/5 transition-all cursor-pointer text-left space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6A1F]">
                              {opt.archetype} · {opt.label}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-[#FF4D17] group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-xs text-white font-medium">{opt.hook}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Outline if present */}
                {msg.suggestedOutline && (
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Vorgeschlagene Folien-Struktur ({brief.slideCount} Slides):
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {msg.suggestedOutline.slice(0, brief.slideCount).map((step, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Go / Generate Trigger if ready */}
                {msg.readyForGeneration && (
                  <button
                    type="button"
                    onClick={() => void onGenerateStoryboard()}
                    disabled={isGeneratingStoryboard}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4D17] to-[#FF8C00] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {isGeneratingStoryboard ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Storyboard & Folien werden generiert...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Karussell jetzt generieren (Go)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Generated Slides Preview if slides exist */}
        {slides.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#FF4D17]" />
                  <span>Generierte Folien ({slides.length} Slides)</span>
                </h3>
                <p className="text-xs text-zinc-400">Texte können vor dem Rendern direkt angepasst werden</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onRenderImages()}
                  disabled={isRenderingImages}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Sparkles className={cn("h-3.5 w-3.5", isRenderingImages && "animate-spin")} />
                  <span>{isRenderingImages ? "Rendere 4K Bilder..." : "Bilder rendern"}</span>
                </button>

                <button
                  type="button"
                  onClick={onExportZip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-zinc-400" />
                  <span>ZIP</span>
                </button>
              </div>
            </div>

            {/* Slides horizontal scroll */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {slides.map((s, idx) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-black/50 p-3.5 space-y-2.5 relative group hover:border-[#FF4D17]/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Folie {idx + 1}</span>
                    <span className="uppercase text-[#FF6A1F] font-bold">{s.role}</span>
                  </div>

                  {/* Image or concept */}
                  <div className="aspect-[4/5] rounded-xl bg-zinc-900 overflow-hidden border border-white/10 relative">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.headline} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full p-3 flex flex-col justify-between text-[11px] text-zinc-400 bg-gradient-to-br from-zinc-900 to-black">
                        <span className="text-[9px] uppercase tracking-wider font-mono text-[#FF4D17]">
                          Visuelles Konzept
                        </span>
                        <p className="line-clamp-4 italic text-zinc-300">&quot;{s.visualPrompt}&quot;</p>
                        <span className="text-[10px] text-zinc-500">Bereit zum Rendern</span>
                      </div>
                    )}
                  </div>

                  {/* Inline editable text */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={s.headline}
                      onChange={(e) => onUpdateSlide(s.id, { headline: e.target.value })}
                      className="w-full bg-transparent text-xs font-bold text-white border-b border-transparent focus:border-[#FF4D17] focus:outline-none"
                    />
                    <textarea
                      value={s.subtext}
                      onChange={(e) => onUpdateSlide(s.id, { subtext: e.target.value })}
                      rows={2}
                      className="w-full bg-transparent text-[11px] text-zinc-400 resize-none border-b border-transparent focus:border-[#FF4D17] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* ── Chat Input Footer ───────────────────────────────────────── */}
      <div className="p-4 border-t border-white/[0.08] bg-black/60 space-y-3">
        {/* Quick Inspiration Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">
            Ideen:
          </span>
          {INSPIRATION_PILLS.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(pill)}
              className="shrink-0 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] p-2 focus-within:border-[#FF4D17] transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Schreib dem Assistenten dein Thema oder einen Gedanken..."
            rows={1}
            className="flex-1 bg-transparent px-2 text-sm text-white placeholder-zinc-500 focus:outline-none resize-none min-h-[24px]"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0",
              inputText.trim()
                ? "bg-[#FF4D17] text-white hover:bg-[#FF6A1F] shadow-lg shadow-orange-500/30"
                : "bg-white/5 text-zinc-500 cursor-not-allowed",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
