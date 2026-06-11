import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerGenreTools } from "../genres";
import { makeMockClient, connectServer, textContent } from "./helpers";

async function setup() {
  const client = makeMockClient();
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerGenreTools(server, client);
  const mcpClient = await connectServer(server);
  return { client, mcpClient };
}

describe("registerGenreTools", () => {
  it("get_genre calls GET /mediaGenre/:genreId", async () => {
    const { client, mcpClient } = await setup();
    const genre = { _id: "g1", name: "Drama" };
    vi.mocked(client.get).mockResolvedValue(genre);

    const result = await mcpClient.callTool({ name: "get_genre", arguments: { genreId: "g1" } });

    expect(client.get).toHaveBeenCalledWith("/mediaGenre/g1");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(genre) });
  });

  it("list_genres calls GET /mediaGenre", async () => {
    const { client, mcpClient } = await setup();
    const genres = ["Action", "Drama"];
    vi.mocked(client.get).mockResolvedValue(genres);

    const result = await mcpClient.callTool({ name: "list_genres", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/mediaGenre");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(genres) });
  });

  it("create_genre calls POST /mediaGenre with name", async () => {
    const { client, mcpClient } = await setup();
    const created = { name: "Horror" };
    vi.mocked(client.post).mockResolvedValue(created);

    const result = await mcpClient.callTool({ name: "create_genre", arguments: { name: "Horror" } });

    expect(client.post).toHaveBeenCalledWith("/mediaGenre", { name: "Horror" });
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(created) });
  });

  it("delete_genre calls DELETE /mediaGenre with name", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ deleted: true });

    await mcpClient.callTool({ name: "delete_genre", arguments: { name: "Horror" } });

    expect(client.del).toHaveBeenCalledWith("/mediaGenre", { name: "Horror" });
  });
});
