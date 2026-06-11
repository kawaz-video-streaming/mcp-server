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

  it("search_tmdb_movie calls GET /media/tmdb/movie with title and optional year", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue({ title: "Inception" });

    await mcpClient.callTool({ name: "search_tmdb_movie", arguments: { title: "Inception", year: "2010" } });
    expect(client.get).toHaveBeenCalledWith("/media/tmdb/movie?title=Inception&year=2010");

    vi.mocked(client.get).mockClear();
    await mcpClient.callTool({ name: "search_tmdb_movie", arguments: { title: "Inception" } });
    expect(client.get).toHaveBeenCalledWith("/media/tmdb/movie?title=Inception");
  });

  it("search_tmdb_show calls GET /media/tmdb/show with title and optional year", async () => {
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
});
