import type { AiSkill, BrandKit, SlideContent, StructuredCarouselResponse } from "../../onyx/types";

export interface GenerateContentParams {
  topic: string;
  audience?: string;
  slideCount?: number;
  aspectRatio?: "4:5" | "1:1" | "9:16";
  brandKit?: Partial<BrandKit>;
  skill?: Partial<AiSkill>;
  customInstructions?: string;
  apiKey?: string;
  model?: string;
}

export interface RerollPromptParams {
  topic: string;
  slideNumber: number;
  slideCount: number;
  currentHeadline?: string;
  currentPrompt?: string;
  role?: string;
  brandKit?: Partial<BrandKit>;
  skill?: Partial<AiSkill>;
  apiKey?: string;
}

export interface IAiProvider {
  name: string;
  generateContent(params: GenerateContentParams): Promise<StructuredCarouselResponse>;
  rerollSlidePrompt(params: RerollPromptParams): Promise<{ visualPrompt: string; coreMetaphor: string }>;
}

export interface ImageTaskRequest {
  prompt: string;
  aspectRatio?: "4:5" | "1:1" | "9:16";
  referenceImages?: string[];
  apiKey?: string;
}

export interface ImageTaskResult {
  taskId: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  imageUrl?: string;
  progress?: number;
  error?: string;
}

export interface IImageProvider {
  name: string;
  createTask(params: ImageTaskRequest): Promise<{ taskId: string }>;
  getTaskStatus(taskId: string, apiKey?: string): Promise<ImageTaskResult>;
}

export interface PublishPostParams {
  accountId: string;
  platform: string;
  title: string;
  caption: string;
  mediaUrls: string[];
  scheduledAt?: string;
  apiKey?: string;
}

export interface PublishPostResult {
  success: boolean;
  postId?: string;
  status: string;
  error?: string;
}

export interface IPublishingProvider {
  name: string;
  publishOrSchedule(params: PublishPostParams): Promise<PublishPostResult>;
}
