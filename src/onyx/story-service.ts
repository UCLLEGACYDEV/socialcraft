import type {
  ClonePlacement,
  SingleImageBrief,
  SlideContent,
  SlideRole,
  StoryBrief,
  StoryboardResult,
} from "./types";
import { sanitizeNoGedankenstriche } from "./caption-generator";

export const ROLE_LABELS: Record<SlideRole, string> = {
  hook: "Hook",
  concept: "Konzept",
  pain_point: "Schmerz",
  authority: "Autorität",
  expansion: "Vertiefung",
  usp: "USP",
  proof: "Beweis",
  urgency: "Dringlichkeit",
  closing: "CTA",
};

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Style Archetype visual prompt presets
export const STYLE_PROMPT_MAP: Record<string, string> = {
  "ember-ignite":
    "photorealistic cinematic 3D, dark charcoal background #0A0705, intense fiery ember orange rimlight (#F04A20), dramatic rim illumination, high contrast, clean minimalist composition with space for text overlay at top and bottom",
  "editorial-statue":
    "high-end museum editorial photography, classical marble statue elements, cold stone textures, muted ivory and deep obsidian (#101014), subtle museum spotlight, film grain, luxury aesthetic",
  "swiss-mono":
    "swiss modernist minimalist art direction, stark monochrome black (#0B0B0D) and pure white (#FFFFFF), brutalist geometric structures, sleek matte finish, studio lighting",
  "swiss-clean-mono":
    "swiss modernist minimalist art direction, stark monochrome black (#0B0B0D) and pure white (#FFFFFF), brutalist geometric structures, sleek matte finish, studio lighting",
  "warm-clay":
    "warm studio photography, organic terracotta and warm clay (#D97757), soft diffused window lighting, earthy textures, modern Scandinavian interior styling",
  "warm-studio-clay":
    "warm studio photography, organic terracotta and warm clay (#D97757), soft diffused window lighting, earthy textures, modern Scandinavian interior styling",
  "emerald-malachite":
    "deep dark forest obsidian (#04120C), lustrous emerald green (#34D399) glowing accents, opulent mineral surfaces, high fashion editorial lighting, striking contrast",
};

/**
 * Assigns psychological slide roles dynamically according to slide count.
 */
export function getSlideRoleSequence(slideCount: number): SlideRole[] {
  const count = Math.max(2, Math.min(10, slideCount));

  if (count === 2) return ["hook", "closing"];
  if (count === 3) return ["hook", "concept", "closing"];
  if (count === 4) return ["hook", "pain_point", "concept", "closing"];
  if (count === 5) return ["hook", "pain_point", "concept", "proof", "closing"];
  if (count === 6) return ["hook", "pain_point", "concept", "expansion", "proof", "closing"];
  if (count === 7) return ["hook", "pain_point", "concept", "expansion", "usp", "proof", "closing"];
  if (count === 8) return ["hook", "pain_point", "concept", "expansion", "authority", "proof", "urgency", "closing"];
  if (count === 9) return ["hook", "pain_point", "concept", "expansion", "authority", "usp", "proof", "urgency", "closing"];

  // 10 slides (Deep Dive Masterclass)
  return [
    "hook",
    "pain_point",
    "concept",
    "expansion",
    "authority",
    "expansion",
    "usp",
    "proof",
    "urgency",
    "closing",
  ];
}

/**
 * Checks whether the clone prompt should be applied to a specific slide number.
 */
export function shouldIncludeCloneOnSlide(
  slideNumber: number,
  slideCount: number,
  placement: ClonePlacement = "hook_closing"
): boolean {
  if (placement === "all_slides") return true;
  if (placement === "hook_closing") return slideNumber === 1 || slideNumber === slideCount;
  if (placement === "even_slides") return slideNumber % 2 === 0;
  return slideNumber === 1;
}

/**
 * Creates visual prompt for a slide integrating style, clone, and composition guidance.
 */
