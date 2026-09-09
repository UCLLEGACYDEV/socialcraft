import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { startMcpHttpServer } from "./http-server";

async function main() {
  const port = Number(process.env["PORT"] || 3005);
  console.log(`[1/2] Starte lokalen SocialCraft MCP HTTP Server auf Port ${port}...`);
  await startMcpHttpServer(port);
  console.log(`[OK] Lokaler Server läuft auf http://localhost:${port}/sse`);

  console.log(`[2/2] Starte Cloudflare Tunnel via npx cloudflared...`);
  const cf = spawn("npx", ["--yes", "cloudflared", "tunnel", "--url", `http://localhost:${port}`], {
    shell: true,
  });

  let capturedUrl = "";

  cf.stderr.on("data", (data: Buffer) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !capturedUrl) {
      capturedUrl = match[0];
      const sseUrl = `${capturedUrl}/sse`;
      const messagesUrl = `${capturedUrl}/messages`;

      const dataDir = path.resolve(process.cwd(), "src/server/data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(dataDir, "mcp-remote-url.json"),
        JSON.stringify(
          {
            baseUrl: capturedUrl,
            sseUrl,
            messagesUrl,
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf-8"
      );

      console.log(`\n======================================================`);
      console.log(`🚀 SocialCraft Remote MCP Server ist ONLINE!`);
      console.log(`======================================================`);
      console.log(`🌐 Base URL:      ${capturedUrl}`);
      console.log(`📡 SSE URL:       ${sseUrl}`);
      console.log(`📨 Messages URL:  ${messagesUrl}`);
      console.log(`======================================================\n`);
    }
  });

  cf.on("close", (code) => {
    console.log(`Cloudflare Tunnel beendet (Exit: ${code})`);
    process.exit(0);
  });
}

main();
