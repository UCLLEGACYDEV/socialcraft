import http from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createSocialcraftMcpServer } from "./server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface ClientSession {
  transport: SSEServerTransport;
  server: McpServer;
}

export async function startMcpHttpServer(port = 3005): Promise<{ server: http.Server; port: number }> {
  // 1. Streamable HTTP Server instance (Modern MCP protocol, e.g. for Claude Streamable HTTP)
  const streamableServer = createSocialcraftMcpServer();
  const streamableTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless streamable HTTP
  });
  await streamableServer.connect(streamableTransport);
  console.log(`[SocialCraft MCP] Streamable HTTP Transport initialized.`);

  // 2. Active SSE Sessions map for classic SSE transport
  const sseSessions = new Map<string, ClientSession>();

  const server = http.createServer(async (req, res) => {
    // Full CORS headers for web clients and cross-origin probes
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "*");

    // Pre-flight OPTIONS
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health / Probe HEAD requests (used by Claude & status checkers)
    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": "application/json" });
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
          mcp_endpoint: `https://${host}/mcp`,
          sse_endpoint: `https://${host}/sse`,
          transports: ["streamable-http", "sse"],
          capabilities: { tools: true, prompts: true, resources: true },
        })
      );
      return;
    }

    // 2. Streamable HTTP Requests (POST to /mcp or POST to / with jsonrpc)
    const isStreamableHttp =
      pathname === "/mcp" ||
      (req.method === "POST" && accept.includes("text/event-stream") && accept.includes("application/json"));

    if (isStreamableHttp) {
      try {
        await streamableTransport.handleRequest(req, res);
      } catch (err: any) {
        console.error(`[SocialCraft MCP] Error handling Streamable HTTP request:`, err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Internal error" }));
        }
      }
      return;
    }

    // 3. Classic SSE Connection (GET /sse or GET /mcp/sse or Accept: text/event-stream)
    const wantsSse =
      pathname === "/sse" ||
      pathname === "/mcp/sse" ||
      (req.method === "GET" && accept.includes("text/event-stream"));

    if (req.method === "GET" && wantsSse) {
      console.log(`[SocialCraft MCP] Establishing new SSE session...`);
      const clientServer = createSocialcraftMcpServer();
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;

      sseSessions.set(sessionId, { transport, server: clientServer });

      let isClosed = false;
      transport.onclose = async () => {
        if (isClosed) return;
        isClosed = true;
        console.log(`[SocialCraft MCP] Closed SSE session ${sessionId}`);
        sseSessions.delete(sessionId);
        try {
          await clientServer.close();
        } catch {
          /* ignore */
        }
      };

      try {
        await clientServer.connect(transport);
        console.log(`[SocialCraft MCP] Connected SSE session: ${sessionId} (Active: ${sseSessions.size})`);
      } catch (err) {
        console.error(`[SocialCraft MCP] Error connecting SSE session:`, err);
      }
      return;
    }

    // 4. SSE Message Handling (POST to /messages or POST to /sse?sessionId=)
    if (req.method === "POST" && (pathname === "/messages" || pathname === "/sse")) {
      const sessionId = url.searchParams.get("sessionId");
      let session = sessionId ? sseSessions.get(sessionId) : undefined;

      if (!session && sseSessions.size > 0) {
        const all = Array.from(sseSessions.values());
        session = all[all.length - 1];
      }

      if (!session) {
        console.warn(`[SocialCraft MCP] POST message received but no active SSE session found.`);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No active SSE session found. Connect to /sse first." }));
        return;
      }

      try {
        await session.transport.handlePostMessage(req, res);
      } catch (err: any) {
        console.error(`[SocialCraft MCP] Error handling SSE post message:`, err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Internal error" }));
        }
      }
      return;
    }

    // 5. Default Service Status (GET / or GET /status)
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: "active",
            name: "SocialCraft Remote MCP Server",
            version: "1.0.0",
            transports: ["streamable-http", "sse"],
            streamableHttpEndpoint: `https://${host}/mcp`,
            sseEndpoint: `https://${host}/sse`,
            messagesEndpoint: `https://${host}/messages`,
            activeSseSessions: sseSessions.size,
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

  return new Promise((resolve) => {
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
