/**
 * Post for Me (https://api.postforme.dev) TypeScript Interface Definitions
 * Reference: https://api.postforme.dev/docs (OpenAPI 3.0 Specification)
 */

export type PostForMePlatform =
  | "bluesky"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "tiktok"
  | "x"
  | "youtube";

export type PostForMePostStatus = "draft" | "scheduled" | "processing" | "processed";

export interface PostForMeSocialAccount {
  id: string; // e.g. "spc_xxxxxx"
  platform: PostForMePlatform | string;
  username?: string;
  display_name?: string;
  profile_picture_url?: string;
  status: "connected" | "disconnected";
  external_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PostForMeMediaItem {
  url: string;
}

export interface PostForMePinterestConfiguration {
  /** Board the pin is published to. Pinterest rejects pins without a board. */
  board_id?: string;
  /** Destination link opened when the pin is tapped. */
  link?: string;
  /** Pin title (falls back to the post caption's first line). */
  title?: string;
}

export interface PostForMePlatformConfiguration {
  pinterest?: PostForMePinterestConfiguration;
  [key: string]: any;
}

export interface PostForMeCreatePostDto {
  /** Array of social account IDs (e.g. ['spc_...']) to publish or schedule to */
  social_accounts: string[];
  /** Post caption / copy text */
  caption: string;
  /** ISO Date string for scheduling (e.g. '2026-09-08T18:00:00Z'). If omitted or null, post is published immediately */
  scheduled_at?: string | null;
  /** Media URLs to attach (images, carousels, videos) */
  media?: PostForMeMediaItem[];
  /** Optional platform specific content variations or configurations */
  platform_configurations?: PostForMePlatformConfiguration;
}

export interface PostForMeSocialPost {
  id: string; // e.g. "sp_xxxxxx"
  caption: string;
  status: PostForMePostStatus;
  scheduled_at?: string | null;
  social_accounts: string[];
  media?: PostForMeMediaItem[];
  created_at: string;
  updated_at: string;
}

export interface PostForMePostResult {
  id: string;
  post_id: string;
  platform: string;
  social_account_id: string;
  status: "success" | "failure" | "pending";
  platform_url?: string;
  error_message?: string;
  created_at?: string;
}

export interface PostForMePlatformPostMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  saves?: number;
  [key: string]: any;
}

export interface PostForMePlatformPost {
  id: string;
  platform: string;
  caption?: string;
  url?: string;
  media?: PostForMeMediaItem[];
  created_at?: string;
  metrics?: PostForMePlatformPostMetrics;
}

export interface PostForMeFeedResponse {
  data: PostForMePlatformPost[];
  meta: {
    cursor?: string;
    limit: number;
    next?: string | null;
    has_more?: boolean;
  };
}

export interface PostForMeSocialPostPreview {
  social_account_id: string;
  platform: string;
  caption: string;
  media?: PostForMeMediaItem[];
  preview_html?: string;
}

export interface PostForMeWebhookDto {
  id: string; // e.g. "wbh_xxxxxx"
  url: string;
  event_type: string;
  secret?: string;
  created_at?: string;
}

export interface PostForMePaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    next: string | null;
  };
}

export interface PostForMeAuthUrlResponse {
  url: string;
}

export interface PostForMeUploadUrlResponse {
  media_url: string;
  upload_url: string;
}
