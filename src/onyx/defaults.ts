import type { ApiSettings, BrandKit, BriefValues } from "./types";

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
