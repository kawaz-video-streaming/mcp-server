import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerAvatarTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "list_avatars",
    { description: "List all avatars" },
    async () => text(await client.get("/avatar"))
  );

  server.registerTool(
    "get_avatar",
    {
      description: "Get metadata for a specific avatar by ID",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the avatar") },
    },
    async ({ id }) => text(await client.get(`/avatar/${id}`))
  );

  server.registerTool(
    "delete_avatar",
    {
      description: "Delete an avatar from the database and storage (admin only)",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the avatar to delete") },
    },
    async ({ id }) => text(await client.del(`/avatar/${id}`))
  );
};