export function buildSlideVisualPrompt(params: {
  coreMetaphor: string;
  topic: string;
  slideNumber: number;
  slideCount: number;
  styleId?: string;
  clonePrefix?: string;
  clonePlacement?: ClonePlacement;
}): string {
  const { coreMetaphor, topic, slideNumber, slideCount, styleId, clonePrefix, clonePlacement } = params;

  const styleDescriptor =
    (styleId && STYLE_PROMPT_MAP[styleId]) ||
    STYLE_PROMPT_MAP["ember-ignite"] ||
    "cinematic lighting, dark atmospheric studio background, 4:5 vertical framing";

  const includeClone =
    Boolean(clonePrefix && clonePrefix.trim()) &&
    shouldIncludeCloneOnSlide(slideNumber, slideCount, clonePlacement);

  const baseComposition = `Photorealistic 3D ${coreMetaphor}, ${styleDescriptor}, aspect ratio 4:5, clean central subject, ample negative space at top and bottom for text placement, zero visible text or letters inside the rendering, slide ${slideNumber} of ${slideCount} for topic: "${topic}"`;

  if (includeClone && clonePrefix) {
    return `${clonePrefix.trim()}, seamlessly composed with ${baseComposition}`;
  }

  return baseComposition;
}

/**
 * Algorithmic Fallback Storyboard Generator (zero network, instant, deterministic).
 */
export function generateAlgorithmicStoryboard(
  brief: StoryBrief,
  clonePrefix = ""
): StoryboardResult {
  const slideCount = Math.max(2, Math.min(10, brief.slideCount || 6));
  const topic = brief.topic.trim() || "Erfolgreiche Social-Media-Systeme";
  const audience = brief.audience?.trim() || "";
  const roles = getSlideRoleSequence(slideCount);

  const metaphors: Record<SlideRole, string> = {
    hook: "flammendes Siegel aus Obsidian und flüssigem Gold",
    pain_point: "zerbrochene Sanduhr mit austretendem feinem Lichtstaub",
    concept: "präzises monolithisches Uhrwerk mit glimmenden Zahnrädern",
    authority: "monumentale Steinsäule mit goldenen Intarsien im Nebel",
    expansion: "architektonisches Raster mit leuchtenden Datenströmen",
    usp: "schwebender geschliffener Diamant mit Prismareflexion",
    proof: "präzise gearbeitetes Waagschalen-Fundament aus geschmiedetem Titan",
    urgency: "letzter fallender Wassertropfen auf dunklem Basaltstein",
    closing: "leuchtender Wegweiser durch ein geometrisches Portal in die Zukunft",
  };

  const roleHeadlines: Record<SlideRole, (i: number) => string> = {
    hook: () => `Warum 94% bei ${topic.slice(0, 35)} scheitern`,
    pain_point: () => "Der fatale Denkfehler, der Zeit und Reichweite verbrennt",
    concept: () => "Das Prinzip: Systeme schlagen reine Willenskraft",
    authority: () => "Die bewährte Methodik der erfolgreichsten Personal Brands",
    expansion: (i) => `Schritt ${i}: Der strategische Hebel für sofortige Umsetzung`,
    usp: () => "Der entscheidende Unterschied, den fast jeder übersieht",
    proof: () => "Das messbare Ergebnis: Mehr Verweildauer und treue Follower",
    urgency: () => "Wer jetzt nicht umstellt, verliert den Algorithmus-Anschluss",
    closing: () => "Speichere dir diesen Leitfaden für deinen nächsten Durchbruch",
  };

  const roleSubtexts: Record<SlideRole, string> = {
    hook: audience
      ? `Für ${audience}: Wer nur hofft, wird übersehen. Hier ist die klare Strategie.`
      : "Wer ohne Struktur postet, verliert den Kampf um Aufmerksamkeit in den ersten 2 Sekunden.",
    pain_point:
      "Ständige Ideenlosigkeit entsteht nicht durch Mangel an Talent, sondern durch das Fehlen reproduzierbarer Abläufe.",
    concept:
      "Trenne Konzept von Gestaltung. Erst wenn die Storyline steht, folgt das visuelle Framing.",
    authority:
      "Erfolgreiche Creator bauen auf wiederkehrende Narrative und feste visuelle Anker.",
    expansion:
      "Fokussiere dich auf einen einzigen Kernaspekt pro Folie. Weniger Text bedeutet mehr mentale Verarbeitung.",
    usp:
      "Kombiniere visuelle Konsistenz mit radikaler Klarheit in der Botschaft.",
    proof:
      "Kontinuität und psychologischer Spannungsbogen verdoppeln die durchschnittliche Dwell-Time.",
    urgency:
      "Die Algorithmen von 2026 belohnen nur noch Inhalte, die echte Relevanz und Speicher-Raten erzielen.",
    closing:
      brief.customInstructions || "Klicke auf Speichern 📌 und folge für tägliche Meisterklasse-Einblicke.",
  };

  const slides: SlideContent[] = roles.map((role, idx) => {
    const slideNumber = idx + 1;
    const metaphor = metaphors[role] || "Monolith im Studiolicht";
    const headline = sanitizeNoGedankenstriche(roleHeadlines[role](slideNumber));
    const subtext = sanitizeNoGedankenstriche(roleSubtexts[role]);
    const visualPrompt = buildSlideVisualPrompt({
      coreMetaphor: metaphor,
      topic,
      slideNumber,
      slideCount,
      styleId: brief.styleId,
      clonePrefix,
      clonePlacement: brief.clonePlacement,
    });

    const isFirst = slideNumber === 1;
    const isLast = slideNumber === slideCount;
    const includeClone = shouldIncludeCloneOnSlide(slideNumber, slideCount, brief.clonePlacement);

    const props = ["Dramatisches Studiolicht", "Sattes Farb-Grading", "4:5 Portrait-Fokus"];
    if (includeClone && clonePrefix) {
      props.unshift("Konsistente KI-Persona");
    }

    return {
      id: makeId(),
      slideNumber,
      role,
      roleLabel: ROLE_LABELS[role] || role,
      headline,
      subtext,
      ...(isFirst ? { badge: "Leitfaden" } : isLast ? { badge: "Nächster Schritt" } : {}),
      coreMetaphor: metaphor,
      primaryProps: props,
      visualPrompt,
    };
  });

  const title = sanitizeNoGedankenstriche(topic);
  const caption = sanitizeNoGedankenstriche(
    `📌 ${topic}\n\nDie meisten scheitern nicht an ihren Ideen, sondern an der Struktur ihrer Ausführung.\n\n🔹 Klare Rollenverteilung von Folie 1 bis ${slideCount}\n🔹 Dramaturgischer Spannungsbogen ohne Textwüsten\n🔹 Höchste Interaktion durch zielgerichtete Handlungsaufforderung\n\nWelche Erkenntnis nimmst du für deinen Content mit? Schreib es in die Kommentare.`
  );
  const hashtags = ["#SocialMediaTipps", "#ContentMarketing", "#PersonalBranding", "#CreatorWachstum"];

  const singles: SingleImageBrief[] = [];
  const singleCount = brief.singleImageCount ?? 0;
  for (let s = 1; s <= singleCount; s++) {
    singles.push({
      headline: sanitizeNoGedankenstriche(`Fokus-Impuls ${s}: ${topic}`),
      caption: sanitizeNoGedankenstriche(`Ein starker Gedanke zu ${topic}. Speichere dir diesen Impuls für die Woche 📌`),
      hashtags: ["#Impuls", "#Mindset", "#Fokus"],
      visualPrompt: buildSlideVisualPrompt({
        coreMetaphor: `kraftvolle Solitär-Skulptur Symbol für ${topic}`,
        topic,
        slideNumber: s,
        slideCount: singleCount,
        styleId: brief.styleId,
        clonePrefix,
        clonePlacement: "all_slides",
      }),
    });
  }

  return {
    carousel: {
      title,
      caption,
      hashtags,
      slides,
    },
    singles,
    provider: "algorithmic_fallback",
  };
}

