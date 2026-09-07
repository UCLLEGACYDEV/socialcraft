import type { AiCloneProfile, ApiSettings, BrandKit, BriefValues, SocialChannel } from "./types";

export const DEFAULT_SOCIAL_CHANNELS: SocialChannel[] = [
  {
    id: "fb-main-page",
    platform: "facebook",
    name: "Facebook Unternehmensseite",
    channelId: "337570872768998",
    businessId: "25861095310170488",
    handle: "@facebook.page",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: true,
  },
  {
    id: "ig-main-account",
    platform: "instagram",
    name: "Instagram Business Profil",
    channelId: "ig-socialcraft-pro",
    handle: "@socialcraft.ai",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: false,
  },
  {
    id: "tiktok-main",
    platform: "tiktok",
    name: "TikTok Creator",
    channelId: "tt-socialcraft",
    handle: "@socialcraft",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: false,
  },
  {
    id: "yt-main-channel",
    platform: "youtube",
    name: "YouTube Channel",
    channelId: "UC_socialcraft_official",
    handle: "@socialcraft",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: false,
  },
];

export const DEFAULT_BRAND_KIT: BrandKit = {
  handle: "@dein.name",
  showHandle: true,
  accentStyle: "ember-ignite",
  accentColorHex: "#F04A20",
  fontFamily: "Plus Jakarta Sans",
  aspectRatio: "4:5",
  ctaText: "Speichere dir diesen Post für später ab.",
};

// Feste Master-Verankerung des Engine API-Keys (aus .env VITE_KIE_API_KEY oder festem Code-Fallback)
export const ANCHORED_KIE_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_KIE_API_KEY']) ||
  "4029b7b2ebc1d6e0609bf6559172e335";

// Feste Verankerung des Mega S4 Cloud-Speichers
export const ANCHORED_S4_ACCESS_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_S4_ACCESS_KEY']) ||
  "AKIAPMXGIG3XMUCRBNIX7YA4JKJ2D3P4KQ5FLAPDX4OW";

export const ANCHORED_S4_SECRET_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_S4_SECRET_KEY']) ||
  "uUQ1e7Eov9Pm0BlVqXyzGB8sD5qoMfED68PbN5oz";

export const ANCHORED_S4_ENDPOINT =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_S4_ENDPOINT']) ||
  "socialgrow.s3.g.megas4.com";

export const ANCHORED_S4_BUCKET =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_S4_BUCKET']) ||
  "socialgrow";

export const ANCHORED_S4_REGION =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_S4_REGION']) ||
  "eu-central-1";

export const ANCHORED_SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_SUPABASE_URL']) ||
  "https://tugujzoprvfpmhdhhivj.supabase.co";

export const ANCHORED_SUPABASE_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.['VITE_SUPABASE_PUBLISHABLE_KEY']) ||
  "";

export const DEFAULT_API_SETTINGS: ApiSettings = {
  provider: "kie-ai",
  kieApiKey: ANCHORED_KIE_API_KEY,
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
  s4Endpoint: ANCHORED_S4_ENDPOINT,
  s4Bucket: ANCHORED_S4_BUCKET,
  s4AccessKey: ANCHORED_S4_ACCESS_KEY,
  s4SecretKey: ANCHORED_S4_SECRET_KEY,
  s4Region: ANCHORED_S4_REGION,
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

// Kein vordefinierter Klon-Preset — ein neuer Benutzer erstellt seinen Klon selbst aus 1 Foto
export const DEFAULT_CLONE_PROFILES: AiCloneProfile[] = [];

export function assembleClonePrompt(clone: AiCloneProfile): string {
  if (clone.customPrefix && clone.customPrefix.trim()) {
    return clone.customPrefix.trim();
  }
  const parts = [
    clone.genderAge,
    clone.hairFace,
    clone.tattoosFeatures,
    clone.wardrobe,
    clone.lightingLook,
    clone.framingCamera,
  ].filter(Boolean);
  return parts.join(", ");
}

