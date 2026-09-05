import type { Plugin } from "vite";
import { handleCloudApiRequest } from "./cloud-api-router";

/**
 * Vite Dev Server Middleware Plugin for Mega S4 Cloud Storage API.
 * Intercepts /api/cloud/* calls during 'vite dev' and routes them to handleCloudApiRequest.
 */
export function viteCloudStoragePlugin(): Plugin {
  return {
    name: "vite-cloud-storage-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/cloud/")) {
          try {
            const host = req.headers.host || "localhost:8080";
            const fullUrl = `http://${host}${req.url}`;
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
              if (v !== undefined) {
                headers.set(k, Array.isArray(v) ? v.join(", ") : v);
              }
            }

            let bodyBuffer: Buffer | undefined;
            if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
              }
              bodyBuffer = Buffer.concat(chunks);
            }

            const webRequest = new Request(fullUrl, {
              method: req.method,
              headers,
              body: bodyBuffer,
            });

            const webResponse = await handleCloudApiRequest(webRequest);
            if (webResponse) {
              res.statusCode = webResponse.status;
              webResponse.headers.forEach((val, key) => {
                res.setHeader(key, val);
              });
              const responseData = await webResponse.arrayBuffer();
              res.end(Buffer.from(responseData));
              return;
            }
          } catch (err) {
            console.error("[ViteCloudStorage] Request error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
            return;
          }
        }
        next();
      });
    },
  };
}
