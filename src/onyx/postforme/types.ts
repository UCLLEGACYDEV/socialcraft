/**
 * Post for Me (https://api.postforme.dev) TypeScript Interface Definitions
 * Reference: https://api.postforme.dev/docs
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

export interface PostForMeCreatePostDto {
  /** Array of social account IDs (e.g. ['spc_...']) to publish or schedule to */
  social_accounts: string[];
  /** Post caption / copy text */
  caption: string;
  /** ISO Date string for scheduling (e.g. '2026-09-08T18:00:00Z'). If omitted or null, post is published immediately */
  scheduled_at?: string | null;
  /** Media URLs to attach (images, carousels, videos) */
  media?: PostForMeMediaItem[];
  /** Optional platform specific configuration overrides */
  platform_configurations?: Record<string, any>;
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
