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
      description: "Look up movie metadata from TMDB by title and release year (admin only)",
      inputSchema: {
        title: z.string().describe("Movie title to search"),
        year: z.string().describe("Release year"),
      },
    },
    async ({ title, year }) => {
      const query = new URLSearchParams({ title, year });
      return text(await client.get(`/media/tmdb/movie?${query}`));
    }
  );

  server.registerTool(
    "search_tmdb_show",
    {
      description: "Look up TV show metadata from TMDB by title and first air year (admin only)",
      inputSchema: {
        title: z.string().describe("Show title to search"),
        year: z.string().describe("First air year"),
      },
    },
    async ({ title, year }) => {
      const query = new URLSearchParams({ title, year });
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

  server.registerTool(
    "search_tmdb_collection",
    {
      description: "Fetch TMDB collection metadata by collection ID. Genres are the intersection of all parts (admin only).",
      inputSchema: {
        id: z.string().describe("TMDB collection ID"),
      },
    },
    async ({ id }) => text(await client.get(`/media/tmdb/collection?id=${id}`))
  );

  server.registerTool(
    "update_media",
    {
      description: "Update a media item's title, description, kind, episode number, genres, collection, or thumbnail focal point (admin only). Thumbnail image upload is not supported via MCP.",
      inputSchema: {
        id: z.string().describe("MongoDB ObjectId of the media item"),
        title: z.string().describe("Media title"),
        kind: z.enum(["movie", "episode"]).describe("Media kind"),
        description: z.string().nullable().optional().describe("Description (null to clear)"),
        episodeNumber: z.number().optional().describe("Episode number (required when kind is episode)"),
        genres: z.array(z.string()).optional().describe("Genres list"),
        collectionId: z.string().nullable().optional().describe("Parent collection ID (null to clear)"),
        thumbnailFocalPoint: z.object({ x: z.number(), y: z.number() }).optional().describe("Thumbnail crop anchor {x, y} in 0–1 range"),
      },
    },
    async ({ id, ...body }) => text(await client.put(`/media/${id}`, body))
  );

  server.registerTool(
    "initiate_upload",
    {
      description: "Create a media record and return presigned PUT URLs for direct browser-to-storage upload (admin only). Call complete_upload after the file has been uploaded.",
      inputSchema: {
        title: z.string().describe("Media title"),
        fileName: z.string().describe("Original file name"),
        fileSize: z.number().describe("File size in bytes"),
        mimeType: z.string().describe("MIME type (must start with video/)"),
        kind: z.enum(["movie", "episode"]).describe("Media kind"),
        description: z.string().optional().describe("Description"),
        episodeNumber: z.number().optional().describe("Episode number (required when kind is episode)"),
        genres: z.array(z.string()).optional().describe("Genres list"),
        collectionId: z.string().optional().describe("Parent collection ID"),
        thumbnailFocalPoint: z.object({ x: z.number(), y: z.number() }).optional().describe("Thumbnail crop anchor {x, y}"),
      },
    },
    async (body) => text(await client.post("/media/upload/initiate", body))
  );

  server.registerTool(
    "complete_upload",
    {
      description: "Signal that the browser has finished uploading a media file to storage. Triggers the AMQP conversion pipeline (admin only).",
      inputSchema: {
        mediaId: z.string().describe("MongoDB ObjectId of the pending media item to start processing"),
      },
    },
    async ({ mediaId }) => text(await client.post("/media/upload/complete", { mediaId }))
  );

  server.registerTool(
    "initiate_subtitle_upload",
    {
      description: "Reserve a subtitle slot for a media item and return a presigned PUT URL for VTT file upload (admin only). Call complete_subtitle_upload after uploading.",
      inputSchema: {
        id: z.string().describe("MongoDB ObjectId of the media item"),
      },
    },
    async ({ id }) => text(await client.post(`/media/${id}/subtitle/initiate`))
  );

  server.registerTool(
    "complete_subtitle_upload",
    {
      description: "Confirm a VTT subtitle file has been uploaded. Saves the track to the media record and rebuilds the MPEG-DASH manifest (admin only).",
      inputSchema: {
        id: z.string().describe("MongoDB ObjectId of the media item"),
        subtitleId: z.string().describe("Subtitle slot ID returned by initiate_subtitle_upload"),
        language: z.string().describe("ISO 639-2 language code (e.g. 'eng', 'fre')"),
        title: z.string().describe("Display label for the subtitle track"),
      },
    },
    async ({ id, ...body }) => text(await client.post(`/media/${id}/subtitle/complete`, body))
  );

  server.registerTool(
    "update_subtitle",
    {
      description: "Enable/disable or rename a subtitle track on a media item. Rebuilds the MPEG-DASH manifest (admin only).",
      inputSchema: {
        id: z.string().describe("MongoDB ObjectId of the media item"),
        subtitleId: z.string().describe("Subtitle track ID (e.g. 'subtitles_0_eng')"),
        enabled: z.boolean().optional().describe("Enable or disable the track"),
        title: z.string().optional().describe("New display label for the track"),
      },
    },
    async ({ id, subtitleId, ...body }) => text(await client.put(`/media/${id}/subtitle/${subtitleId}`, body))
  );
};
