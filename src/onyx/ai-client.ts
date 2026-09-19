import type { AiSkill, BrandKit, StructuredCarouselResponse } from "./types";
import { generateAlgorithmicStoryboard } from "./story-service";

export interface GenerateCarouselOptions {
  topic: string;
  audience?: string;
  slideCount?: number;
  aspectRatio?: "4:5" | "1:1" | "9:16";
  brandKit?: BrandKit;
  skill?: AiSkill;
  customInstructions?: string;
  apiKey?: string;
  model?: string;
}

export async function generateCarouselContent(
  options: GenerateCarouselOptions
): Promise<StructuredCarouselResponse> {
  const { topic, slideCount = 7, brandKit, skill, apiKey } = options;

  try {
    const resp = await fetch("/api/cloud/ai/generate-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-gemini-key": apiKey } : {}),
      },
      body: JSON.stringify({
        topic,
        audience: options.audience,
        slideCount,
        aspectRatio: options.aspectRatio || brandKit?.aspectRatio || "4:5",
        brandKit,
        skill,
        customInstructions: options.customInstructions,
        apiKey,
        model: options.model,
      }),
    });

    if (resp.ok) {
      const data = (await resp.json()) as { success?: boolean } & StructuredCarouselResponse;
      if (data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("[AiClient] Server generation failed, falling back to local algorithmic:", err);
  }

  // Resilient fallback (instant, local, 0-cost)
  const fallback = generateAlgorithmicStoryboard(
    {
      topic,
      audience: options.audience || "Unternehmer & Creator",
      slideCount,
      designId: brandKit?.accentStyle || "ember-ignite",
      ctaText: brandKit?.ctaText,
      customInstructions: options.customInstructions,
    },
    ""
  );

  return {
    title: fallback.carousel.title,
    caption: fallback.carousel.caption,
    hashtags: fallback.carousel.hashtags,
    slides: fallback.carousel.slides,
    provider: "algorithmic-fallback (Client-Resilienz)",
    skillUsed: skill?.name || "Standard",
  };
}

export async function rerollSlidePromptClient(params: {
  topic: string;
  slideNumber: number;
  slideCount: number;
  currentHeadline?: string;
  currentPrompt?: string;
  role?: string;
  brandKit?: BrandKit;
  skill?: AiSkill;
  apiKey?: string;
}): Promise<{ visualPrompt: string; coreMetaphor: string }> {
  try {
    const resp = await fetch("/api/cloud/ai/reroll-slide-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(params.apiKey ? { "x-gemini-key": params.apiKey } : {}),
      },
      body: JSON.stringify(params),
    });

    if (resp.ok) {
      const data = (await resp.json()) as {
        success?: boolean;
        visualPrompt?: string;
        coreMetaphor?: string;
      };
      if (data.visualPrompt && data.coreMetaphor) {
        return { visualPrompt: data.visualPrompt, coreMetaphor: data.coreMetaphor };
      }
    }
  } catch {}

  const metaphors = [
    "schwebendes 3D Obsidian-Portal mit Lichtreflexion",
    "fein geschliffener Kristall mit goldener Innenstruktur",
    "monolithische Steinskulptur im Studiolicht",
    "kinematische Skulptur aus mattem Titan",
  ];
  const meta = metaphors[Math.floor(Math.random() * metaphors.length)]!;
  return {
    coreMetaphor: meta,
    visualPrompt: `Photorealistic 3D ${meta}, aspect ratio 4:5, cinematic studio lighting, clean composition, zero text, slide ${params.slideNumber} of ${params.slideCount}`,
  };
}
