import { fetchKieCredits, generateNanoBananaImage, type KieModel } from "./kie-api";
import type { ApiSettings, CreditStatus, ImageProvider, SlideContent, SlideRole } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ROLES: SlideRole[] = [
  "hook",
  "concept",
  "pain_point",
  "authority",
  "expansion",
  "usp",
  "proof",
  "urgency",
  "closing",
];

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

const METAPHORS = [
  "Marmor-Statue",
  "Stahl vs. Flamme",
  "Zerbrochener Spiegel",
  "Uhrwerk aus Obsidian",
  "Aufsteigender Rauch",
  "Monolith im Nebel",
];

export function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function mockGenerateCarousel(
  slideCount: number,
  topic = "Disziplin schlägt Motivation",
  audience = "",
  clonePrefix = "",
  clonePlacement = "hook_closing",
): Promise<SlideContent[]> {
  await delay(600);
  return Array.from({ length: slideCount }, (_, i) => {
    const role = ROLES[i % ROLES.length]!;
    const metaphor = METAPHORS[i % METAPHORS.length]!;
    const isFirst = i === 0;
    const isLast = i === slideCount - 1;
    const isEven = (i + 1) % 2 === 0;

    const includeClone =
      Boolean(clonePrefix) &&
      (clonePlacement === "all_slides" ||
        (clonePlacement === "hook_closing" && (isFirst || isLast)) ||
        (clonePlacement === "even_slides" && isEven));

    const visualPromptBase = `Photorealistic 3D ${metaphor.toLowerCase()}, violet rim light (#9333EA), dark background #060509, cinematic, slide ${i + 1} of ${slideCount} — ${topic}`;
    const visualPrompt = includeClone
      ? `${clonePrefix.trim()} — featuring ${visualPromptBase}`
      : visualPromptBase;

    const props = ["Violettes Rimlight", "Dunkler Hintergrund", "Dramatisches Licht"];
    if (includeClone) {
      props.unshift("Konsistente AI Persona");
    }

    return {
      id: makeId(),
      slideNumber: i + 1,
      role,
      roleLabel: ROLE_LABELS[role],
      headline: `${topic} — Teil ${i + 1}`,
      subtext: audience
        ? `Für ${audience}: Motivation ist ein Gefühl. Ein System funktioniert auch ohne.`
        : "Motivation ist ein Gefühl. Disziplin ist ein System, das funktioniert.",
      ...(isFirst ? { badge: "Der Unterschied" } : {}),
      coreMetaphor: includeClone ? "AI Persona Porträt" : metaphor,
      primaryProps: props,
      visualPrompt,
    } satisfies SlideContent;
  });
}

export interface GenerateImageParams {
  slideNumber: number;
  prompt?: string;
  settings?: ApiSettings;
  referenceImages?: string[] | undefined;
  aspectRatio?: "4:5" | "1:1";
  signal?: AbortSignal | undefined;
  onProgress?: ((info: { state: string; message: string }) => void) | undefined;
}

// High-resolution fallback visuals for demo mode when no API key is set
const MOCK_EDITORIAL_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1080&h=1350&q=85",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&h=1350&q=85",
];

export async function generateImageUnified(params: GenerateImageParams): Promise<{
  success: boolean;
  imageUrl: string;
  provider: ImageProvider;
  fromRealApi: boolean;
}> {
  const { slideNumber, prompt, settings, referenceImages, aspectRatio = "4:5", signal, onProgress } = params;

  // If user has a KIE.AI key and provider is kie-ai (or default), use real Nano-Banana 2 API!
  const hasKieKey = Boolean(settings?.kieApiKey?.trim());
  const useKieAi = hasKieKey && (settings?.provider === "kie-ai" || settings?.provider === "mock" || !settings?.provider);

  if (useKieAi && settings?.kieApiKey) {
    try {
      const result = await generateNanoBananaImage({
        model: (settings.kieModel || "nano-banana-2") as KieModel,
        apiKey: settings.kieApiKey,
        prompt: prompt || `Instagram 4:5 Carousel Slide ${slideNumber}, dark aesthetic, cinematic rim light, professional branding`,
        ...(referenceImages && referenceImages.length > 0 ? { imageInput: referenceImages } : {}),
        aspectRatio: aspectRatio,
        resolution: settings.kieResolution || "1K",
        outputFormat: "jpg",
        ...(signal !== undefined ? { signal } : {}),
        ...(onProgress !== undefined ? { onProgress } : {}),
      });

      return {
        success: true,
        imageUrl: result.imageUrl,
        provider: "kie-ai",
        fromRealApi: true,
      };
    } catch (err: unknown) {
      console.warn("Nano-Banana 2 API Call failed, falling back to preview visual:", err);
      // Re-throw if cancelled by user
      if (signal?.aborted) throw err;
      // If error is authentication or insufficient balance, throw so UI can inform user
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("402"))) {
        throw err;
      }
      // Otherwise throw the error so the user knows what happened
      throw err;
    }
  }

  // Fallback demo/mock generation
  await delay(800 + Math.random() * 400);
  if (signal?.aborted) throw new DOMException("aborted", "AbortError");

  const fallbackUrl = MOCK_EDITORIAL_IMAGES[(slideNumber - 1) % MOCK_EDITORIAL_IMAGES.length]!;
  return {
    success: true,
    imageUrl: fallbackUrl,
    provider: "mock",
    fromRealApi: false,
  };
}

export async function mockGenerateImage(slideNumber: number, signal?: AbortSignal) {
  return generateImageUnified({ slideNumber, signal });
}

export async function getLiveCredits(settings?: ApiSettings): Promise<CreditStatus> {
  const key = settings?.kieApiKey?.trim();
  if (key) {
    const liveKie = await fetchKieCredits(key);
    return {
      loading: false,
      kie: liveKie,
      ai33: { credits: 210, formatted: "210 cr", success: true },
    };
  }

  return {
    loading: false,
    kie: { credits: 0, formatted: "Key fehlt", success: false },
    ai33: { credits: 210, formatted: "210 cr", success: true },
  };
}

export async function mockGetCredits(settings?: ApiSettings): Promise<CreditStatus> {
  return getLiveCredits(settings);
}

export async function mockNameTopic(topic: string): Promise<string> {
  await delay(200);
  const words = topic.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  return words.length ? words.join(" ") : "Unbenannt";
}

