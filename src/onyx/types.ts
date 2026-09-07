export type { KieModel } from "./kie-api";
export type SlideRole =
  | "hook"
  | "concept"
  | "pain_point"
  | "authority"
  | "expansion"
  | "usp"
  | "proof"
  | "urgency"
  | "closing";

export type CarouselLlmProvider = "gemini" | "openai" | "anthropic";

export type TabKey =
  | "carousel"
  | "bulk"
  | "direct-prompt"
  | "scheduler"
  | "ai-clone"
  | "prompt-gallery"
  | "history";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "bluesky"
  | "discord"
  | "twitter"
  | "pinterest"
  | "threads"
  | "whatsapp"
  | "telegram";

export interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  name: string;
  channelId: string; // e.g. Facebook Page ID or Zernio accountId
  handle?: string;
  avatarUrl?: string;
  businessId?: string;
  accessToken?: string;
  webhookUrl?: string;
  isDefault?: boolean;
  zernioAccountId?: string;
}

export type ScheduledPostStatus = "scheduled" | "queued" | "published" | "draft" | "failed" | "cancelled";

export interface ScheduledPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  mediaType: "carousel" | "image" | "video";
  channelId: string; // matches SocialChannel.id or channelId
  platform: SocialPlatform;
  scheduledFor: string; // ISO Date string
  status: ScheduledPostStatus;
  createdAt: string;
  publishedAt?: string;
  externalPostUrl?: string;
  errorMessage?: string;
  zernioPostId?: string;
  zernioStatus?: string;
  musicTitle?: string;
  musicArtist?: string;
}


export interface SlideContent {
  id: string;
  slideNumber: number;
  role: SlideRole;
  roleLabel: string;
  headline: string;
  subtext: string;
  badge?: string;
  coreMetaphor: string;
  primaryProps: string[];
  visualPrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  renderProgress?: number | undefined;
  renderStatus?: "idle" | "rendering" | "done" | "error" | "cancelled" | undefined;
}

export interface BrandKit {
  handle: string;
  showHandle: boolean;
  accentStyle: string;
  accentColorHex: string;
  fontFamily: string;
  aspectRatio: "4:5" | "1:1";
  ctaText: string;
}

export type ImageProvider =
  | "kie-ai"
  | "ai33-pro"
  | "gemini-imagen"
  | "nano-banana-proxy"
  | "mock";

export interface ApiSettings {
  provider: ImageProvider;
  kieApiKey: string;
  kieWebhookKey: string;
  kieModel: "nano-banana-2" | "nano-banana-2-lite" | "nano-banana-pro" | "gpt-image-2-text-to-image";
  kieResolution: "1K" | "2K" | "4K";
  ai33ApiKey: string;
  ai33Model: string;
  geminiApiKey: string;
  proxyEndpoint: string;
  proxyApiKey: string;
  llmProvider: CarouselLlmProvider;
  openaiApiKey: string;
  anthropicApiKey: string;
  s4Endpoint: string;
  s4Bucket: string;
  s4AccessKey?: string | undefined;
  s4SecretKey?: string | undefined;
  s4Region?: string | undefined;
  s4AutoSave: boolean;
  zernioApiKey?: string | undefined;
  zernioProfileId?: string | undefined;
  zernioWebhookSecret?: string | undefined;
}

export type JobStatus =
  | "queued"
  | "prompts"
  | "rendering"
  | "done"
  | "error"
  | "cancelled";

export interface SeriesJob {
  id: string;
  topic: string;
  audience: string;
  status: JobStatus;
  slidesTotal: number;
  slidesDone: number;
  slides?: SlideContent[];
  errorMsg?: string;
  createdAt: string;
}

export interface BriefValues {
  topic: string;
  audience: string;
  designId: string;
  slideCount: number;
  ctaText: string;
  handle: string;
  provider: CarouselLlmProvider;
  apiKey: string;
  useClone?: boolean;
}

export interface HistoryEntry {
  id: string;
  topic: string;
  slides: SlideContent[];
  createdAt: string;
}

export interface CreditBalanceInfo {
  credits: number;
  formatted: string;
  success: boolean;
}

export interface CreditStatus {
  loading: boolean;
  kie: CreditBalanceInfo;
  ai33: CreditBalanceInfo;
}

export interface ParsedSlide {
  slideNumber: number;
  title: string;
  headline?: string;
  subtext?: string;
  prompt: string;
}

export interface ParsedCarousel {
  title: string;
  titleFromBlock: boolean;
  raw: string;
  slides: ParsedSlide[];
  /** Instagram caption extracted from a "Caption-Vorschlag:" block – NOT a slide */
  caption?: string;
}

export type ClonePlacement = "hook_closing" | "all_slides" | "even_slides" | "custom";

export interface AiCloneProfile {
  id: string;
  name: string;
  isActive: boolean;
  avatarUrl?: string;
  referenceImages: string[];
  genderAge: string;
  hairFace: string;
  tattoosFeatures?: string;
  wardrobe: string;
  lightingLook: string;
  framingCamera: string;
  negativePrompt: string;
  customPrefix: string;
  placement: ClonePlacement;
  analysisSummary?: string[];
  updatedAt: string;
}
