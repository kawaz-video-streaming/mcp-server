import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { KawazClient } from "../client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerMediaTools = (server: McpServer, client: KawazClient): void => {
  server.tool(
    "list_media",
    "List all completed media items",
    {},
    async () => text(await client.get("/media"))
  );

  server.tool(
    "list_uploading_media",
    "List all media items currently pending, processing, or failed",
    {},
    async () => text(await client.get("/media/uploading"))
  );

  server.tool(
    "get_media",
    "Get metadata for a specific media item by ID",
    { id: z.string().describe("MongoDB ObjectId of the media item") },
    async ({ id }) => text(await client.get(`/media/${id}`))
  );

  server.tool(
    "get_media_progress",
    "Get the current conversion status and percentage for a media item",
    { id: z.string().describe("MongoDB ObjectId of the media item") },
    async ({ id }) => text(await client.get(`/media/${id}/progress`))
  );

  server.tool(
    "delete_media",
    "Delete a media item from the database and VOD storage (admin only)",
    { id: z.string().describe("MongoDB ObjectId of the media item to delete") },
    async ({ id }) => text(await client.del(`/media/${id}`))
  );

  server.tool(
    "search_tmdb_movie",
    "Look up movie metadata from TMDB by title and optional year (admin only)",
    {
      title: z.string().describe("Movie title to search"),
      year: z.string().optional().describe("Release year (optional, improves accuracy)"),
    },
    async ({ title, year }) => {
      const query = new URLSearchParams({ title, ...(year ? { year } : {}) });
      return text(await client.get(`/media/tmdb/movie?${query}`));
    }
  );

  server.tool(
    "search_tmdb_show",
    "Look up TV show metadata from TMDB by title and optional year (admin only)",
    {
      title: z.string().describe("Show title to search"),
      year: z.string().optional().describe("First air year (optional)"),
    },
    async ({ title, year }) => {
      const query = new URLSearchParams({ title, ...(year ? { year } : {}) });
      return text(await client.get(`/media/tmdb/show?${query}`));
    }
  );

  server.tool(
    "search_tmdb_episode",
    "Look up TV episode metadata from TMDB (admin only)",
    {
      showTitle: z.string().describe("Show title"),
      showYear: z.string().describe("Show first air year"),
      seasonNumber: z.string().describe("Season number"),
      episodeNumber: z.string().describe("Episode number"),
    },
    async ({ showTitle, showYear, seasonNumber, episodeNumber }) => {
      const query = new URLSearchParams({ showTitle, showYear, seasonNumber, episodeNumber });
      return text(await client.get(`/media/tmdb/episode?${query}`));
    }
  );

  server.tool(
    "search_tmdb_season",
    "Look up TV season metadata from TMDB (admin only)",
    {
      showTitle: z.string().describe("Show title"),
      showYear: z.string().describe("Show first air year"),
      seasonNumber: z.string().describe("Season number"),
    },
    async ({ showTitle, showYear, seasonNumber }) => {
      const query = new URLSearchParams({ showTitle, showYear, seasonNumber });
      return text(await client.get(`/media/tmdb/season?${query}`));
    }
  );
};
