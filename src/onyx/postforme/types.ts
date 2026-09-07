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
  /** Boards the pin is published to. Pinterest rejects pins without a board. */
  board_ids?: string[];
  /** Destination link opened when the pin is tapped. */
  link?: string;
  /** Pin title (falls back to the post caption's first line). */
  title?: string;
}

export interface PostForMeTiktokConfiguration {
  /** "public" or "private" (Post for Me maps this to TikTok's privacy_level). */
  privacy_status?: "public" | "private";
  allow_comment?: boolean;
  allow_duet?: boolean;
  allow_stitch?: boolean;
  /** Auto-adds music to photo posts. */
  auto_add_music?: boolean;
  /** Flags the content as AI generated. */
  is_ai_generated?: boolean;
  disclose_your_brand?: boolean;
  disclose_branded_content?: boolean;
  /** Creates a draft upload; posting is completed inside the TikTok app. */
  is_draft?: boolean;
  title?: string;
}

export interface PostForMeInstagramConfiguration {
  placement?: "reels" | "stories" | "timeline";
  /** Instagram usernames tagged as collaborators. */
  collaborators?: string[];
  /** If false, a video only shows in the Reels tab. */
  share_to_feed?: boolean;
  location?: string;
  audio_name?: string;
}

export interface PostForMeFacebookConfiguration {
  placement?: "reels" | "stories" | "timeline";
  location?: string;
  /** Caption on every carousel image (true) vs. only the final post (false). */
  set_caption_for_each_image?: boolean;
}

export interface PostForMePlatformConfiguration {
  pinterest?: PostForMePinterestConfiguration;
  tiktok?: PostForMeTiktokConfiguration;
  tiktok_business?: PostForMeTiktokConfiguration;
  instagram?: PostForMeInstagramConfiguration;
  facebook?: PostForMeFacebookConfiguration;
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
  social_account_id: string;
  /** Whether publishing to this account succeeded. */
  success: boolean;
  /** Present when `success` is false. Free-form object from the platform. */
  error?: Record<string, any> | null;
  /** Detailed logs from the platform attempt. */
  details?: Record<string, any> | null;
  /** Where the published content lives on the platform. */
  platform_data?: { id?: string; url?: string } | null;
  media?: PostForMeMediaItem[] | null;
}

export interface PostForMePlatformPostMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  favorites?: number;
  reach?: number;
  video_views?: number;
  total_time_watched?: number;
  average_time_watched?: number;
  new_followers?: number;
  profile_views?: number;
  website_clicks?: number;
  [key: string]: any;
}

export interface PostForMePlatformPost {
  platform: string;
  posted_at?: string;
  social_post_id?: string | null;
  external_post_id?: string | null;
  platform_post_id?: string;
  social_account_id?: string;
  platform_url?: string;
  caption?: string;
  media?: Array<{ url?: string } | string> | null;
  metrics?: PostForMePlatformPostMetrics | null;
  platform_data?: Record<string, any> | null;
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
