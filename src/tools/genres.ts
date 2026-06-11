import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerGenreTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "list_genres",
    { description: "List all media genres" },
    async () => text(await client.get("/mediaGenre"))
  );

  server.registerTool(
    "get_genre",
    {
      description: "Get a specific media genre by ID",
      inputSchema: { genreId: z.string().describe("MongoDB ObjectId of the genre") },
    },
    async ({ genreId }) => text(await client.get(`/mediaGenre/${genreId}`))
  );

  server.registerTool(
    "create_genre",
    {
      description: "Create a new media genre (admin only). Genre names must be unique.",
      inputSchema: { name: z.string().min(1).describe("Genre name") },
    },
    async ({ name }) => text(await client.post("/mediaGenre", { name }))
  );

  server.registerTool(
    "delete_genre",
    {
      description: "Delete a media genre by name (admin only). Fails if the genre is referenced by any media or collection.",
      inputSchema: { name: z.string().min(1).describe("Genre name to delete") },
    },
    async ({ name }) => text(await client.del("/mediaGenre", { name }))
  );
};
