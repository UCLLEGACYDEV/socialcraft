import type {
  GenerateContentParams,
  IAiProvider,
  RerollPromptParams,
} from "./types";
import type { SlideContent, SlideRole, StructuredCarouselResponse } from "../../onyx/types";
import {
  generateAlgorithmicStoryboard,
  getSlideRoleSequence,
  ROLE_LABELS,
  buildSlideVisualPrompt,
  STYLE_PROMPT_MAP,
  makeId,
} from "../../onyx/story-service";
import { sanitizeNoGedankenstriche } from "../../onyx/caption-generator";

function resolveApiKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 10) {
    return customKey.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const envKey =
      process.env["GEMINI_API_KEY"] ||
      process.env["VITE_GEMINI_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];
    if (envKey && envKey.trim().length > 10) return envKey.trim();
  }
  return "";
}

export class GeminiAiProvider implements IAiProvider {
  name = "google-gemini";

  async generateContent(params: GenerateContentParams): Promise<StructuredCarouselResponse> {
    const topic = params.topic?.trim();
    if (!topic) {
      throw new Error("Ein gültiges Thema (topic) ist erforderlich.");
    }

    const slideCount = Math.max(2, Math.min(10, params.slideCount || 7));
    const effectiveKey = resolveApiKey(params.apiKey);
    const roleSequence = getSlideRoleSequence(slideCount);
    const brand = params.brandKit || {};
    const skill = params.skill;

    // If no key available, generate high-end algorithmic fallback immediately
    if (!effectiveKey) {
      const fallback = generateAlgorithmicStoryboard(
        {
          topic,
          audience: params.audience || "Ambitionierte Creator & Unternehmer",
          slideCount,
          designId: brand.accentStyle || "ember-ignite",
          ctaText: brand.ctaText,
          customInstructions: params.customInstructions,
        },
        ""
      );
      return {
        title: fallback.carousel.title,
        caption: fallback.carousel.caption,
        hashtags: fallback.carousel.hashtags,
        slides: fallback.carousel.slides,
        provider: "algorithmic-fallback (kein Gemini-Key hinterlegt)",
        skillUsed: skill?.name || "Standard System",
      };
    }

    const skillDirective = skill
      ? `\n\nKI-SKILL AKTIVIERT: "${skill.name}"\nTONALITÄT: ${skill.tone}\nSYSTEM-ANWEISUNG DES SKILLS: ${skill.systemPrompt}${
          skill.forbiddenWords && skill.forbiddenWords.length > 0
            ? `\nVERBOTENE WÖRTER: ${skill.forbiddenWords.join(", ")}`
            : ""
        }${skill.ctaStyle ? `\nCTA-STIL: ${skill.ctaStyle}` : ""}`
      : "";

    const brandDirective = `\n\nBRAND-KIT RICHTLINIEN:
- Handle: ${brand.handle || "@socialcraft"}
- Signatur-CTA: ${brand.ctaText || "Speichere dir diesen Post für später ab."}
- Seitenverhältnis: ${brand.aspectRatio || "4:5"}
- Akzent-Style: ${brand.accentStyle || "ember-ignite"}`;

    const prompt = `Du bist ein hochklassiger Social-Media-Creative-Director und Copywriter für virale Karussell-Posts (Instagram & LinkedIn).
Erstelle ein dramaturgisch meisterhaftes Karussell mit genau ${slideCount} Slides zum Thema:

THEMA: "${topic}"
ZIELGRUPPE: "${params.audience || "Creator, Gründer & Experten"}"
SLIDE-ANZAHL: ${slideCount}
FESTGELEGTE SLIDE-ROLLEN: ${roleSequence.join(", ")}
${params.customInstructions ? `ZUSATZWUNSCH: "${params.customInstructions}"` : ""}
${skillDirective}
${brandDirective}

STRIKTE QUALITÄTSREGELN:
1. ABSOLUTES VERBOT VON GEDANKENSTRICHEN:
   Verwende KEINE Gedankenstriche (weder '–' noch '—' noch '-' als Gedankenstrich).
   Nutze Doppelpunkte (:), Punkte (.) oder strukturierte Emojis (🔹, 📌, 👉).
2. HEADLINE PRO SLIDE:
   Maximal 5 bis 8 Worte. Knackig, überraschend, kein generischer Folientitel wie "Slide 1".
3. SUBTEXT PRO SLIDE:
   1 bis 2 geschliffene Sätze mit hohem Mehrwert, mundgerecht lesbar.
4. CORE METAPHOR & BILDPROMPT:
   Ein konkretes 3D-Symbol (z.B. "polierte Marmor-Säule mit flüssigem Gold", "Obsidian-Uhrwerk").
   Ein kurzer englischer Prompt für 3D-Renderings ohne Text im Bild.
5. CAPTION & HASHTAGS:
   Vollständiger Begleittext mit Hook, Mehrwert-Bulletpoints, CTA und 4-6 relevanten Hashtags.

ANTWORTE AUSSCHLIESSLICH ALS VALIDES JSON:
{
  "title": "Titel des Karussells",
  "caption": "Kompletter Begleittext...",
  "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3"],
  "slides": [
    {
      "slideNumber": 1,
      "role": "${roleSequence[0]}",
      "headline": "Scroll-Stopper Überschrift",
      "subtext": "Erklärungssatz...",
      "coreMetaphor": "3D Obsidian Portal",
      "englishPromptIdea": "photorealistic 3D glowing obsidian portal with fiery ember accents, cinematic lighting, 4:5 vertical framing, negative space for text"
    }
  ]
}`;

    const models = [
      params.model || "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          effectiveKey
        )}`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 2500,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = JSON.parse(rawText) as {
          title?: string;
          caption?: string;
          hashtags?: string[];
          slides?: Array<{
            slideNumber?: number;
            role?: string;
            headline?: string;
            subtext?: string;
            coreMetaphor?: string;
            englishPromptIdea?: string;
          }>;
        };

        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
          continue;
        }

        const sanitizedTitle = sanitizeNoGedankenstriche(parsed.title || topic);
        const sanitizedCaption = sanitizeNoGedankenstriche(parsed.caption || topic);
        const validHashtags = (parsed.hashtags || []).map((h) =>
          h.startsWith("#") ? h : `#${h}`
        );

        const slides: SlideContent[] = parsed.slides.slice(0, slideCount).map((s, idx) => {
          const slideNumber = idx + 1;
          const role = (s.role as SlideRole) || roleSequence[idx] || "concept";
          const headline = sanitizeNoGedankenstriche(s.headline || `${topic} : Schritt ${slideNumber}`);
          const subtext = sanitizeNoGedankenstriche(s.subtext || "");
          const coreMetaphor = sanitizeNoGedankenstriche(s.coreMetaphor || "3D Abstraktion");

          const visualPrompt = buildSlideVisualPrompt({
            coreMetaphor: s.englishPromptIdea || coreMetaphor,
            topic,
            slideNumber,
            slideCount,
            styleId: brand.accentStyle || "ember-ignite",
          });

          return {
            id: makeId(),
            slideNumber,
            role,
            roleLabel: ROLE_LABELS[role] || role,
            headline,
            subtext,
            ...(slideNumber === 1 ? { badge: "Hook" } : slideNumber === slideCount ? { badge: "CTA" } : {}),
            coreMetaphor,
            primaryProps: ["Studiolicht", "4:5 Portrait"],
            visualPrompt,
            renderStatus: "idle",
          };
        });

        // Ensure full count
        while (slides.length < slideCount) {
          const idx = slides.length;
          const slideNumber = idx + 1;
          const role = roleSequence[idx] || "expansion";
          slides.push({
            id: makeId(),
            slideNumber,
            role,
            roleLabel: ROLE_LABELS[role] || role,
            headline: sanitizeNoGedankenstriche(`${topic} : Teil ${slideNumber}`),
            subtext: "Konkreter Mehrwert für die sofortige Umsetzung.",
            coreMetaphor: "Monolith im Studiolicht",
            primaryProps: ["Studiolicht"],
            visualPrompt: buildSlideVisualPrompt({
              coreMetaphor: "minimalist 3D geometric monolith",
              topic,
              slideNumber,
              slideCount,
              styleId: brand.accentStyle || "ember-ignite",
            }),
            renderStatus: "idle",
          });
        }

        return {
          title: sanitizedTitle,
          caption: sanitizedCaption,
          hashtags: validHashtags.length > 0 ? validHashtags : ["#Socialcraft", "#Creator"],
          slides,
          provider: `gemini (${model})`,
          skillUsed: skill?.name || "Standard KI-Skill",
        };
      } catch {
        // Try next model or fallback
      }
    }

    // Fallback if network or all models failed
    const fallback = generateAlgorithmicStoryboard(
      {
        topic,
        audience: params.audience || "Ambitionierte Creator & Unternehmer",
        slideCount,
        designId: brand.accentStyle || "ember-ignite",
        ctaText: brand.ctaText,
      },
      ""
    );
    return {
      title: fallback.carousel.title,
      caption: fallback.carousel.caption,
      hashtags: fallback.carousel.hashtags,
      slides: fallback.carousel.slides,
      provider: "algorithmic-fallback (Resilienz)",
      skillUsed: skill?.name || "Standard System",
    };
  }

  async rerollSlidePrompt(
    params: RerollPromptParams
  ): Promise<{ visualPrompt: string; coreMetaphor: string }> {
    const effectiveKey = resolveApiKey(params.apiKey);
    const styleDescriptor =
      (params.brandKit?.accentStyle && STYLE_PROMPT_MAP[params.brandKit.accentStyle]) ||
      STYLE_PROMPT_MAP["ember-ignite"] ||
      "cinematic 3D render, dark atmospheric studio";

    if (!effectiveKey) {
      const metaphors = [
        "schwebender Prisma-Kristall mit innerem Glühen",
        "architektonischer Quader aus geschmiedetem Titan",
        "zerfließende Gold-Geometrie im sanften Scheinwerferlicht",
        "präzises Uhrwerk mit leuchtenden Zahnrädern",
      ];
      const metaphor = metaphors[Math.floor(Math.random() * metaphors.length)]!;
      return {
        coreMetaphor: metaphor,
        visualPrompt: `Photorealistic 3D ${metaphor}, ${styleDescriptor}, aspect ratio 4:5, clean central composition with ample negative space at top and bottom, slide ${params.slideNumber} of ${params.slideCount}`,
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
        effectiveKey
      )}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Erstelle eine neue, frische visuelle 3D-Metapher und einen englischen Diffusions-Prompt für Folie ${params.slideNumber} (Thema: "${params.topic}", Headline: "${params.currentHeadline || ""}").
Antworte als JSON:
{
  "coreMetaphor": "Deutsche Metapherbeschreibung",
  "englishPrompt": "photorealistic 3D description..."
}`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.coreMetaphor && parsed.englishPrompt) {
            return {
              coreMetaphor: sanitizeNoGedankenstriche(parsed.coreMetaphor),
              visualPrompt: `${parsed.englishPrompt}, ${styleDescriptor}, aspect ratio 4:5, zero text, clean negative space`,
            };
          }
        }
      }
    } catch {}

    return {
      coreMetaphor: "skulpturale 3D-Geometrie",
      visualPrompt: `Photorealistic 3D abstract sculpture, ${styleDescriptor}, aspect ratio 4:5, studio rim lighting`,
    };
  }
}

export const defaultAiProvider = new GeminiAiProvider();
