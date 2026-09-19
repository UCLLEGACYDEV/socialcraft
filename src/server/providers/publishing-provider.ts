import type {
  IPublishingProvider,
  PublishPostParams,
  PublishPostResult,
} from "./types";
import { config } from "../../lib/config";

function resolvePostForMeKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 5) return customKey.trim();
  if (typeof process !== "undefined" && process.env) {
    const envKey =
      process.env["POSTFORME_API_KEY"] || process.env["VITE_POSTFORME_API_KEY"];
    if (envKey && envKey.trim().length > 5) return envKey.trim();
  }
  return config.api.postForMeApiKey || "";
}

export class PostForMePublishingProvider implements IPublishingProvider {
  name = "post-for-me";

  async publishOrSchedule(params: PublishPostParams): Promise<PublishPostResult> {
    const apiKey = resolvePostForMeKey(params.apiKey);
    if (!apiKey) {
      throw new Error("Post For Me API-Key nicht konfiguriert.");
    }

    const payload: Record<string, unknown> = {
      social_account_id: params.accountId,
      caption: params.caption,
      media_urls: params.mediaUrls,
    };

    if (params.scheduledAt) {
      payload["scheduled_at"] = params.scheduledAt;
    }

    const resp = await fetch("https://api.postforme.dev/v1/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        success: false,
        status: "failed",
        error: `Publishing fehlgeschlagen (${resp.status}): ${errText}`,
      };
    }

    const data = (await resp.json()) as { id?: string; status?: string };
    return {
      success: true,
      postId: data.id,
      status: data.status || (params.scheduledAt ? "scheduled" : "published"),
    };
  }
}

export const defaultPublishingProvider = new PostForMePublishingProvider();
