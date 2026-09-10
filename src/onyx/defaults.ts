import type { AiCloneProfile, ApiSettings, BrandKit, BrandProfile, BriefValues, SocialChannel } from "./types";

export const DEFAULT_BRAND_PROFILES: BrandProfile[] = [
  {
    id: "profile-default",
    slug: "main",
    name: "Haupt-Brand (Socialcraft)",
    description: "Standard-Profil für offizielle Unternehmens-Kanäle",
    avatarUrl: "/images/socialcraft-logo.png",
    color: "#F04A20", // Socialcraft Orange
    createdAt: "2025-01-01T00:00:00Z",
    isDefault: true,
  },
  {
    id: "profile-zitate-tiger",
    slug: "zitate_tiger",
    name: "Zitate Tiger",
    description: "Daily Quotes, Mindset & Motivation Marke",
    avatarUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&h=150&fit=crop&crop=face",
    color: "#EAB308", // Golden Yellow
    createdAt: "2026-02-15T00:00:00Z",
    isDefault: false,
  },
];

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
    profileId: "profile-default",
  },
  {
    id: "ig-main-account",
    platform: "instagram",
    name: "Instagram Business Profil",
    channelId: "ig-socialcraft-pro",
    handle: "@socialcraft.ai",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: false,
    profileId: "profile-default",
  },
  {
    id: "tiktok-main",
    platform: "tiktok",
    name: "TikTok Creator",
    channelId: "tt-socialcraft",
    handle: "@socialcraft",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: false,
    profileId: "profile-default",
  },
  {
    id: "yt-main-channel",
    platform: "youtube",
    name: "YouTube Channel",
    channelId: "UC_socialcraft_official",
    handle: "@socialcraft",
    avatarUrl: "/images/socialcraft-logo.png",
    isDefault: false,
    profileId: "profile-default",
  },
  {
    id: "ig-loyaltytiger",
    platform: "instagram",
    name: "Loyalty Tiger (@loyaltytiger)",
    channelId: "spc_yssDizpOVU5EXP8ANp",
    handle: "@loyaltytiger",
    avatarUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&h=150&fit=crop&crop=face",
    isDefault: true,
    profileId: "profile-zitate-tiger",
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

import { config } from "../lib/config";

// Master-Verankerung des Engine API-Keys (aus .env VITE_KIE_API_KEY)
export const ANCHORED_KIE_API_KEY = config.api.kieApiKey;

// Verankerung des Mega S4 Cloud-Speichers (aus .env VITE_S4_*)
export const ANCHORED_S4_ACCESS_KEY = config.s4.accessKey;
export const ANCHORED_S4_SECRET_KEY = config.s4.secretKey;
export const ANCHORED_S4_ENDPOINT = config.s4.endpoint || "socialgrow.s3.g.megas4.com";
export const ANCHORED_S4_BUCKET = config.s4.bucket || "socialgrow";
export const ANCHORED_S4_REGION = config.s4.region || "eu-central-1";

export const ANCHORED_SUPABASE_URL = config.supabase.url || "https://tugujzoprvfpmhdhhivj.supabase.co";
export const ANCHORED_SUPABASE_KEY = config.supabase.publishableKey;
export const ANCHORED_POSTFORME_API_KEY = config.api.postForMeApiKey;
export const ANCHORED_ZERNIO_WEBHOOK_SECRET = config.api.zernioWebhookSecret;

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
  postForMeApiKey: ANCHORED_POSTFORME_API_KEY,
  zernioWebhookSecret: ANCHORED_ZERNIO_WEBHOOK_SECRET,
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

