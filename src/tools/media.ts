import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerMediaTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "list_media",
    { description: "List all completed media items" },
    async () => text(await client.get("/media"))
  );

  server.registerTool(
    "list_uploading_media",
    { description: "List all media items currently pending, processing, or failed" },
    async () => text(await client.get("/media/uploading"))
  );

  server.registerTool(
    "get_media",
    {
      description: "Get metadata for a specific media item by ID",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the media item") },
    },
    async ({ id }) => text(await client.get(`/media/${id}`))
  );

  server.registerTool(
    "get_media_progress",
    {
      description: "Get the current conversion status and percentage for a media item",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the media item") },
    },
    async ({ id }) => text(await client.get(`/media/${id}/progress`))
  );

  server.registerTool(
    "delete_media",
    {
      description: "Delete a media item from the database and VOD storage (admin only)",
      inputSchema: { id: z.string().describe("MongoDB ObjectId of the media item to delete") },
    },
    async ({ id }) => text(await client.del(`/media/${id}`))
  );

  server.registerTool(
    "search_tmdb_movie",
    {
      description: "Look up movie metadata from TMDB by title and optional year (admin only)",
      inputSchema: {
        title: z.string().describe("Movie title to search"),
        year: z.string().optional().describe("Release year (optional, improves accuracy)"),
      },
    },
    async ({ title, year }) => {
      const query = new URLSearchParams({ title, ...(year ? { year } : {}) });
      return text(await client.get(`/media/tmdb/movie?${query}`));
    }
  );

  server.registerTool(
    "search_tmdb_show",
    {
      description: "Look up TV show metadata from TMDB by title and optional year (admin only)",
      inputSchema: {
        title: z.string().describe("Show title to search"),
        year: z.string().optional().describe("First air year (optional)"),
      },
    },
    async ({ title, year }) => {
      const query = new URLSearchParams({ title, ...(year ? { year } : {}) });
      return text(await client.get(`/media/tmdb/show?${query}`));
    }
  );

  server.registerTool(
    "search_tmdb_episode",
    {
      description: "Look up TV episode metadata from TMDB (admin only)",
      inputSchema: {
        showTitle: z.string().describe("Show title"),
        showYear: z.string().describe("Show first air year"),
        seasonNumber: z.string().describe("Season number"),
        episodeNumber: z.string().describe("Episode number"),
      },
    },
    async ({ showTitle, showYear, seasonNumber, episodeNumber }) => {
      const query = new URLSearchParams({ showTitle, showYear, seasonNumber, episodeNumber });
      return text(await client.get(`/media/tmdb/episode?${query}`));
    }
  );

  server.registerTool(
    "search_tmdb_season",
    {
      description: "Look up TV season metadata from TMDB (admin only)",
      inputSchema: {
        showTitle: z.string().describe("Show title"),
        showYear: z.string().describe("Show first air year"),
        seasonNumber: z.string().describe("Season number"),
      },
    },
    async ({ showTitle, showYear, seasonNumber }) => {
      const query = new URLSearchParams({ showTitle, showYear, seasonNumber });
      return text(await client.get(`/media/tmdb/season?${query}`));
    }
  );
};
