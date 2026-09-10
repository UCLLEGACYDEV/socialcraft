/**
 * ONYX / Socialcraft Viral Caption Generator Engine
 * Powered by Google Gemini AI (100% Free / Ultra-Fast)
 * 
 * Generates viral, SEO-optimized social media captions tailored to topic and audience.
 * Strictly adheres to:
 * 1. High-engagement scroll-stopping Hook
 * 2. Clear, digestible value story with line breaks
 * 3. Strong Call-to-Action (CTA)
 * 4. 3 to 5 targeted algorithm SEO hashtags
 * 5. NO Gedankenstriche (no hyphens/en-dashes/em-dashes used as punctuation or bullet lists)
 */

export interface CaptionGenerationOptions {
  topic: string;
  platform?: "instagram" | "tiktok" | "facebook" | "linkedin" | "youtube" | "general";
  tone?: "viral" | "expert" | "storytelling" | "provocative" | "relatable";
  audience?: string;
  slideSummaries?: string[];
  apiKey?: string;
  customInstructions?: string;
}

export interface CaptionResult {
  success: boolean;
  caption: string;
  hook: string;
  hashtags: string[];
  provider: "gemini" | "algorithmic_fallback";
  error?: string;
}

/**
 * Filter to strictly remove any Gedankenstriche (–, —, -) and replace with clean typography or emojis
 */
export function sanitizeNoGedankenstriche(text: string): string {
  if (!text) return "";
  
  const cleaned = text
    // Replace bullet dashes at line start (e.g., "- Punkt", "– Punkt", "— Punkt")
    .replace(/^[\s]*[-–—]\s+/gm, "• ")
    // Replace inline Gedankenstriche surrounded by spaces (e.g. "Problem – Lösung" -> "Problem: Lösung" or "Problem | Lösung")
    .replace(/\s+[–—]\s+/g, ": ")
    .replace(/\s+-\s+/g, ": ")
    // Remove stray em/en dashes
    .replace(/[–—]/g, "");

  return cleaned.trim();
}

/**
 * Main Gemini AI Caption Generation Function
 */
