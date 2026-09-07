import type { SocialPlatform } from "../types";

export type ZernioPlatform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "bluesky"
  | "discord"
  | "twitter"
  | "youtube"
  | "pinterest"
  | "reddit"
  | "threads"
  | "googlebusiness"
  | "telegram"
  | "snapchat"
  | "whatsapp"
  | "slack";

export interface ZernioProfile {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface ZernioAccount {
  _id: string;
  platform: ZernioPlatform;
  profileId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  isConnected: boolean;
  status?: string;
  createdAt?: string;
}

export interface ZernioMediaItem {
  type: "image" | "video";
  url: string;
}

export interface ZernioTikTokSettings {
  privacy_level?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
  allow_comment?: boolean;
  allow_duet?: boolean;
  allow_stitch?: boolean;
  content_preview_confirmed?: boolean;
  express_consent_given?: boolean;
  video_cover_timestamp_ms?: number;
  video_cover_image_url?: string;
  media_type?: "photo";
  photo_cover_index?: number;
  description?: string;
  auto_add_music?: boolean;
  video_made_with_ai?: boolean;
  draft?: boolean;
  commercialContentType?: "none" | "brand_organic" | "brand_content";
}

export interface ZernioFacebookSettings {
  draft?: boolean;
  carouselCards?: Array<{
    link: string;
    name?: string;
    description?: string;
  }>;
  carouselLink?: string;
  textFormatPresetId?: string;
}

export interface ZernioInstagramSettings {
  contentType?: "story" | "reel";
  shareToFeed?: boolean;
  collaborators?: string[];
  userTags?: Array<{
    username: string;
    x?: number;
    y?: number;
    mediaIndex?: number;
  }>;
  isAiGenerated?: boolean;
  isPaidPartnership?: boolean;
  brandedContentSponsors?: string[];
  commentsEnabled?: boolean;
  locationId?: string;
  firstComment?: string;
  muteAudio?: boolean;
  audioName?: string;
  audioConfiguration?: {
    audioId: string;
    audioVolume?: number;
    videoVolume?: number;
  };
}

export interface ZernioBlueskySettings {
  langs?: string[];
  threadItems?: Array<{
    content: string;
    mediaItems?: ZernioMediaItem[];
  }>;
}

export interface ZernioDiscordSettings {
  channelId: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    url?: string;
    footer?: { text: string };
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }>;
  crosspost?: boolean;
  webhookUsername?: string;
  webhookAvatarUrl?: string;
}

export interface ZernioPlatformEntry {
  platform: ZernioPlatform;
  accountId: string;
  platformSpecificData?: {
    contentType?: string;
    firstComment?: string;
    shareToFeed?: boolean;
    pageId?: string;
    facebookSettings?: ZernioFacebookSettings;
    langs?: string[];
    threadItems?: any[];
    channelId?: string;
    embeds?: any[];
    crosspost?: boolean;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
    isAiGenerated?: boolean;
    isPaidPartnership?: boolean;
    brandedContentSponsors?: string[];
    commentsEnabled?: boolean;
    locationId?: string;
    muteAudio?: boolean;
    [key: string]: any;
  };
}

export interface ZernioCreatePostPayload {
  content?: string;
  mediaItems?: ZernioMediaItem[];
  platforms: ZernioPlatformEntry[];
  publishNow?: boolean;
  scheduledFor?: string;
  timezone?: string;
  tiktokSettings?: ZernioTikTokSettings;
  facebookSettings?: ZernioFacebookSettings;
}

export interface ZernioPostResult {
  _id: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "partial" | "failed";
  scheduledFor?: string;
  publishedAt?: string;
  platforms: Array<{
    platform: ZernioPlatform;
    accountId: string;
    status: string;
    platformPostUrl?: string;
    errorMessage?: string;
  }>;
  content?: string;
  createdAt: string;
}

export interface ZernioTikTokCreatorInfo {
  creator: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  privacyLevels: string[];
  postingLimits?: {
    maxPhotosPerPost: number;
    maxVideoDurationSeconds: number;
    allowCommentDefault: boolean;
    allowDuetDefault: boolean;
    allowStitchDefault: boolean;
  };
  commercialContentTypes?: string[];
}
