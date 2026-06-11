import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { KawazClient } from "../client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerGenreTools = (server: McpServer, client: KawazClient): void => {
  server.tool(
    "list_genres",
    "List all media genres",
    {},
    async () => text(await client.get("/mediaGenre"))
  );

  server.tool(
    "create_genre",
    "Create a new media genre (admin only). Genre names must be unique.",
    { name: z.string().min(1).describe("Genre name") },
    async ({ name }) => text(await client.post("/mediaGenre", { name }))
  );

  server.tool(
    "delete_genre",
    "Delete a media genre by name (admin only). Fails if the genre is referenced by any media or collection.",
    { name: z.string().min(1).describe("Genre name to delete") },
    async ({ name }) => text(await client.del("/mediaGenre", { name }))
  );
};
