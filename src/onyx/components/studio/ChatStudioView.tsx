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
import { parseBlock } from "@/onyx/parse-prompt-block";
import { getSlideRoleSequence } from "@/onyx/story-service";

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
  onSetSlides?: (slides: SlideContent[]) => void;
  onUpdateSlide: (id: string, patch: Partial<SlideContent>) => void;
  onGenerateStoryboard: () => Promise<void>;
  isGeneratingStoryboard: boolean;
  onRenderImages: () => Promise<void>;
  isRenderingImages: boolean;
  onReset: () => void;
  onExportZip: () => void;
  brandKit: BrandKit;
  settings: ApiSettings;
  onChangeSettings?: (patch: Partial<ApiSettings>) => void;
}

async function callGeminiForHooksAndOutline(
  topic: string,
  apiKey: string,
  slideCount: number,
): Promise<{
  replyText: string;
  hookOptions: { id: string; archetype: string; label: string; hook: string }[];
  suggestedOutline: string[];
} | null> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return null;

  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  const systemPrompt = `Du bist ein Social-Media-Karussell-Experte für virale Hochformat-Karussells (4:5).
Aufgabe: Analysiere das Thema und erstelle 3 extrem starke, psychologische Hook-Ideen und eine ${slideCount}-teilige Folien-Gliederung.
Thema: "${topic}"

Antworte STRIKT als valides JSON in exakt dieser Struktur:
{
  "replyText": "1 treffender, motivierender Satz zur Themenwahl",
  "hookOptions": [
    {
      "id": "hook-1",
      "archetype": "Provokant",
      "label": "Scroll-Stopper",
      "hook": "Erster Hook..."
    },
    {
      "id": "hook-2",
      "archetype": "Case Study",
      "label": "Erfahrungsbericht",
      "hook": "Zweiter Hook..."
    },
    {
      "id": "hook-3",
      "archetype": "Zahlen & Fakten",
      "label": "Autoritäts-Hook",
      "hook": "Dritter Hook..."
    }
  ],
  "suggestedOutline": [
    "Folie 1: Hook & Aufhänger",
    "Folie 2: Der typische Fehler",
    "Folie 3: Der Perspektivenwechsel",
    "Folie 4: Schritt 1",
    "Folie 5: Schritt 2",
    "Folie 6: Key Takeaway",
    "Folie 7: Speichern & CTA"
  ]
}`;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.hookOptions) && parsed.hookOptions.length > 0) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
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
  onSetSlides,
  onUpdateSlide,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  onRenderImages,
  isRenderingImages,
  onReset,
  onExportZip,
  brandKit,
  settings,
  onChangeSettings,
}: ChatStudioViewProps) {
  const [inputText, setInputText] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.geminiApiKey || "");

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("onyx.chatStudioMessages");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [
      {
        id: "msg-init",
        sender: "assistant",
        text: "Hi! Worüber möchtest du heute ein Karussell erstellen? Schreib mir einfach dein Thema, ein Problem deiner Zielgruppe oder deinen Gedanken — ich erstelle es für dich!\n\n💡 Tipp: Du kannst auch einen fertigen Prompt-Block von Claude oder ChatGPT direkt hier reinkopieren!",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 100% Local-First Storage (Zero Supabase DB costs!)
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("onyx.chatStudioMessages", JSON.stringify(messages));
      }
    } catch {}
  }, [messages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGeneratingStoryboard, isAskingAi]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // 1. Check if user pasted a structured Claude or Markdown carousel block
    const detectedCarousels = parseBlock(text);
    if (detectedCarousels.length > 0 && detectedCarousels.some((c) => c.slides.length > 0)) {
      const c = detectedCarousels[0];
      const roleSequence = getSlideRoleSequence(c.slides.length);
      const newSlides: SlideContent[] = c.slides.map((s, idx) => {
        return {
          id: `slide-${Date.now()}-${idx}`,
          slideNumber: s.slideNumber || idx + 1,
          role: roleSequence[idx] || (idx === 0 ? "hook" : idx === c.slides.length - 1 ? "closing" : "concept"),
          roleLabel: s.title || `Folie ${idx + 1}`,
          headline: s.headline || s.title,
          subtext: s.subtext || "",
          badge: s.slideNumber === 1 ? "KOMMUNIKATION" : `FEHLER 0${idx}`,
          visualPrompt: s.prompt || "",
          coreMetaphor: s.headline || c.title || "",
          primaryProps: [],
          renderStatus: "idle",
        };
      });

      if (onSetSlides) {
        onSetSlides(newSlides);
      }
      onChangeBrief({
        topic: c.title,
        slideCount: c.slides.length,
      });

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: text.length > 250 ? `${text.slice(0, 180)}...\n\n[📋 Claude-Prompt-Block mit ${c.slides.length} Slides erkannt]` : text,
        createdAt: new Date().toISOString(),
      };

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        sender: "assistant",
        text: `🚀 Perfekt! Ich habe dein fertiges Claude-Karussell erkannt: "${c.title}" mit ${c.slides.length} Folien!\n\nAlle Folientexte und 3D-Bildprompts wurden direkt in dein Karussell geladen. Du kannst die Folien unten in der Vorschau bearbeiten oder direkt auf "Bilder rendern" klicken!`,
        topic: c.title,
        suggestedOutline: c.slides.map((s) => `${s.title}: ${s.headline}`),
        readyForGeneration: false,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInputText("");
      toast.success(`${c.slides.length} Folien aus Claude-Prompt erfolgreich importiert! 🎉`);
      return;
    }

    // 2. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    onChangeBrief({ topic: text });
    setInputText("");

    // 3. If Gemini API key is configured, call Gemini LIVE
    if (settings?.geminiApiKey?.trim()) {
      setIsAskingAi(true);
      setMessages((prev) => [...prev, userMsg]);

      void (async () => {
        try {
          const geminiRes = await callGeminiForHooksAndOutline(
            text,
            settings.geminiApiKey,
            brief.slideCount || 7,
          );

          if (geminiRes) {
            const botMsg: ChatMessage = {
              id: `assistant-${Date.now() + 1}`,
              sender: "assistant",
              text: geminiRes.replyText || `Starkes Thema! Für "${text}" habe ich live 3 virale Hook-Ansätze generiert:`,
              topic: text,
              hookOptions: geminiRes.hookOptions,
              suggestedOutline: geminiRes.suggestedOutline,
              readyForGeneration: true,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, botMsg]);
            return;
          }
        } catch (err) {
          console.warn("Gemini call error:", err);
        } finally {
          setIsAskingAi(false);
        }

        // Fallback if Gemini failed
        const fallbackMsg: ChatMessage = {
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
        setMessages((prev) => [...prev, fallbackMsg]);
      })();
      return;
    }

    // 4. Default algorithmic response when no Gemini key is provided
    const botMsg: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      sender: "assistant",
      text: `Starkes Thema! Für "${text}" habe ich 3 virale Hook-Ansätze entwickelt. Welcher gefällt dir am besten?\n\n💡 Tipp: Hinterlege oben deinen Gemini API-Key, um Live-KI-Antworten direkt von Google Gemini zu erhalten!`,
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

  const hasGemini = Boolean(settings?.geminiApiKey?.trim());

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[900px] rounded-3xl border border-white/10 bg-[#0C0912]/80 backdrop-blur-2xl overflow-hidden shadow-2xl relative">
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
          {/* Gemini API Key Trigger Badge */}
          <button
            type="button"
            onClick={() => {
              setTempApiKey(settings.geminiApiKey || "");
              setShowKeyModal(true);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
              hasGemini
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20",
            )}
            title="Gemini API Key verwalten"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{hasGemini ? "Gemini Live aktiv" : "Gemini verbinden"}</span>
          </button>

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
              localStorage.removeItem("onyx.chatStudioMessages");
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

        {isAskingAi && (
          <div className="flex gap-3 max-w-2xl animate-in fade-in-50">
            <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-md bg-[#FF4D17]/20 border border-[#FF4D17]/40 text-[#FF6A1F]">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl p-4 text-sm leading-relaxed bg-white/[0.04] border border-white/10 text-zinc-300 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#FF6A1F] animate-spin" />
              <span>Gemini analysiert dein Thema und generiert virale Hooks...</span>
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

      {/* ── Gemini Key Setup Modal ────────────────────────────────────── */}
      {showKeyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0D0B14] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#FF4D17]" />
                <h3 className="text-base font-bold text-white">Google Gemini API-Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Mit deinem Gemini API-Key antwortet der Chat Studio Assistent in Echtzeit mit maßgeschneiderten Hooks und Gliederungen direkt von Google Gemini.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                API-Key (Google AI Studio)
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono text-white focus:border-[#FF4D17] focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500">
                Kostenlosen Key erstellen auf{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#FF6A1F] hover:underline"
                >
                  aistudio.google.com/apikey
                </a>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeSettings?.({ geminiApiKey: tempApiKey.trim() });
                  setShowKeyModal(false);
                  toast.success("Gemini API-Key erfolgreich gespeichert! 🟢");
                }}
                className="px-5 py-2 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
