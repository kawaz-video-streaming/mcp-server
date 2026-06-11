import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerCollectionTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "list_collections",
    { description: "List all media collections" },
    async () => text(await client.get("/media-collection"))
  );

  server.registerTool(
    "get_collection",
    {
      description: "Get a specific media collection by ID",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the collection") },
    },
    async ({ id }) => text(await client.get(`/media-collection/${id}`))
  );

  server.registerTool(
    "delete_collection",
    {
      description: "Delete a media collection (must be empty — no child media or subcollections) (admin only)",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the collection to delete") },
    },
    async ({ id }) => text(await client.del(`/media-collection/${id}`))
  );

  server.registerTool(
    "update_collection",
    {
      description: "Update a collection's title, description, or genres (admin only). Pass only the fields to change.",
      inputSchema: {
        id: z.string().describe("MongoDB ObjectId of the collection"),
        title: z.string().optional().describe("New title"),
        description: z.string().nullable().optional().describe("New description (null to clear)"),
        genres: z.array(z.string()).optional().describe("New genres list"),
        seasonNumber: z.number().optional().describe("Season number (for season collections)"),
        collectionId: z.string().nullable().optional().describe("Parent collection ID (null to clear)"),
      },
    },
    async ({ id, ...body }) => text(await client.put(`/media-collection/${id}`, body))
  );
};
