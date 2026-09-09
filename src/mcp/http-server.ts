import http from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createSocialcraftMcpServer } from "./server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface ClientSession {
  transport: SSEServerTransport;
  server: McpServer;
}

export function startMcpHttpServer(port = 3005): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    // Multi-client / session tracking: Each client connection gets its own McpServer instance
    const sessions = new Map<string, ClientSession>();

    const server = http.createServer(async (req, res) => {
      // Full CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Expose-Headers", "*");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const rawUrl = req.url || "/";
      const host = req.headers.host || `localhost:${port}`;
      const url = new URL(rawUrl, `http://${host}`);
      const pathname = url.pathname;
      const accept = req.headers.accept || "";

      console.log(`[SocialCraft MCP] ${req.method} ${rawUrl} (Accept: ${accept})`);

      // 1. Discovery / OAuth Probe (.well-known)
      if (pathname.startsWith("/.well-known/")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            issuer: `https://${host}`,
            service_documentation: "https://github.com/UCLLEGACYDEV/socialcraft",
            mcp_endpoint: `https://${host}/sse`,
            transport: "sse",
            capabilities: { tools: true, prompts: true, resources: true },
          })
        );
        return;
      }

      // 2. SSE Connection (Accept text/event-stream OR path /sse OR /mcp OR /)
      const wantsSse =
        accept.includes("text/event-stream") ||
        pathname === "/sse" ||
        pathname === "/mcp/sse" ||
        pathname === "/mcp";

      if (req.method === "GET" && wantsSse) {
        console.log(`[SocialCraft MCP] Establishing new isolated SSE session for client...`);
        const clientServer = createSocialcraftMcpServer();
        const transport = new SSEServerTransport("/messages", res);
        
        sessions.set(transport.sessionId, { transport, server: clientServer });

        transport.onclose = async () => {
          console.log(`[SocialCraft MCP] Closing session ${transport.sessionId}`);
          try {
            await clientServer.close();
          } catch {
            /* ignore */
          }
          sessions.delete(transport.sessionId);
        };

        try {
          await clientServer.connect(transport);
          console.log(`[SocialCraft MCP] Connected session: ${transport.sessionId} (Total active: ${sessions.size})`);
        } catch (err) {
          console.error(`[SocialCraft MCP] Error connecting session:`, err);
        }
        return;
      }

      // 3. Message Handling (POST to /messages or /sse or /mcp or /)
      if (
        req.method === "POST" &&
        (pathname === "/messages" || pathname === "/sse" || pathname === "/mcp" || pathname === "/")
      ) {
        const sessionId = url.searchParams.get("sessionId");
        let session = sessionId ? sessions.get(sessionId) : undefined;

        // If no sessionId given, use the most recent active session
        if (!session && sessions.size > 0) {
          const all = Array.from(sessions.values());
          session = all[all.length - 1];
        }

        if (!session) {
          console.warn(`[SocialCraft MCP] POST message received but no active session found.`);
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No active SSE session found. Connect to /sse first." }));
          return;
        }

        try {
          await session.transport.handlePostMessage(req, res);
        } catch (err: any) {
          console.error(`[SocialCraft MCP] Error handling post message:`, err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message || "Internal error" }));
          }
        }
        return;
      }

      // 4. Default JSON info / Health check
      if (req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            {
              status: "active",
              name: "SocialCraft Remote MCP Server",
              version: "1.0.0",
              transport: "sse",
              sseEndpoint: `https://${host}/sse`,
              messagesEndpoint: `https://${host}/messages`,
              activeSessions: sessions.size,
              toolsCount: 12,
            },
            null,
            2
          )
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
    });

    server.listen(port, () => {
      console.log(`[SocialCraft Remote MCP] HTTP Server listening on port ${port}`);
      resolve({ server, port });
    });
  });
}

// CLI Execution
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const port = Number(process.env["PORT"] || 3005);
  startMcpHttpServer(port);
}
