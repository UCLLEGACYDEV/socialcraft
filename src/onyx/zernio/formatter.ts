import type {
  ZernioCreatePostPayload,
  ZernioPlatform,
  ZernioPlatformEntry,
  ZernioTikTokSettings,
  ZernioFacebookSettings,
  ZernioInstagramSettings,
} from "./types";

export interface PostFormatInput {
  title: string;
  caption: string;
  hashtags?: string[];
  mediaUrls?: string[];
  mediaType?: "carousel" | "image" | "video";
  platform: ZernioPlatform;
  accountId: string;
  publishNow?: boolean;
  scheduledFor?: string;
  tiktokOptions?: {
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
    allowComments?: boolean;
    allowDuet?: boolean;
    allowStitch?: boolean;
    videoMadeWithAi?: boolean;
    autoAddMusic?: boolean;
    draft?: boolean;
  };
  instagramOptions?: {
    contentType?: "story" | "reel";
    shareToFeed?: boolean;
    isAiGenerated?: boolean;
    firstComment?: string;
  };
  facebookOptions?: {
    firstComment?: string;
    draft?: boolean;
  };
  discordOptions?: {
    channelId?: string;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
  };
}

/**
 * Clean and format hashtags string or array into valid tags
 */
export function formatHashtags(tags?: string[] | string): string {
  if (!tags) return "";
  if (Array.isArray(tags)) {
    return tags
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");
  }
  return tags;
}

/**
 * Strips hashtags and URL fragments from text (needed for TikTok photo carousel title)
 */
export function stripHashtagsAndUrls(text: string): string {
  return text
    .replace(/#[\w\u0590-\u05ff]+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .trim();
}

/**
 * Format payload according to Zernio platform specifications
 */
export function buildZernioPayload(input: PostFormatInput): ZernioCreatePostPayload {
  const {
    title,
    caption,
    hashtags = [],
    mediaUrls = [],
    mediaType = "carousel",
    platform,
    accountId,
    publishNow = true,
    scheduledFor,
    tiktokOptions,
    instagramOptions,
    facebookOptions,
    discordOptions,
  } = input;

  const tagString = formatHashtags(hashtags);
  const fullCaption = [caption, tagString].filter(Boolean).join("\n\n");

  const mediaItems = mediaUrls.map((url) => ({
    type: (mediaType === "video" ? "video" : "image") as "video" | "image",
    url,
  }));

  const platformEntry: ZernioPlatformEntry = {
    platform,
    accountId,
    platformSpecificData: {},
  };

  const payload: ZernioCreatePostPayload = {
    content: fullCaption,
    mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
    platforms: [platformEntry],
    publishNow,
  };

  if (!publishNow && scheduledFor) {
    payload.scheduledFor = scheduledFor;
  }

  // PLATFORM-SPECIFIC TUNING

  if (platform === "tiktok") {
    const isPhotoCarousel = mediaType === "carousel" || (mediaItems.length > 0 && mediaItems.every((m) => m.type === "image"));
    const photoTitle = stripHashtagsAndUrls(title || caption).slice(0, 90) || "New Post";

    const tiktokSettings: ZernioTikTokSettings = {
      privacy_level: tiktokOptions?.privacyLevel || "PUBLIC_TO_EVERYONE",
      allow_comment: tiktokOptions?.allowComments ?? true,
      content_preview_confirmed: true,
      express_consent_given: true,
      video_made_with_ai: tiktokOptions?.videoMadeWithAi ?? false,
      draft: tiktokOptions?.draft ?? false,
    };

    if (isPhotoCarousel) {
      tiktokSettings.media_type = "photo";
      tiktokSettings.photo_cover_index = 0;
      tiktokSettings.description = fullCaption.slice(0, 4000);
      tiktokSettings.auto_add_music = tiktokOptions?.autoAddMusic ?? true;
      payload.content = photoTitle;
    } else {
      tiktokSettings.allow_duet = tiktokOptions?.allowDuet ?? true;
      tiktokSettings.allow_stitch = tiktokOptions?.allowStitch ?? true;
      tiktokSettings.video_cover_timestamp_ms = 1000;
      payload.content = fullCaption.slice(0, 2200);
    }

    payload.tiktokSettings = tiktokSettings;
  } else if (platform === "bluesky") {
    // 300 char hard limit for Bluesky
    if (fullCaption.length > 300) {
      payload.content = fullCaption.slice(0, 297) + "...";
    }
  } else if (platform === "instagram") {
    payload.content = fullCaption.slice(0, 2200);
    platformEntry.platformSpecificData = {
      shareToFeed: instagramOptions?.shareToFeed ?? true,
      isAiGenerated: instagramOptions?.isAiGenerated ?? false,
      firstComment: instagramOptions?.firstComment,
      ...(instagramOptions?.contentType ? { contentType: instagramOptions.contentType } : {}),
    };
  } else if (platform === "facebook") {
    if (facebookOptions?.draft) {
      payload.facebookSettings = { draft: true };
    }
    if (facebookOptions?.firstComment) {
      platformEntry.platformSpecificData = {
        firstComment: facebookOptions.firstComment,
      };
    }
  } else if (platform === "discord") {
    if (discordOptions?.channelId) {
      platformEntry.platformSpecificData = {
        channelId: discordOptions.channelId,
        webhookUsername: discordOptions.webhookUsername,
        webhookAvatarUrl: discordOptions.webhookAvatarUrl,
      };
    }
  }

  return payload;
}
