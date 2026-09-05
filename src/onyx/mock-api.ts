import type { CreditStatus, SlideContent, SlideRole } from "./types";

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

export async function mockGenerateImage(slideNumber: number, signal?: AbortSignal) {
  await delay(800 + Math.random() * 400);
  if (signal?.aborted) throw new DOMException("aborted", "AbortError");
  return {
    success: true,
    imageUrl: `https://placehold.co/1080x1350/060509/9333ea/png?text=Slide+${slideNumber}`,
    provider: "mock" as const,
  };
}

export async function mockGetCredits(): Promise<CreditStatus> {
  await delay(300);
  return {
    loading: false,
    kie: { credits: 4320, formatted: "4.320 cr", success: true },
    ai33: { credits: 210, formatted: "210 cr", success: true },
  };
}

export async function mockNameTopic(topic: string): Promise<string> {
  await delay(200);
  const words = topic.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  return words.length ? words.join(" ") : "Unbenannt";
}
