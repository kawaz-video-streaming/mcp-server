import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KawazClient } from "../client";

export const registerHealthTools = (server: McpServer, client: KawazClient): void => {
  server.tool(
    "check_health",
    "Check the health of kawaz-backend and media-processor services",
    {},
    async () => {
      const status = await client.healthCheck();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }],
      };
    }
  );
};
