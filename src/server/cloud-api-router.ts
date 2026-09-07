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

  if (!isCloudRoute && !isWebhookRoute) {
    return null;
  }

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const endpoint = pathname.replace(/^\/api\/(cloud|webhooks?)\/?/, "").replace(/\/+$/, "");

  // 0. Zernio / Direct Hub Webhook Receiver
  if (
    endpoint === "zernio" ||
    endpoint === "webhook/zernio" ||
    endpoint === "webhooks/zernio" ||
    (isWebhookRoute && (endpoint === "" || endpoint === "zernio"))
  ) {
    if (request.method === "GET") {
      return jsonResponse({
        status: "active",
        service: "Socialcraft Direct Hub Webhook Receiver",
        supportedEvents: [
          "post.published",
          "post.failed",
          "account.connected",
          "account.disconnected",
          "post.scheduled",
          "media.processed",
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
        request.headers.get("x-zernio-signature") ||
        request.headers.get("x-webhook-signature") ||
        request.headers.get("x-signature") ||
        "";

      console.log("[Zernio Webhook Event Received]", {
        event: payload.event || payload.type || "post.event",
        timestamp: new Date().toISOString(),
        postId: payload.postId || payload.data?._id || payload._id,
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
