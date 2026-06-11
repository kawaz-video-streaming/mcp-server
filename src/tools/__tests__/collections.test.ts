import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerCollectionTools } from "../collections";
import { makeMockClient, connectServer, textContent } from "./helpers";

async function setup() {
  const client = makeMockClient();
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerCollectionTools(server, client);
  const mcpClient = await connectServer(server);
  return { client, mcpClient };
}

describe("registerCollectionTools", () => {
  it("list_collections calls GET /media-collection", async () => {
    const { client, mcpClient } = await setup();
    const collections = [{ id: "col1", title: "Action" }];
    vi.mocked(client.get).mockResolvedValue(collections);

    const result = await mcpClient.callTool({ name: "list_collections", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/media-collection");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(collections) });
  });

  it("get_collection calls GET /media-collection/:id", async () => {
    const { client, mcpClient } = await setup();
    const col = { id: "col1", title: "Action" };
    vi.mocked(client.get).mockResolvedValue(col);

    const result = await mcpClient.callTool({ name: "get_collection", arguments: { id: "col1" } });

    expect(client.get).toHaveBeenCalledWith("/media-collection/col1");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(col) });
  });

  it("delete_collection calls DELETE /media-collection/:id", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ deleted: true });

    await mcpClient.callTool({ name: "delete_collection", arguments: { id: "col1" } });

    expect(client.del).toHaveBeenCalledWith("/media-collection/col1");
  });

  it("update_collection calls PUT /media-collection/:id with body fields (excluding id)", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({ updated: true });

    await mcpClient.callTool({
      name: "update_collection",
      arguments: { id: "col1", title: "New Title", genres: ["Action", "Drama"] },
    });

    expect(client.put).toHaveBeenCalledWith("/media-collection/col1", {
      title: "New Title",
      genres: ["Action", "Drama"],
    });
  });

  it("update_collection passes null fields to clear them", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({});

    await mcpClient.callTool({
      name: "update_collection",
      arguments: { id: "col1", description: null, collectionId: null },
    });

    expect(client.put).toHaveBeenCalledWith("/media-collection/col1", {
      description: null,
      collectionId: null,
    });
  });
});
