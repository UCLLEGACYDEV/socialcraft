import type {
  PostForMeSocialAccount,
  PostForMeCreatePostDto,
  PostForMeSocialPost,
  PostForMePostResult,
  PostForMePlatform,
  PostForMePaginatedResponse,
} from "./types";

export const POSTFORME_API_BASE_URL = "https://api.postforme.dev/v1";

export class PostForMeApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = POSTFORME_API_BASE_URL) {
    this.apiKey = apiKey.trim();
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Kein Post for Me API Key hinterlegt. Bitte in den Einstellungen hinterlegen.");
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
        data.detail ||
        (Array.isArray(data.errors) ? data.errors.map((e: any) => e.message || e).join(", ") : null) ||
        `Post for Me API Fehler (${response.status}): ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data as T;
  }

  // --- SOCIAL ACCOUNTS ---

  /**
   * Retrieves all connected social accounts
   */
  async getSocialAccounts(): Promise<PostForMeSocialAccount[]> {
    const res = await this.request<any>("/social-accounts");
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  /**
   * Generates an OAuth authorization URL to connect a platform
   * @param platform TikTok, Instagram, LinkedIn, Facebook, X, etc.
   * @param redirectUrl Optional redirect URL back to the application
   */
  async createAuthUrl(
    platform: PostForMePlatform | string,
    redirectUrl?: string
  ): Promise<string> {
    const payload: { platform: string; redirect_url?: string } = {
      platform: platform.toLowerCase(),
    };
    if (redirectUrl) {
      payload.redirect_url = redirectUrl;
    }

    const res = await this.request<any>("/social-accounts/auth-url", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // The API might return { url: "..." } or { data: { url: "..." } }
    const authUrl = res?.data?.url || res?.url;
    if (!authUrl) {
      throw new Error("Konnte keine Authentifizierungs-URL von Post for Me abrufen.");
    }
    return authUrl;
  }

  /**
   * Disconnects / deletes a connected social account
   */
  async disconnectSocialAccount(accountId: string): Promise<boolean> {
    await this.request(`/social-accounts/${accountId}`, {
      method: "DELETE",
    });
    return true;
  }

  // --- SOCIAL POSTS (PUBLISH / SCHEDULE) ---

  /**
   * Creates and schedules or immediately publishes a post
   */
  async createPost(payload: PostForMeCreatePostDto): Promise<PostForMeSocialPost> {
    const res = await this.request<any>("/social-posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res?.data || res;
  }

  /**
   * Lists scheduled and published social posts
   */
  async getPosts(limit = 50, offset = 0): Promise<PostForMePaginatedResponse<PostForMeSocialPost>> {
    const res = await this.request<any>(`/social-posts?limit=${limit}&offset=${offset}`);
    if (res?.data && res?.meta) return res;
    return {
      data: Array.isArray(res) ? res : res?.data || [],
      meta: {
        total: res?.meta?.total || 0,
        offset,
        limit,
        next: res?.meta?.next || null,
      },
    };
  }

  /**
   * Retrieves single post details
   */
  async getPost(postId: string): Promise<PostForMeSocialPost> {
    const res = await this.request<any>(`/social-posts/${postId}`);
    return res?.data || res;
  }

  /**
   * Updates a scheduled post
   */
  async updatePost(postId: string, payload: Partial<PostForMeCreatePostDto>): Promise<PostForMeSocialPost> {
    const res = await this.request<any>(`/social-posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res?.data || res;
  }

  /**
   * Deletes / cancels a post
   */
  async deletePost(postId: string): Promise<boolean> {
    await this.request(`/social-posts/${postId}`, {
      method: "DELETE",
    });
    return true;
  }

  /**
   * Gets execution results and status for each platform for a post
   */
  async getPostResults(postId: string): Promise<PostForMePostResult[]> {
    const res = await this.request<any>(`/social-posts/${postId}/results`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }
}

export function createPostForMeClient(apiKey?: string): PostForMeApiClient | null {
  if (!apiKey || !apiKey.trim()) return null;
  return new PostForMeApiClient(apiKey);
}