/**
 * Main StoryService: Generates a complete carousel storyboard and optional feed singles.
 * Powered by Google Gemini (with algorithmic fallback on missing key or network issue).
 */
export async function generateStoryboard(
  brief: StoryBrief,
  options?: {
    apiKey?: string;
    clonePrefix?: string;
    model?: string;
  }
): Promise<StoryboardResult> {
  const topic = brief.topic?.trim();
  if (!topic) {
    throw new Error("StoryBrief benötigt ein gültiges Thema (topic).");
  }

  const slideCount = Math.max(2, Math.min(10, brief.slideCount || 6));
  const apiKey = options?.apiKey?.trim() || "";
  const clonePrefix = options?.clonePrefix?.trim() || "";

  // If no Gemini key is available, return the high-quality algorithmic template
  if (!apiKey || apiKey.length < 10) {
    return generateAlgorithmicStoryboard(brief, clonePrefix);
  }

  const roleSequence = getSlideRoleSequence(slideCount);
  const hookArchetype = brief.hookArchetype || "provocative";
  const audience = brief.audience?.trim() || "Unternehmer, Creator & Experten";
  const content = brief.content?.trim() || "";

  const prompt = `Du bist ein weltklasse Social-Media-Copywriter und Creative Director für virale Instagram-Karussells.
Erstelle ein dramaturgisch meisterhaftes Karussell mit genau ${slideCount} Slides zum folgenden Thema.

THEMA: "${topic}"
${content ? `INHALTLICHE VORGABEN / ARGUMENTE: "${content}"` : ""}
ZIELGRUPPE: "${audience}"
HOOK-TYP: "${hookArchetype}"
SLIDE-ANZAHL: ${slideCount}
FESTGELEGTE SLIDE-ROLLEN: ${roleSequence.join(", ")}
${brief.customInstructions ? `ZUSATZANWEISUNGEN: "${brief.customInstructions}"` : ""}

STRIKTE QUALITÄTSREGELN:
1. ABSOLUTES VERBOT VON GEDANKENSTRICHEN:
   Verwende KEINE Gedankenstriche (weder '–' noch '—' noch '-' als Aufzählungszeichen oder Gedankenstrich).
   Nutze stattdessen Doppelpunkte (:), Punkte (.) oder Emojis (🔹, 👉, 📌, 💡).
2. HEADLINE PRO SLIDE:
   Extrem prägnant, maximal 6 bis 9 Worte. Niemals langweilige Titel wie "Folie 1".
3. SUBTEXT PRO SLIDE:
   1 bis 2 geschliffene Sätze mit hohem Mehrwert, mundgerecht lesbar.
4. CORE METAPHOR (KERNMETAPHER):
   Ein konkretes, bildhaftes 3D-Symbol für die Slide (z.B. "polierte Marmor-Säule", "Obsidian-Uhrwerk", "gläserner Quader").
5. PROMPT-VORSCHLAG:
   Ein kurzer, visueller Bildbeschreibungs-Satz auf Englisch für Diffusion-Modelle (ohne Text im Bild).
6. CAPTION:
   Ein viraler Begleittext für Instagram/LinkedIn nach HSO-Formel (Hook, Story, Call-to-Action) und genau 3-5 Hashtags.

ANTWORTE AUSSCHLIESSLICH MIT EINEM VALIDEN JSON-OBJEKT IN FOLGENDER STRUKTUR (KEIN MARKDOWN, KEINE CODEBLOCKS):
{
  "title": "Titel des Karussells",
  "caption": "Vollständige Caption für den Post",
  "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3"],
  "slides": [
    {
      "slideNumber": 1,
      "role": "${roleSequence[0]}",
      "headline": "Stopp-Hook",
      "subtext": "Erklärung",
      "coreMetaphor": "Visual Metaphor",
      "englishPromptIdea": "photorealistic description of metaphor"
    }
  ]
}`;

  const models = [options?.model || "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        continue;
      }

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
      const validHashtags = (parsed.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`));

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
          styleId: brief.styleId,
          clonePrefix,
          clonePlacement: brief.clonePlacement,
        });

        const isFirst = slideNumber === 1;
        const isLast = slideNumber === slideCount;
        const includeClone = shouldIncludeCloneOnSlide(slideNumber, slideCount, brief.clonePlacement);

        const props = ["Dramatisches Licht", "Studiotextur"];
        if (includeClone && clonePrefix) props.unshift("KI Persona");

        return {
          id: makeId(),
          slideNumber,
          role,
          roleLabel: ROLE_LABELS[role] || role,
          headline,
          subtext,
          ...(isFirst ? { badge: "Hook" } : isLast ? { badge: "CTA" } : {}),
          coreMetaphor,
          primaryProps: props,
          visualPrompt,
        };
      });

      // Ensure slide count matches requested
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
          subtext: "Weiterführender Mehrwert für deinen Umsetzungserfolg.",
          coreMetaphor: "Monolith",
          primaryProps: ["Studiolicht"],
          visualPrompt: buildSlideVisualPrompt({
            coreMetaphor: "monolith",
            topic,
            slideNumber,
            slideCount,
            styleId: brief.styleId,
            clonePrefix,
            clonePlacement: brief.clonePlacement,
          }),
        });
      }

      return {
        carousel: {
          title: sanitizedTitle,
          caption: sanitizedCaption,
          hashtags: validHashtags.length > 0 ? validHashtags : ["#Socialcraft", "#Creator"],
          slides,
        },
        provider: `gemini (${model})`,
      };
    } catch {
      // Try next model or fallback
    }
  }

  // Fallback to algorithmic generation if all models failed
  return generateAlgorithmicStoryboard(brief, clonePrefix);
}
