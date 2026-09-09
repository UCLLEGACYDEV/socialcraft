import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools";
import { registerPromptsAndResources } from "./prompts";

export function createSocialcraftMcpServer(): McpServer {
  const server = new McpServer({
    name: "socialcraft-mcp",
    version: "1.0.0",
  });

  registerTools(server);
  registerPromptsAndResources(server);

  return server;
}
