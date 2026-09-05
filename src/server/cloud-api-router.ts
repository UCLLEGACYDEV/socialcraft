import {
  extractConfigFromRequest,
  ensureCloudFolder,
  uploadCloudImage,
  listCloudObjects,
  deleteCloudObjects,
  testCloudConnection,
  getCloudFileObject,
} from "./cloud-storage";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-cloud-access-key, x-cloud-secret-key, x-cloud-endpoint, x-cloud-bucket, x-cloud-region",
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

  if (!pathname.startsWith("/api/cloud/")) {
    return null;
  }

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const endpoint = pathname.replace("/api/cloud/", "").replace(/\/+$/, "");

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

      const folderPath = body.folderPath || (body.user?.role === "admin" ? `USERCONTENT/admins/${body.user.id}` : `USERCONTENT/users/${body.user?.id || "guest"}`);
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

      const res = await uploadCloudImage(cfg, {
        imageUrl: body.imageUrl,
        key: body.key,
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
      const prefix = url.searchParams.get("prefix") || "USERCONTENT/";
      const cfg = extractConfigFromRequest(request);
      if (!cfg) {
        return jsonResponse(
          { error: "Cloud-Zugangsdaten nicht konfiguriert." },
          401
        );
      }

      const objects = await listCloudObjects(cfg, prefix);
      return jsonResponse({ success: true, objects });
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

      const res = await deleteCloudObjects(cfg, body.keys);
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

      const fileObj = await getCloudFileObject(cfg, key);
      if (!fileObj) {
        return new Response("Object not found", { status: 404 });
      }

      return new Response(fileObj.buffer, {
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
