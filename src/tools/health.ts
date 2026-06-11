import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { KawazMcpClient } from "../services/client/client";

export const registerHealthTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "check_health",
    { description: "Check the health of kawaz-backend and media-processor services" },
    async () => {
      const status = await client.healthCheck();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }],
      };
    }
  );
};
