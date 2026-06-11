import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerAvatarCategoryTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "list_avatar_categories",
    { description: "List all avatar categories" },
    async () => text(await client.get("/avatarCategory"))
  );

  server.registerTool(
    "get_avatar_category",
    {
      description: "Get a specific avatar category by ID",
      inputSchema: { categoryId: z.string().describe("MongoDB ObjectId of the avatar category") },
    },
    async ({ categoryId }) => text(await client.get(`/avatarCategory/${categoryId}`))
  );

  server.registerTool(
    "create_avatar_category",
    {
      description: "Create a new avatar category (admin only)",
      inputSchema: { name: z.string().min(1).describe("Category name") },
    },
    async ({ name }) => text(await client.post("/avatarCategory", { name }))
  );

  server.registerTool(
    "delete_avatar_category",
    {
      description: "Delete an avatar category (admin only). Fails if the category still contains avatars.",
      inputSchema: { categoryId: z.string().describe("MongoDB ObjectId of the avatar category to delete") },
    },
    async ({ categoryId }) => text(await client.del(`/avatarCategory/${categoryId}`))
  );
};
