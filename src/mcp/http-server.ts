import http from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createSocialcraftMcpServer } from "./server";

export function startMcpHttpServer(port = 3005): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const mcpServer = createSocialcraftMcpServer();
    const transports = new Map<string, SSEServerTransport>();

    const server = http.createServer(async (req, res) => {
      // Full CORS
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

      // 2. SSE Connection (Accept text/event-stream OR path /sse OR /mcp OR root GET with SSE accept)
      const wantsSse =
        accept.includes("text/event-stream") ||
        pathname === "/sse" ||
        pathname === "/mcp/sse" ||
        pathname === "/mcp";

      if (req.method === "GET" && wantsSse) {
        console.log(`[SocialCraft MCP] Establishing new SSE connection for client...`);
        const messagesEndpoint = `/messages`;
        const transport = new SSEServerTransport(messagesEndpoint, res);
        transports.set(transport.sessionId, transport);

        transport.onclose = () => {
          console.log(`[SocialCraft MCP] SSE connection closed for session: ${transport.sessionId}`);
          transports.delete(transport.sessionId);
        };

        await mcpServer.connect(transport);
        console.log(`[SocialCraft MCP] SSE connected successfully (Session: ${transport.sessionId})`);
        return;
      }

      // 3. Message Handling (POST to /messages or /sse or /mcp or /)
      if (
        req.method === "POST" &&
        (pathname === "/messages" || pathname === "/sse" || pathname === "/mcp" || pathname === "/")
      ) {
        const sessionId = url.searchParams.get("sessionId");
        let transport = sessionId ? transports.get(sessionId) : undefined;

        // If no sessionId in query, fallback to the latest active transport
        if (!transport && transports.size > 0) {
          const all = Array.from(transports.values());
          transport = all[all.length - 1];
        }

        if (!transport) {
          console.warn(`[SocialCraft MCP] POST message received but no active SSE session found.`);
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session not found. Connect to /sse first." }));
          return;
        }

        await transport.handlePostMessage(req, res);
        return;
      }

      // 4. Default JSON info for browser / health check
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
              toolsCount: 12,
              instructions: "Verwende /sse als SSE-Endpunkt und /messages als Nachrichten-Endpunkt in Claude.",
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
