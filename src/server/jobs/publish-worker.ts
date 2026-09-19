import { PostForMeApiClient } from "../../onyx/postforme/client";
import { ANCHORED_POSTFORME_API_KEY } from "../../onyx/defaults";
import { getStore, updateScheduledPost } from "../../mcp/store";
import type { Job, ScheduledPost, SocialChannel } from "../../onyx/types";

export interface PublishWorkerOptions {
  apiKey?: string;
}

/**
 * Worker that uploads media and schedules posts via Post for Me API.
 */
export async function processPublishJob(
  job: Job,
  options?: PublishWorkerOptions
): Promise<{ success: boolean; error?: string; externalId?: string }> {
  const store = getStore();
  const payload = job.payload as {
    postId: string;
    apiKey?: string;
  };

  const postId = payload.postId;
  if (!postId) {
    return { success: false, error: "Keine postId im Publish-Job-Payload vorhanden." };
  }

  const post = store.scheduledPosts.find((p) => p.id === postId);
  if (!post) {
    return { success: false, error: `ScheduledPost ${postId} nicht im Store gefunden.` };
  }

  const apiKey = (options?.apiKey || payload.apiKey || ANCHORED_POSTFORME_API_KEY).trim();
  if (!apiKey) {
    return { success: false, error: "Kein Post for Me API-Key vorhanden." };
  }

  const client = new PostForMeApiClient(apiKey);

  // 1. Resolve channel
  const channel = store.socialChannels.find(
    (c) => c.channelId === post.channelId || c.id === post.channelId
  ) || store.socialChannels[0];

  if (!channel) {
    return { success: false, error: "Kein passender Social-Media-Kanal für den Post gefunden." };
  }

  const targetAccount = channel.postForMeAccountId || channel.channelId;

  // 2. Prepare media items (upload remote URLs to Post for Me S3 if needed)
  const mediaUrls: string[] = [];
  for (const url of post.mediaUrls || []) {
    if (!url) continue;
    try {
      // If already a postforme upload or data URL, pass as is, otherwise re-upload for permanence
      if (url.includes("postforme.dev") || url.includes("megas4.com")) {
        mediaUrls.push(url);
      } else {
        const permanentUrl = await client.uploadMediaFromUrl(url, "image/jpeg");
        mediaUrls.push(permanentUrl);
      }
    } catch {
      // Fallback: use raw URL directly
      mediaUrls.push(url);
    }
  }

  // 3. Build caption with hashtags
  const fullCaption = post.caption + (post.hashtags?.length ? `\n\n${post.hashtags.join(" ")}` : "");

  // 4. Create scheduled post via Post for Me
  try {
    const isTikTok = channel.platform === "tiktok";
    const res = await client.createPost({
      caption: fullCaption,
      scheduled_at: post.scheduledFor,
      social_accounts: [targetAccount],
      media: mediaUrls.map((url) => ({ url })),
      platform_configurations: isTikTok
        ? {
            tiktok: {
              is_draft: true, // Draft mode enforced until official audit is complete
            },
          }
        : undefined,
    });

    updateScheduledPost(postId, {
      postForMePostId: res.id,
      postForMeStatus: res.status,
      status: "scheduled",
      mediaUrls,
    });

    return {
      success: true,
      externalId: res.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    updateScheduledPost(postId, {
      errorMessage: errorMsg,
      status: "failed",
    });

    return {
      success: false,
      error: `PostForMe Publishing fehlgeschlagen: ${errorMsg}`,
    };
  }
}
