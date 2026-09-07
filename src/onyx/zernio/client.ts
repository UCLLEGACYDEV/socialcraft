import type {
  ZernioProfile,
  ZernioAccount,
  ZernioCreatePostPayload,
  ZernioPostResult,
  ZernioTikTokCreatorInfo,
  ZernioPlatform,
} from "./types";
import { buildZernioPayload, type PostFormatInput } from "./formatter";

export const ZERNIO_API_BASE_URL = "https://zernio.com/api/v1";

export class ZernioApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = ZERNIO_API_BASE_URL) {
    this.apiKey = apiKey.trim();
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Kein Zernio API Key konfiguriert. Bitte in den Einstellungen eintragen.");
    }

    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        `Zernio API Fehler (${response.status}): ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data as T;
  }

  // --- PROFILES ---
  async getProfiles(): Promise<{ profiles: ZernioProfile[] }> {
    return this.request<{ profiles: ZernioProfile[] }>("/profiles");
  }

  async createProfile(name: string, description?: string): Promise<{ profile: ZernioProfile }> {
    return this.request<{ profile: ZernioProfile }>("/profiles", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  // --- CONNECT & ACCOUNTS ---
  async getConnectUrl(platform: ZernioPlatform, profileId?: string): Promise<{ authUrl: string }> {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
    return this.request<{ authUrl: string }>(`/connect/${platform}${query}`);
  }

  async listAccounts(profileId?: string): Promise<{ accounts: ZernioAccount[] }> {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
    return this.request<{ accounts: ZernioAccount[] }>(`/accounts${query}`);
  }

  async getAccountHealth(accountId: string): Promise<any> {
    return this.request(`/accounts/${accountId}/health`);
  }

  // --- TIKTOK SPECIFIC ---
  async getTikTokCreatorInfo(
    accountId: string,
    mediaType: "video" | "photo" = "video"
  ): Promise<ZernioTikTokCreatorInfo> {
    return this.request<ZernioTikTokCreatorInfo>(
      `/accounts/${accountId}/tiktok/creator-info?mediaType=${mediaType}`
    );
  }

  // --- POSTS (PUBLISH / SCHEDULE / DRAFT) ---
  async createPostRaw(payload: ZernioCreatePostPayload): Promise<{ post: ZernioPostResult }> {
    return this.request<{ post: ZernioPostResult }>("/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async publishOrSchedulePost(input: PostFormatInput): Promise<ZernioPostResult> {
    const payload = buildZernioPayload(input);
    const result = await this.createPostRaw(payload);
    return result.post;
  }

  async getPost(postId: string): Promise<{ post: ZernioPostResult }> {
    return this.request<{ post: ZernioPostResult }>(`/posts/${postId}`);
  }

  async deletePost(postId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/posts/${postId}`, {
      method: "DELETE",
    });
  }

  // --- MEDIA PRESIGNING ---
  async presignMedia(filename: string, contentType: string): Promise<{
    uploadUrl: string;
    publicUrl: string;
  }> {
    return this.request<{ uploadUrl: string; publicUrl: string }>("/media/presign", {
      method: "POST",
      body: JSON.stringify({ filename, contentType }),
    });
  }

  // --- ANALYTICS ---
  async getAnalytics(params: {
    platform?: ZernioPlatform;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<{ posts: any[] }> {
    const query = new URLSearchParams();
    if (params.platform) query.set("platform", params.platform);
    if (params.fromDate) query.set("fromDate", params.fromDate);
    if (params.toDate) query.set("toDate", params.toDate);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<{ posts: any[] }>(`/analytics${qs}`);
  }
}

/**
 * Creates a helper instance with the provided API key or from settings
 */
export function createZernioClient(apiKey?: string): ZernioApiClient | null {
  if (!apiKey || !apiKey.trim()) return null;
  return new ZernioApiClient(apiKey);
}