export async function generateViralCaption(options: CaptionGenerationOptions): Promise<CaptionResult> {
  const {
    topic,
    platform = "instagram",
    tone = "viral",
    audience = "",
    slideSummaries = [],
    apiKey = "",
    customInstructions = "",
  } = options;

  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      caption: "",
      hook: "",
      hashtags: [],
      provider: "algorithmic_fallback",
      error: "Kein Thema angegeben.",
    };
  }

  // 1. If Gemini API Key is provided, call Google Gemini 1.5/2.0 Flash REST API
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `Du bist ein weltklasse Social-Media-Stratege, Copywriter und Viral-Experte.
Erstelle eine extrem virale, SEO-optimierte Caption auf Deutsch für die Plattform: ${platform.toUpperCase()}.

THEMA / TITEL: "${topic}"
${audience ? `ZIELGRUPPE: "${audience}"` : ""}
${tone ? `TONALITÄT: "${tone}"` : ""}
${slideSummaries.length > 0 ? `INHALTE DER FOLIEN:\n${slideSummaries.map((s, i) => `Folie ${i + 1}: ${s}`).join("\n")}` : ""}
${customInstructions ? `ZUSATZWUNSCH: "${customInstructions}"` : ""}

STRIKTE FORMATIERUNGSREGELN (EINHALTUNG ZWINGEND ERFORDERLICH):
1. **VIRALER HOOK (1-2 Zeilen)**: Beginne mit einem packenden Hook, der sofort den Daumen im Feed stoppt. Keine langweiligen Begrüßungen wie "Hallo ihr Lieben".
2. **MEHRWERT & INSIGHTS**: Schreibe in kurzen, luftigen Absätzen mit Zeilenumbrüchen. Maximal 120-180 Wörter.
3. **CALL-TO-ACTION (CTA)**: Ein klarer Aufruf zur Interaktion (z. B. "Speichere diesen Beitrag für deinen nächsten Pitch 📌" oder "Schreib 'READY' in die Kommentare").
4. **HASHTAGS**: Füge ganz am Ende genau 3 bis 5 hochrelevante, SEO-starke Hashtags ein (z. B. #SocialMediaTipps #Wachstum #B2BSales).
5. **ABSOLUTES VERBOT VON GEDANKENSTRICHEN**: Verwende KEINE Gedankenstriche (weder '–' noch '—' noch Bindestriche '- ' für Aufzählungen oder Einschübe). Verwende für Aufzählungen Emojis (wie 🔹, 👉, 📌, 💡) oder Nummerierungen (1., 2., 3.) oder Doppelpunkte (:).

Gib NUR die fertige Caption ohne Metadaten oder Vorworte aus.`;

      // Models to try in order of capability & speed
      const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      let rawText = "";
      let lastError = "";

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.75,
                topP: 0.95,
                maxOutputTokens: 800,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidate && candidate.trim()) {
              rawText = candidate.trim();
              break;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            lastError = errData?.error?.message || `HTTP ${res.status}`;
          }
        } catch (e) {
          lastError = e instanceof Error ? e.message : "Netzwerkfehler";
        }
      }

      if (rawText) {
        // Enforce strict filter "ohne Gedankenstriche"
        const cleanCaption = sanitizeNoGedankenstriche(rawText);
        const lines = cleanCaption.split("\n").filter((l) => l.trim());
        const hook = lines[0] || topic;
        const hashtags = (cleanCaption.match(/#[\w\u00C0-\u017F]+/g) || []).slice(0, 5);

        return {
          success: true,
          caption: cleanCaption,
          hook,
          hashtags,
          provider: "gemini",
        };
      } else {
        console.warn(`[CaptionGenerator] Gemini API Error (${lastError}), falling back to algorithmic viral engine.`);
      }
    } catch (err) {
      console.warn("[CaptionGenerator] Exception during Gemini fetch:", err);
    }
  }

  // 2. High-Converting Algorithmic Fallback Engine (SEO & Viral Structure)
  const algorithmicCaption = generateAlgorithmicViralCaption(topic, platform, audience);
  const cleanFallback = sanitizeNoGedankenstriche(algorithmicCaption);
  const fallbackHashtags = (cleanFallback.match(/#[\w\u00C0-\u017F]+/g) || []).slice(0, 5);

  return {
    success: true,
    caption: cleanFallback,
    hook: topic,
    hashtags: fallbackHashtags,
    provider: "algorithmic_fallback",
  };
}

/**
 * Built-in High-Converting Fallback Caption Generator
 */
function generateAlgorithmicViralCaption(topic: string, platform: string, audience: string): string {
  const cleanTitle = topic.replace(/^Thema:\s*/i, "").trim();
  const ctaMap: Record<string, string> = {
    tiktok: "Speichere das Video & folge für tägliche Strategien 🚀",
    instagram: "Speichere diesen Beitrag für später & teile ihn mit deinem Team 📌",
    linkedin: "Was ist deine Erfahrung damit? Lass es mich in den Kommentaren wissen 👇",
    facebook: "Lass ein Like da & teile den Beitrag mit jemandem, der das heute hören muss 💡",
  };
  const cta = ctaMap[platform] || "Speichere diesen Beitrag für später 📌";

  const hashtags = generateRelevantHashtags(cleanTitle);

  return `${cleanTitle} 🔥

Die meisten machen hier den gleichen Fehler: Sie setzen auf veraltete Methoden, statt die Hebelwirkung moderner Workflows zu nutzen.

Hier sind die 3 wichtigsten Erkenntnisse:

1. Fokus auf messbare Ergebnisse statt blinde Aktivität
2. Klare Prozesse schaffen Freiheit und skalierbares Wachstum
3. Konsistenz schlägt Talent jedes einzelne Mal

${audience ? `Perfekt für alle ${audience}, die ihr nächstes Level erreichen wollen.` : "Setze das heute um und spüre den Unterschied."}

${cta}

${hashtags.join(" ")}`;
}

/**
 * Intelligent SEO Hashtag Generator
 */
function generateRelevantHashtags(topic: string): string[] {
  const lower = topic.toLowerCase();
  const tags: string[] = ["#ContentCreation"];

  if (lower.includes("sales") || lower.includes("verkauf") || lower.includes("b2b")) {
    tags.push("#B2BSales", "#Vertrieb", "#Skalierung", "#BusinessGrowth");
  } else if (lower.includes("fit") || lower.includes("gym") || lower.includes("training")) {
    tags.push("#FitnessMotivation", "#Disziplin", "#GymLife", "#HealthHacks");
  } else if (lower.includes("ki") || lower.includes("ai") || lower.includes("tech")) {
    tags.push("#KIGeneration", "#AITools", "#TechTrends", "#Automatisierung");
  } else if (lower.includes("finanz") || lower.includes("krypto") || lower.includes("geld")) {
    tags.push("#FinanzielleFreiheit", "#WealthBuilding", "#Investment", "#Mindset");
  } else if (lower.includes("fokus") || lower.includes("mindset") || lower.includes("gewohnheit")) {
    tags.push("#MindsetShift", "#HighPerformance", "#Disziplin", "#Erfolg");
  } else {
    tags.push("#SocialMediaMarketing", "#InstagramTipps", "#CreatorEconomy", "#ViralContent");
  }

  return tags.slice(0, 5);
}
