import {
  extractConfigFromRequest,
  ensureCloudFolder,
  uploadCloudImage,
  listCloudObjects,
  deleteCloudObjects,
  testCloudConnection,
  getCloudFileObject,
} from "./cloud-storage";
import {
  resolveCloudIdentity,
  normalizeKey,
  isInOwnScope,
  isTrustedAdmin,
  resolveListPrefix,
} from "./cloud-identity";
import {
  readStore,
  syncStoreWithClient,
  addScheduledPost,
  getScheduledPosts,
  getBrandProfiles,
  getSocialChannels,
} from "../mcp/store";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-cloud-access-key, x-cloud-secret-key, x-cloud-endpoint, x-cloud-bucket, x-cloud-region, x-onyx-user-id, x-onyx-user-role",
  "Access-Control-Allow-Credentials": "true",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export async function handleCloudApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const isCloudRoute = pathname.startsWith("/api/cloud/");
  const isWebhookRoute = pathname.startsWith("/api/webhook") || pathname.startsWith("/api/webhooks");
  const isMcpRoute = pathname.startsWith("/api/mcp");

  if (!isCloudRoute && !isWebhookRoute && !isMcpRoute) {
    return null;
  }

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Handle MCP Bridge routes
  if (isMcpRoute) {
    const subRoute = pathname.replace(/^\/api\/mcp\/?/, "").replace(/\/+$/, "");

    if (subRoute === "sync" || subRoute === "") {
      if (request.method === "GET") {
        return jsonResponse(readStore());
      }
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const updated = syncStoreWithClient(body);
          return jsonResponse({ success: true, store: updated });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 400);
        }
      }
    }

    if (subRoute === "posts") {
      if (request.method === "GET") {
        return jsonResponse({ success: true, posts: getScheduledPosts() });
      }
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const created = addScheduledPost(body);
          return jsonResponse({ success: true, post: created });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 400);
        }
      }
    }

    if (subRoute === "profiles") {
      return jsonResponse({ success: true, profiles: getBrandProfiles() });
    }

    if (subRoute === "channels") {
      return jsonResponse({ success: true, channels: getSocialChannels() });
    }

    return jsonResponse({ error: `Unknown MCP endpoint /api/mcp/${subRoute}` }, 404);
  }

  const endpoint = pathname.replace(/^\/api\/(cloud|webhooks?)\/?/, "").replace(/\/+$/, "");

  // 0. Post for Me / Direct Hub Webhook Receiver
  if (
    endpoint === "postforme" ||
    endpoint === "webhook/postforme" ||
    endpoint === "webhooks/postforme" ||
    endpoint === "zernio" ||
    endpoint === "webhook/zernio" ||
    endpoint === "webhooks/zernio" ||
    (isWebhookRoute && (endpoint === "" || endpoint === "postforme" || endpoint === "zernio"))
  ) {
    if (request.method === "GET") {
      return jsonResponse({
        status: "active",
        service: "Socialcraft Post for Me / Direct Hub Webhook Receiver",
        supportedEvents: [
          "post.scheduled",
          "post.processing",
          "post.processed",
          "post.failed",
          "account.connected",
          "account.disconnected",
        ],
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const rawText = await request.text();
      let payload: any = {};
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { raw: rawText };
      }

      const signature =
        request.headers.get("post-for-me-webhook-secret") ||
        request.headers.get("x-post-for-me-secret") ||
        request.headers.get("x-zernio-signature") ||
        request.headers.get("x-webhook-signature") ||
        request.headers.get("x-signature") ||
        "";

      console.log("[Social Webhook Event Received]", {
        event: payload.event || payload.type || payload.status || "post.event",
        timestamp: new Date().toISOString(),
        postId: payload.postId || payload.data?.id || payload.data?._id || payload.id || payload._id,
        signaturePresent: !!signature,
      });

      return jsonResponse({
        received: true,
        event: payload.event || payload.type || "generic",
        status: "acknowledged",
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error("[Zernio Webhook Handling Error]", err);
      return jsonResponse({ received: true, note: "processed with fallback" }, 200);
    }
  }

  // 0.05 TikTok Query Creator Info proxy.
  // The Content Posting API audit requires the "Export to TikTok" screen to render
  // from a LIVE creator_info/query call (nickname, allowed privacy levels, max
  // duration, whether duet/stitch/comment are disabled). Post for Me does not expose
  // this, but its GET /social-accounts/{id} returns the raw TikTok access_token, so
  // we fetch the token server-side and call TikTok directly (browser is CORS-blocked).
  if (endpoint === "tiktok/creator-info") {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    try {
      const body = (await request.json().catch(() => ({}))) as {
        socialAccountId?: string;
        apiKey?: string;
      };
      const pfmEnv =
        (typeof process !== "undefined" && (process.env?.["POSTFORME_API_KEY"] || process.env?.["VITE_POSTFORME_API_KEY"])) ||
        "";
      const pfmKey =
        (body.apiKey && body.apiKey.trim()) ||
        request.headers.get("x-postforme-key") ||
        pfmEnv ||
        "pfm_live_X6AHnibZB1BjEu4j2ef1f4";

      if (!body.socialAccountId) {
        return jsonResponse({ error: "socialAccountId fehlt" }, 400);
      }

      const acctResp = await fetch(
        `https://api.postforme.dev/v1/social-accounts/${encodeURIComponent(body.socialAccountId)}`,
        { headers: { Authorization: `Bearer ${pfmKey}` } }
      );
      const acct = (await acctResp.json().catch(() => ({}))) as any;
      const token: string | undefined = acct?.access_token || acct?.data?.access_token;
      if (!token) {
        return jsonResponse(
          { error: "Kein TikTok Access Token verfügbar (Konto neu verbinden?)" },
          424
        );
      }


      const ttResp = await fetch(
        "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      );
      const ttData = (await ttResp.json().catch(() => ({}))) as any;
      return new Response(JSON.stringify(ttData), {
        status: ttResp.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err: any) {
      return jsonResponse({ error: err?.message || "creator_info fehlgeschlagen" }, 500);
    }
  }

  // 0.1 Post for Me Server Proxy (Prevents browser CORS blocks and protects credentials)
  if (endpoint === "postforme/proxy" || endpoint === "postforme-proxy") {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const reqData = (await request.json().catch(() => ({}))) as {
        endpoint?: string;
        method?: string;
        body?: any;
        apiKey?: string;
      };

      const rawEndpoint: string = reqData.endpoint || "/social-accounts";
      const cleanEndpoint = rawEndpoint.startsWith("/") ? rawEndpoint : `/${rawEndpoint}`;
      const method = (reqData.method || "GET").toUpperCase();

      const apiKey =
        (reqData.apiKey && reqData.apiKey.trim()) ||
        request.headers.get("x-postforme-key") ||
        (typeof process !== "undefined" && process.env?.["POSTFORME_API_KEY"]) ||
        (typeof process !== "undefined" && process.env?.["VITE_POSTFORME_API_KEY"]) ||
        "pfm_live_X6AHnibZB1BjEu4j2ef1f4";

      const targetUrl = `https://api.postforme.dev/v1${cleanEndpoint}`;

      const fetchHeaders: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

      const fetchInit: RequestInit = {
        method,
        headers: fetchHeaders,
      };

      if (reqData.body && ["POST", "PUT", "PATCH"].includes(method)) {
        fetchInit.body = typeof reqData.body === "string" ? reqData.body : JSON.stringify(reqData.body);
      }

      const upstreamResp = await fetch(targetUrl, fetchInit);
      const upstreamText = await upstreamResp.text();
      let responseBody: any;
      try {
        responseBody = JSON.parse(upstreamText);
      } catch {
        responseBody = { raw: upstreamText };
      }

      return new Response(JSON.stringify(responseBody), {
        status: upstreamResp.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (proxyErr: any) {
      console.error("[PostForMe Proxy Error]", proxyErr);
      return jsonResponse({ error: proxyErr.message || "Proxy communication failure" }, 500);
    }
  }

  // 0.1 AI Engine Proxy (Server-side API key protection for KIE.AI / Nano-Banana)
  if (endpoint.startsWith("ai/")) {
    const aiSub = endpoint.replace(/^ai\/?/, "");
    const serverKieKey =
      (typeof process !== "undefined" &&
        (process.env?.["KIE_API_KEY"] || process.env?.["VITE_KIE_API_KEY"])) ||
      "";

    if (aiSub === "credit" && (request.method === "GET" || request.method === "POST")) {
      let customKey = request.headers.get("x-kie-api-key") || "";
      if (!customKey && request.method === "POST") {
        try {
          const body = (await request.clone().json()) as { apiKey?: string };
          if (body?.apiKey) customKey = body.apiKey;
        } catch {}
      }
      const effectiveKey = (customKey || serverKieKey).trim();
      if (!effectiveKey) {
        return jsonResponse(
          { code: 401, msg: "Kein API-Key auf Server oder im Request konfiguriert." },
          401,
        );
      }
      try {
        const resp = await fetch("https://api.kie.ai/api/v1/chat/credit", {
          method: "GET",
          headers: { Authorization: `Bearer ${effectiveKey}` },
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status);
      } catch (err: unknown) {
        return jsonResponse({ code: 500, msg: String(err) }, 500);
      }
    }

    if (aiSub === "create-task" && request.method === "POST") {
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const rawKey = body["apiKey"];
        const customKey =
          (typeof rawKey === "string" ? rawKey : "") ||
          request.headers.get("x-kie-api-key") ||
          "";
        const effectiveKey = (customKey || serverKieKey).trim();
        if (!effectiveKey) {
          return jsonResponse(
            { code: 401, msg: "Kein API-Key auf Server oder im Request konfiguriert." },
            401,
          );
        }
        delete body["apiKey"]; // Do not leak forward
        const resp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${effectiveKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status);
      } catch (err: unknown) {
        return jsonResponse({ code: 500, msg: String(err) }, 500);
      }
    }

    if (aiSub === "task-status" && request.method === "GET") {
      const taskId = url.searchParams.get("taskId");
      if (!taskId) {
        return jsonResponse({ code: 400, msg: "Parameter taskId fehlt." }, 400);
      }
      const customKey = request.headers.get("x-kie-api-key") || "";
      const effectiveKey = (customKey || serverKieKey).trim();
      try {
        const resp = await fetch(
          `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
          {
            method: "GET",
            headers: effectiveKey ? { Authorization: `Bearer ${effectiveKey}` } : {},
          },
        );
        const data = await resp.json();
        return jsonResponse(data, resp.status);
      } catch (err: unknown) {
        return jsonResponse({ code: 500, msg: String(err) }, 500);
      }
    }
  }

  const identity = await resolveCloudIdentity(request);

  // 1. Ensure Folder
  if (endpoint === "ensure-folder" && request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        folderPath?: string;
        user?: { id?: string; name?: string; role?: string; email?: string };
        config?: Record<string, string>;
      };

      const cfg = extractConfigFromRequest(request, body.config as any);
      if (!cfg) {
        return jsonResponse(
          { error: "Cloud-Zugangsdaten nicht konfiguriert (Access Key / Secret Key fehlt)." },
          401
        );
      }

      // The folder is derived from the caller identity; a client-supplied path
      // is only accepted when it lies inside the caller's own folder.
      const requested = body.folderPath ? normalizeKey(body.folderPath) : "";
      const folderPath =
        requested && (isInOwnScope(identity, requested) || isTrustedAdmin(identity))
          ? requested
          : identity.root;

      const res = await ensureCloudFolder(cfg, folderPath, body.user);
      return jsonResponse({ folder: folderPath, ...res });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ordner konnte nicht angelegt werden";
      console.error("[CloudAPI] ensure-folder error:", err);
      return jsonResponse({ error: msg }, 500);
    }
  }

  // 2. Upload Image
  if (endpoint === "upload" && request.method === "POST") {
    try {
      const body = (await request.json()) as {
        imageUrl: string;
        key: string;
        contentType?: string | undefined;
        config?: Record<string, string>;
      };

      if (!body.imageUrl || !body.key) {
        return jsonResponse({ error: "imageUrl and key are required" }, 400);
      }

      const cfg = extractConfigFromRequest(request, body.config as any);
      if (!cfg) {
        return jsonResponse(
          { error: "Cloud-Zugangsdaten nicht konfiguriert (Access Key / Secret Key fehlt)." },
          401
        );
      }

      const key = normalizeKey(body.key);
      if (!isInOwnScope(identity, key)) {
        return jsonResponse({ error: "Kein Zugriff auf diesen Ordner." }, 403);
      }

      const res = await uploadCloudImage(cfg, {
        imageUrl: body.imageUrl,
        key,
        ...(body.contentType ? { contentType: body.contentType } : {}),
      });

      return jsonResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bild-Upload fehlgeschlagen";
      console.error("[CloudAPI] upload error:", err);
      return jsonResponse({ error: msg }, 500);
    }
  }

  // 3. List Objects
  if (endpoint === "list" && request.method === "GET") {
    try {
      const cfg = extractConfigFromRequest(request);
      if (!cfg) {
        return jsonResponse(
          { error: "Cloud-Zugangsdaten nicht konfiguriert." },
          401
        );
      }

      const requested = url.searchParams.get("prefix");
      const scope = url.searchParams.get("scope");
      const sub = url.searchParams.get("sub");

      let prefix: string;
      if (requested && (isInOwnScope(identity, requested) || isTrustedAdmin(identity))) {
        prefix = normalizeKey(requested);
      } else {
        prefix = resolveListPrefix(identity, scope, sub);
      }

      const objects = await listCloudObjects(cfg, prefix);
      return jsonResponse({ success: true, objects, prefix });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Auflistung fehlgeschlagen";
      console.error("[CloudAPI] list error:", err);
      return jsonResponse({ error: msg }, 500);
    }
  }


  // 4. Delete Objects
  if (endpoint === "delete" && request.method === "POST") {
    try {
      const body = (await request.json()) as {
        keys: string[];
        config?: Record<string, string>;
      };

      if (!body.keys || !Array.isArray(body.keys) || body.keys.length === 0) {
        return jsonResponse({ error: "No keys provided" }, 400);
      }

      const cfg = extractConfigFromRequest(request, body.config as any);
      if (!cfg) {
        return jsonResponse({ error: "Cloud-Zugangsdaten fehlen" }, 401);
      }

      const keys = body.keys.map((k) => normalizeKey(String(k)));
      const forbidden = keys.filter((k) => !isInOwnScope(identity, k) && !isTrustedAdmin(identity));
      if (forbidden.length > 0) {
        return jsonResponse({ error: "Kein Zugriff auf diese Dateien." }, 403);
      }

      const res = await deleteCloudObjects(cfg, keys);
      return jsonResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Löschen fehlgeschlagen";
      console.error("[CloudAPI] delete error:", err);
      return jsonResponse({ error: msg }, 500);
    }
  }

  // 5. Test Connection
  if (endpoint === "test" && (request.method === "POST" || request.method === "GET")) {
    try {
      const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
      const cfg = extractConfigFromRequest(request, (body as any)?.config);
      if (!cfg) {
        return jsonResponse(
          { success: false, message: "Bitte gib zuerst deinen Cloud Access Key & Secret Key an." },
          400
        );
      }

      const res = await testCloudConnection(cfg);
      return jsonResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verbindungstest fehlgeschlagen";
      return jsonResponse({ success: false, message: msg }, 500);
    }
  }

  // 6. Stream / Proxy File directly from S4 (with CORS & caching headers)
  if (endpoint === "file" && request.method === "GET") {
    try {
      const key = url.searchParams.get("key");
      if (!key) {
        return new Response("Key parameter missing", { status: 400 });
      }

      const cfg = extractConfigFromRequest(request);
      if (!cfg) {
        return new Response("Cloud credentials missing", { status: 401 });
      }

      const cleanKey = normalizeKey(key);
      if (!isInOwnScope(identity, cleanKey) && !isTrustedAdmin(identity)) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }

      const fileObj = await getCloudFileObject(cfg, cleanKey);
      if (!fileObj) {
        return new Response("Object not found", { status: 404 });
      }

      return new Response(new Uint8Array(fileObj.buffer), {
        status: 200,
        headers: {
          "Content-Type": fileObj.contentType,
          "Content-Length": String(fileObj.contentLength),
          "Cache-Control": "public, max-age=86400",
          ...corsHeaders,
        },
      });
    } catch (err: unknown) {
      console.error("[CloudAPI] file error:", err);
      return new Response("Error streaming file", { status: 500 });
    }
  }

  return jsonResponse({ error: `Unbekannter Cloud-Endpunkt: ${endpoint}` }, 404);
}
