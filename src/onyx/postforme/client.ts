import type {
  PostForMeSocialAccount,
  PostForMeCreatePostDto,
  PostForMeSocialPost,
  PostForMePostResult,
  PostForMePlatform,
  PostForMePaginatedResponse,
  PostForMeUploadUrlResponse,
  PostForMeFeedResponse,
  PostForMeSocialPostPreview,
  PostForMeWebhookDto,
  PostForMeMediaItem,
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
    const isBrowser = typeof window !== "undefined";
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    if (isBrowser) {
      try {
        const proxyResp = await fetch("/api/cloud/postforme/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: cleanEndpoint,
            method: options.method || "GET",
            body: options.body
              ? typeof options.body === "string"
                ? JSON.parse(options.body)
                : options.body
              : undefined,
            apiKey: this.apiKey,
          }),
        });

        const proxyData = await proxyResp.json().catch(() => ({}));

        if (!proxyResp.ok) {
          const errorMessage =
            proxyData.message ||
            proxyData.error ||
            proxyData.detail ||
            (Array.isArray(proxyData.errors) ? proxyData.errors.map((e: any) => e.message || e).join(", ") : null) ||
            `Verbindungsfehler (${proxyResp.status}): ${proxyResp.statusText}`;
          throw new Error(errorMessage);
        }

        return proxyData as T;
      } catch (proxyError: any) {
        if (proxyError.message && !proxyError.message.includes("Failed to fetch")) {
          throw proxyError;
        }
        console.warn("[PostForMeClient] Proxy request issue, attempting direct request fallback...", proxyError.message);
      }
    }

    if (!this.apiKey) {
      throw new Error("Kein Post for Me API Key hinterlegt. Bitte in den Einstellungen hinterlegen.");
    }

    const url = `${this.baseUrl}${cleanEndpoint}`;
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

  // --- MEDIA UPLOAD (Signed URLs) ---

  /**
   * Generates a signed upload URL and public media URL
   * POST /v1/media/create-upload-url
   */
  async createUploadUrl(): Promise<PostForMeUploadUrlResponse> {
    const res = await this.request<any>("/media/create-upload-url", {
      method: "POST",
    });
    return res?.data || res;
  }

  /**
   * Uploads a Blob / File directly to Post for Me S3 bucket using signed URL
   */
  async uploadMedia(file: Blob | File, contentType = "image/png"): Promise<string> {
    const { upload_url, media_url } = await this.createUploadUrl();

    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Media Upload fehlgeschlagen (${uploadRes.status}): ${uploadRes.statusText}`);
    }

    return media_url;
  }

  // --- SOCIAL ACCOUNTS ---

  /**
   * Retrieves all connected social accounts with optional filters
   * GET /v1/social-accounts
   */
  async getSocialAccounts(filters?: {
    platform?: string;
    username?: string;
    status?: "connected" | "disconnected";
    limit?: number;
    offset?: number;
  }): Promise<PostForMeSocialAccount[]> {
    const params = new URLSearchParams();
    if (filters?.platform) params.set("platform", filters.platform);
    if (filters?.username) params.set("username", filters.username);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<any>(`/social-accounts${qs}`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  /**
   * Retrieves a single social account by ID
   * GET /v1/social-accounts/{id}
   */
  async getSocialAccount(id: string): Promise<PostForMeSocialAccount> {
    const res = await this.request<any>(`/social-accounts/${id}`);
    return res?.data || res;
  }

  /**
   * Generates an OAuth authorization URL to connect a platform
   * POST /v1/social-accounts/auth-url
   */
  async createAuthUrl(
    platform: PostForMePlatform | string,
    redirectUrlOverride?: string,
    platformDataOverride?: Record<string, any>
  ): Promise<string> {
    const normPlatform = platform.toLowerCase();
    // LinkedIn restricts r_member_postAnalytics on personal member accounts and fails OAuth if requested.
    // Using ['posts'] requests openid, w_member_social, profile, email which works universally.
    const permissions = normPlatform === "linkedin" ? ["posts"] : ["posts", "feeds"];
    const payload: Record<string, any> = {
      platform: normPlatform === "twitter" ? "x" : normPlatform,
      permissions,
    };

    if (normPlatform === "instagram") {
      payload.platform_data = {
        instagram: { connection_type: "instagram" },
      };
    } else if (normPlatform === "x" || normPlatform === "twitter") {
      payload.platform = "x";
      payload.platform_data = {
        x: { connection_type: "oauth2" },
      };
    } else if (normPlatform === "linkedin") {
      // Per Post for Me official specification:
      // "If using our provided credentials always use 'organization'."
      payload.platform_data = {
        linkedin: { connection_type: "organization" },
      };
    }

    if (platformDataOverride) {
      payload.platform_data = {
        ...(payload.platform_data || {}),
        ...platformDataOverride,
      };
    }

    // Quickstart credentials on Post for Me disallow redirect_url_override
    // and automatically route to the dashboard's Project Redirect URL.
    if (redirectUrlOverride && !this.apiKey.startsWith("pfm_live_")) {
      payload.redirect_url_override = redirectUrlOverride;
    }

    try {
      const res = await this.request<any>("/social-accounts/auth-url", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const authUrl = res?.data?.url || res?.url;
      if (!authUrl) {
        throw new Error("Konnte keine Authentifizierungs-URL von Post for Me abrufen.");
      }
      return authUrl;
    } catch (err: any) {
      // If redirect_url_override is rejected because of quickstart system credentials, retry without override
      if (
        payload.redirect_url_override &&
        (err.message?.includes("Redirect URL Override is not allowed") ||
          err.message?.includes("Quickstart"))
      ) {
        delete payload.redirect_url_override;
        const resRetry = await this.request<any>("/social-accounts/auth-url", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const retryUrl = resRetry?.data?.url || resRetry?.url;
        if (retryUrl) return retryUrl;
      }
      throw err;
    }
  }

  /**
   * Disconnects an account (clears tokens, preserves post history)
   * POST /v1/social-accounts/{id}/disconnect
   */
  async disconnectSocialAccount(accountId: string): Promise<boolean> {
    await this.request(`/social-accounts/${accountId}/disconnect`, {
      method: "POST",
    });
    return true;
  }

  /**
   * Permanently deletes a social account and its history
   * DELETE /v1/social-accounts/{id}
   */
  async deleteSocialAccount(accountId: string): Promise<boolean> {
    await this.request(`/social-accounts/${accountId}`, {
      method: "DELETE",
    });
    return true;
  }

  // --- SOCIAL POSTS (PUBLISH / SCHEDULE) ---

  /**
   * Creates and schedules or immediately publishes a post
   * POST /v1/social-posts
   */
  async createPost(payload: PostForMeCreatePostDto): Promise<PostForMeSocialPost> {
    const res = await this.request<any>("/social-posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res?.data || res;
  }

  /**
   * Lists scheduled and published social posts with filtering
   * GET /v1/social-posts
   */
  async getPosts(params?: {
    platform?: string[];
    status?: string[];
    social_account_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<PostForMePaginatedResponse<PostForMeSocialPost>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    if (params?.social_account_id) qs.set("social_account_id", params.social_account_id);
    if (params?.platform) {
      params.platform.forEach((p) => qs.append("platform", p));
    }
    if (params?.status) {
      params.status.forEach((s) => qs.append("status", s));
    }

    const qString = qs.toString() ? `?${qs.toString()}` : "";
    const res = await this.request<any>(`/social-posts${qString}`);
    if (res?.data && res?.meta) return res;
    return {
      data: Array.isArray(res) ? res : res?.data || [],
      meta: {
        total: res?.meta?.total || 0,
        offset: params?.offset || 0,
        limit: params?.limit || 50,
        next: res?.meta?.next || null,
      },
    };
  }

  /**
   * Retrieves single post details
   * GET /v1/social-posts/{id}
   */
  async getPost(postId: string): Promise<PostForMeSocialPost> {
    const res = await this.request<any>(`/social-posts/${postId}`);
    return res?.data || res;
  }

  /**
   * Updates a scheduled post
   * PUT /v1/social-posts/{id}
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
   * DELETE /v1/social-posts/{id}
   */
  async deletePost(postId: string): Promise<boolean> {
    await this.request(`/social-posts/${postId}`, {
      method: "DELETE",
    });
    return true;
  }

  // --- POST RESULTS & PREVIEWS ---

  /**
   * Gets execution results and status for a post or account
   * GET /v1/social-post-results
   */
  async getPostResults(postId?: string): Promise<PostForMePostResult[]> {
    const qs = postId ? `?post_id=${encodeURIComponent(postId)}` : "";
    const res = await this.request<any>(`/social-post-results${qs}`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  /**
   * Creates previews for how a post will look on each platform.
   * POST /v1/social-post-previews
   * Also doubles as a validation call — an invalid post returns 400 with the reason.
   */
  async createPreviews(payload: {
    caption: string;
    preview_social_accounts: Array<{ id: string; platform: string; username?: string }>;
    media?: PostForMeMediaItem[];
    platform_configurations?: PostForMeCreatePostDto["platform_configurations"];
  }): Promise<PostForMeSocialPostPreview[]> {
    const res = await this.request<any>("/social-post-previews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return Array.isArray(res) ? res : res?.data || [];
  }

  // --- SOCIAL ACCOUNT FEEDS & ANALYTICS ---

  /**
   * Retrieves an account's live feed and performance metrics
   * GET /v1/social-account-feeds/{social_account_id}?expand=metrics
   */
  async getAccountFeed(
    socialAccountId: string,
    options?: {
      limit?: number;
      cursor?: string;
      expandMetrics?: boolean;
    }
  ): Promise<PostForMeFeedResponse> {
    const qs = new URLSearchParams();
    if (options?.limit) qs.set("limit", String(options.limit));
    if (options?.cursor) qs.set("cursor", options.cursor);
    if (options?.expandMetrics !== false) qs.set("expand", "metrics");

    const res = await this.request<any>(
      `/social-account-feeds/${socialAccountId}?${qs.toString()}`
    );
    return res;
  }

  // --- WEBHOOKS ---

  /**
   * Lists active webhooks
   * GET /v1/webhooks
   */
  async getWebhooks(): Promise<PostForMeWebhookDto[]> {
    const res = await this.request<any>("/webhooks");
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  /**
   * Creates a webhook subscription
   * POST /v1/webhooks
   */
  async createWebhook(url: string, eventType: string): Promise<PostForMeWebhookDto> {
    const res = await this.request<any>("/webhooks", {
      method: "POST",
      body: JSON.stringify({ url, event_type: eventType }),
    });
    return res?.data || res;
  }

  /**
   * Deletes a webhook subscription
   * DELETE /v1/webhooks/{id}
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    await this.request(`/webhooks/${webhookId}`, {
      method: "DELETE",
    });
    return true;
  }
}

export function createPostForMeClient(apiKey?: string): PostForMeApiClient | null {
  if (!apiKey || !apiKey.trim()) return null;
  return new PostForMeApiClient(apiKey);
}
