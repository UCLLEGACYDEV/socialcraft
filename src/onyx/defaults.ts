import type { AiCloneProfile, ApiSettings, BrandKit, BriefValues } from "./types";

export const DEFAULT_BRAND_KIT: BrandKit = {
  handle: "@dein.name",
  showHandle: true,
  accentStyle: "ember-ignite",
  accentColorHex: "#F04A20",
  fontFamily: "Plus Jakarta Sans",
  aspectRatio: "4:5",
  ctaText: "Speichere dir diesen Post für später ab.",
};

export const DEFAULT_API_SETTINGS: ApiSettings = {
  provider: "mock",
  kieApiKey: "",
  kieWebhookKey: "",
  kieModel: "nano-banana-2",
  kieResolution: "1K",
  ai33ApiKey: "",
  ai33Model: "flux-pro",
  geminiApiKey: "",
  proxyEndpoint: "",
  proxyApiKey: "",
  llmProvider: "gemini",
  openaiApiKey: "",
  anthropicApiKey: "",
  s4Endpoint: "socialgrow.s3.g.megas4.com",
  s4Bucket: "socialgrow",
  s4AccessKey: "",
  s4SecretKey: "",
  s4Region: "eu-central-1", // Standard für Mega S4, falls zutreffend, oder "auto"
  s4AutoSave: true,
};

export const DEFAULT_BRIEF: BriefValues = {
  topic: "",
  audience: "",
  designId: "ember-ignite",
  slideCount: 6,
  ctaText: DEFAULT_BRAND_KIT.ctaText,
  handle: DEFAULT_BRAND_KIT.handle,
  provider: "gemini",
  apiKey: "",
  useClone: false,
};

export interface DesignTemplate {
  id: string;
  name: string;
  mood: string;
  swatch: string[];
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "ember-ignite",
    name: "Ember Ignite",
    mood: "Schwarz, orange-rote Glut, harte Kanten",
    swatch: ["#0A0705", "#F04A20", "#F7C59F"],
  },
  {
    id: "editorial-statue",
    name: "Editorial Statue",
    mood: "Museum, Serifen, kalter Stein",
    swatch: ["#101014", "#C7C2B6", "#F4F4F6"],
  },
  {
    id: "swiss-mono",
    name: "Swiss Clean Mono",
    mood: "Raster, Mono-Typo, viel Weißraum",
    swatch: ["#0B0B0D", "#FFFFFF", "#7A7A85"],
  },
  {
    id: "warm-clay",
    name: "Warm Studio & Clay",
    mood: "Terrakotta, weiches Studiolicht",
    swatch: ["#1A1210", "#D97757", "#F0E4DC"],
  },
  {
    id: "emerald-malachite",
    name: "Emerald Malachite",
    mood: "Grüner Stein, hoher Kontrast",
    swatch: ["#04120C", "#34D399", "#E6F5EE"],
  },
];

export const STYLE_ARCHETYPES = [
  { id: "ember-ignite", label: "Ember Ignite", hex: "#F04A20" },
  { id: "swiss-clean-mono", label: "Swiss Clean Mono", hex: "#E8E6F0" },
  { id: "warm-studio-clay", label: "Warm Studio & Clay", hex: "#D97757" },
  { id: "emerald-malachite", label: "Emerald Malachite", hex: "#34D399" },
];

export const CTA_OPTIONS = [
  "Speichere dir diesen Post für später ab.",
  "Folge mir für mehr Systeme statt Motivation.",
  "Schreib mir „START“ in die DMs.",
  "Teile das mit jemandem, der es braucht.",
];

export const LLM_PROVIDERS = [
  { id: "gemini", label: "Gemini", url: "https://aistudio.google.com/apikey" },
  { id: "openai", label: "ChatGPT", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Claude", url: "https://console.anthropic.com/settings/keys" },
] as const;

export const DEFAULT_CLONE_PROFILES: AiCloneProfile[] = [
  {
    id: "founder-dark-ember",
    name: "Founder Dark Ember",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    referenceImages: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    ],
    genderAge: "Mann, Anfang 30, mitteleuropäischer Typ",
    hairFace: "Kurze dunkle Haare, gepflegter 3-Tage-Bart, markante Kieferlinie, fokussierter Blick",
    wardrobe: "Schwarzer minimalistischer Merinowolle-Rollkragenpullover",
    lightingLook: "Dramatisches Seitenlicht (Rembrandt), warmes orange-rotes Rimlight (#F04A20), tiefe Schatten",
    framingCamera: "Close-up Porträt, 85mm Linse, f/1.8 Bokeh, Blick leicht an der Kamera vorbei ins Leere",
    negativePrompt: "Kein künstliches breites Grinsen, keine Cartoon-Ästhetik, kein greller Hintergrund",
    customPrefix: "Consistent recurring persona: Man in early 30s, short dark hair, neat stubble beard, wearing black turtleneck, cinematic dramatic side lighting, warm ember rimlight, dark studio background, 85mm portrait.",
    placement: "hook_closing",
    updatedAt: "2026-09-05T06:00:00.000Z",
  },
  {
    id: "editorial-minimalist",
    name: "Editorial Minimalist",
    isActive: false,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    referenceImages: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    ],
    genderAge: "Frau, Ende 20",
    hairFace: "Glatte braune Haare nach hinten gesteckt, natürliche Gesichtszüge, neutraler selbstbewusster Ausdruck",
    wardrobe: "Dunkelgrauer Oversize-Wollblazer, schlichtes weißes Seidentop",
    lightingLook: "Weiches diffuses Studio-Licht, kühle Schattentöne, neutraler Beton-Hintergrund",
    framingCamera: "Halbporträt, 50mm, High-End Modemagazin-Ästhetik, natürliche Hauttextur",
    negativePrompt: "Keine Überbelichtung, kein unnatürliches Plastik-Haut-Glätten",
    customPrefix: "Consistent recurring persona: Woman in late 20s, slicked-back brown hair, wearing dark grey oversized blazer, soft high-end studio lighting, minimalist editorial aesthetic.",
    placement: "hook_closing",
    updatedAt: "2026-09-05T06:00:00.000Z",
  },
  {
    id: "cyber-visionary",
    name: "Cyberpunk Visionary",
    isActive: false,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
    referenceImages: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
    ],
    genderAge: "Person, Anfang 30",
    hairFace: "Kurze dunkle Haare, futuristische runde Sonnenbrille mit Stadtspiegelung",
    wardrobe: "Matte schwarze Techwear-Jacke mit dezentem Kragen",
    lightingLook: "Kühles blau-violettes Kantenlicht (#8B5CF6), volumetrischer Dunst, dunkles Interieur",
    framingCamera: "Nahaufnahme, dramatischer Untersicht-Winkel, 35mm Weitwinkel-Porträt",
    negativePrompt: "Kein bunter Anime-Look, keine grellen Neonschilder",
    customPrefix: "Consistent recurring persona: Person wearing round reflective sunglasses and black techwear jacket, violet rimlight, dark atmospheric studio, cinematic high contrast.",
    placement: "all_slides",
    updatedAt: "2026-09-05T06:00:00.000Z",
  },
];

export function assembleClonePrompt(clone: AiCloneProfile): string {
  if (clone.customPrefix && clone.customPrefix.trim()) {
    return clone.customPrefix.trim();
  }
  const parts = [
    clone.genderAge,
    clone.hairFace,
    clone.wardrobe,
    clone.lightingLook,
    clone.framingCamera,
  ].filter(Boolean);
  return parts.join(", ");
}

