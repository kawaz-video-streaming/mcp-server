import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerMediaTools } from "../media";
import { makeMockClient, connectServer, textContent } from "./helpers";

async function setup() {
  const client = makeMockClient();
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerMediaTools(server, client);
  const mcpClient = await connectServer(server);
  return { client, mcpClient };
}

describe("registerMediaTools", () => {
  it("list_media calls GET /media", async () => {
    const { client, mcpClient } = await setup();
    const items = [{ id: "1", title: "Movie" }];
    vi.mocked(client.get).mockResolvedValue(items);

    const result = await mcpClient.callTool({ name: "list_media", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/media");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(items) });
  });

  it("list_uploading_media calls GET /media/uploading", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue([]);

    await mcpClient.callTool({ name: "list_uploading_media", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/media/uploading");
  });

  it("get_media calls GET /media/:id", async () => {
    const { client, mcpClient } = await setup();
    const media = { id: "abc123", title: "Test" };
    vi.mocked(client.get).mockResolvedValue(media);

    const result = await mcpClient.callTool({ name: "get_media", arguments: { id: "abc123" } });

    expect(client.get).toHaveBeenCalledWith("/media/abc123");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(media) });
  });

  it("get_media_progress calls GET /media/:id/progress", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({ progress: 75 });

    await mcpClient.callTool({ name: "get_media_progress", arguments: { id: "abc123" } });

    expect(client.get).toHaveBeenCalledWith("/media/abc123/progress");
  });

  it("delete_media calls DELETE /media/:id", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ deleted: true });

    await mcpClient.callTool({ name: "delete_media", arguments: { id: "abc123" } });

    expect(client.del).toHaveBeenCalledWith("/media/abc123");
  });

  it("search_tmdb_movie calls GET /media/tmdb/movie with title and year", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({ title: "Inception" });

    await mcpClient.callTool({ name: "search_tmdb_movie", arguments: { title: "Inception", year: "2010" } });
    expect(client.get).toHaveBeenCalledWith("/media/tmdb/movie?title=Inception&year=2010");
  });

  it("search_tmdb_show calls GET /media/tmdb/show with title and year", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({});

    await mcpClient.callTool({ name: "search_tmdb_show", arguments: { title: "Breaking Bad", year: "2008" } });
    expect(client.get).toHaveBeenCalledWith("/media/tmdb/show?title=Breaking+Bad&year=2008");
  });

  it("search_tmdb_episode calls GET /media/tmdb/episode with all required params", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({});

    await mcpClient.callTool({
      name: "search_tmdb_episode",
      arguments: { showTitle: "Breaking Bad", showYear: "2008", seasonNumber: "1", episodeNumber: "3" },
    });

    expect(client.get).toHaveBeenCalledWith(
      "/media/tmdb/episode?showTitle=Breaking+Bad&showYear=2008&seasonNumber=1&episodeNumber=3"
    );
  });

  it("search_tmdb_season calls GET /media/tmdb/season", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({});

    await mcpClient.callTool({
      name: "search_tmdb_season",
      arguments: { showTitle: "Breaking Bad", showYear: "2008", seasonNumber: "2" },
    });

    expect(client.get).toHaveBeenCalledWith(
      "/media/tmdb/season?showTitle=Breaking+Bad&showYear=2008&seasonNumber=2"
    );
  });

  it("search_tmdb_collection calls GET /media/tmdb/collection with id", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({ id: 123, name: "The Dark Knight Collection" });

    await mcpClient.callTool({ name: "search_tmdb_collection", arguments: { id: "123" } });

    expect(client.get).toHaveBeenCalledWith("/media/tmdb/collection?id=123");
  });

  it("update_media calls PUT /media/:id with body excluding id", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({ updated: true });

    await mcpClient.callTool({
      name: "update_media",
      arguments: { id: "abc123", title: "New Title", kind: "movie", genres: ["Drama"] },
    });

    expect(client.put).toHaveBeenCalledWith("/media/abc123", { title: "New Title", kind: "movie", genres: ["Drama"] });
  });

  it("update_media passes null description and collectionId to clear them", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({});

    await mcpClient.callTool({
      name: "update_media",
      arguments: { id: "abc123", title: "T", kind: "movie", description: null, collectionId: null },
    });

    expect(client.put).toHaveBeenCalledWith("/media/abc123", {
      title: "T",
      kind: "movie",
      description: null,
      collectionId: null,
    });
  });

  it("initiate_upload calls POST /media/upload/initiate with all fields", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ mediaId: "new1", videoUploadUrl: "https://s3/v", thumbnailUploadUrl: "https://s3/t" });

    await mcpClient.callTool({
      name: "initiate_upload",
      arguments: { title: "My Movie", fileName: "movie.mkv", fileSize: 1000000, mimeType: "video/x-matroska", kind: "movie" },
    });

    expect(client.post).toHaveBeenCalledWith("/media/upload/initiate", {
      title: "My Movie",
      fileName: "movie.mkv",
      fileSize: 1000000,
      mimeType: "video/x-matroska",
      kind: "movie",
    });
  });

  it("complete_upload calls POST /media/upload/complete with mediaId", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ message: "Media processing started" });

    await mcpClient.callTool({ name: "complete_upload", arguments: { mediaId: "abc123" } });

    expect(client.post).toHaveBeenCalledWith("/media/upload/complete", { mediaId: "abc123" });
  });

  it("initiate_subtitle_upload calls POST /media/:id/subtitle/initiate", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ subtitleId: "sub_1", uploadUrl: "https://s3/sub" });

    await mcpClient.callTool({ name: "initiate_subtitle_upload", arguments: { id: "abc123" } });

    expect(client.post).toHaveBeenCalledWith("/media/abc123/subtitle/initiate");
  });

  it("complete_subtitle_upload calls POST /media/:id/subtitle/complete with body excluding id", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ updated: true });

    await mcpClient.callTool({
      name: "complete_subtitle_upload",
      arguments: { id: "abc123", subtitleId: "sub_1", language: "eng", title: "English" },
    });

    expect(client.post).toHaveBeenCalledWith("/media/abc123/subtitle/complete", {
      subtitleId: "sub_1",
      language: "eng",
      title: "English",
    });
  });

  it("update_subtitle calls PUT /media/:id/subtitle/:subtitleId with body excluding id and subtitleId", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({ updated: true });

    await mcpClient.callTool({
      name: "update_subtitle",
      arguments: { id: "abc123", subtitleId: "subtitles_0_eng", enabled: false },
    });

    expect(client.put).toHaveBeenCalledWith("/media/abc123/subtitle/subtitles_0_eng", { enabled: false });
  });

  it("update_subtitle can rename a subtitle track", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({});

    await mcpClient.callTool({
      name: "update_subtitle",
      arguments: { id: "abc123", subtitleId: "subtitles_0_eng", title: "English (SDH)" },
    });

    expect(client.put).toHaveBeenCalledWith("/media/abc123/subtitle/subtitles_0_eng", { title: "English (SDH)" });
  });
});
