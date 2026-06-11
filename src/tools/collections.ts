import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { KawazClient } from "../client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerCollectionTools = (server: McpServer, client: KawazClient): void => {
  server.tool(
    "list_collections",
    "List all media collections",
    {},
    async () => text(await client.get("/media-collection"))
  );

  server.tool(
    "get_collection",
    "Get a specific media collection by ID",
    { id: z.string().describe("MongoDB ObjectId of the collection") },
    async ({ id }) => text(await client.get(`/media-collection/${id}`))
  );

  server.tool(
    "delete_collection",
    "Delete a media collection (must be empty — no child media or subcollections) (admin only)",
    { id: z.string().describe("MongoDB ObjectId of the collection to delete") },
    async ({ id }) => text(await client.del(`/media-collection/${id}`))
  );

  server.tool(
    "update_collection",
    "Update a collection's title, description, or genres (admin only). Pass only the fields to change.",
    {
      id: z.string().describe("MongoDB ObjectId of the collection"),
      title: z.string().optional().describe("New title"),
      description: z.string().nullable().optional().describe("New description (null to clear)"),
      genres: z.array(z.string()).optional().describe("New genres list"),
      seasonNumber: z.number().optional().describe("Season number (for season collections)"),
      collectionId: z.string().nullable().optional().describe("Parent collection ID (null to clear)"),
    },
    async ({ id, ...body }) => text(await client.put(`/media-collection/${id}`, body))
  );
};
