import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSocialcraftMcpServer } from "./server";
import { getStore, getBrandProfiles, getSocialChannels, getScheduledPosts } from "./store";

async function main() {
  const isTestMode = process.argv.includes("--test");

  if (isTestMode) {
    console.log("=== SocialCraft MCP Server Self-Test ===");
    const store = getStore();
    const profiles = getBrandProfiles();
    const channels = getSocialChannels();
    const posts = getScheduledPosts();

    console.log(`[OK] Store initialized: ${profiles.length} Brand Profiles, ${channels.length} Channels, ${posts.length} Posts.`);
    console.log(`[OK] MCP Server instantiating...`);
    const server = createSocialcraftMcpServer();
    console.log(`[OK] Server created successfully (socialcraft-mcp v1.0.0).`);
    console.log("=== All MCP Server checks passed successfully! ===");
    process.exit(0);
  }

  const server = createSocialcraftMcpServer();
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error("SocialCraft MCP Server started on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting SocialCraft MCP Server:", err);
  process.exit(1);
});
