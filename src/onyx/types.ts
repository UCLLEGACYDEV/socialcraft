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
  | "ai-clone"
  | "prompt-gallery"
  | "history";

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
  kieModel: "nano-banana-2" | "nano-banana-2-lite" | "nano-banana-pro";
  kieResolution: "1K" | "2K" | "4K";
  ai33ApiKey: string;
  ai33Model: string;
  geminiApiKey: string;
  proxyEndpoint: string;
  proxyApiKey: string;
  llmProvider: CarouselLlmProvider;
  openaiApiKey: string;
  anthropicApiKey: string;
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
}
