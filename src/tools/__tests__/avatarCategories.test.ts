import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerAvatarCategoryTools } from "../avatarCategories";
import { makeMockClient, connectServer, textContent } from "./helpers";

async function setup() {
  const client = makeMockClient();
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerAvatarCategoryTools(server, client);
  const mcpClient = await connectServer(server);
  return { client, mcpClient };
}

describe("registerAvatarCategoryTools", () => {
  it("list_avatar_categories calls GET /avatarCategory", async () => {
    const { client, mcpClient } = await setup();
    const categories = [{ _id: "cat1", name: "Animals" }];
    vi.mocked(client.get).mockResolvedValue(categories);

    const result = await mcpClient.callTool({ name: "list_avatar_categories", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/avatarCategory");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(categories) });
  });

  it("get_avatar_category calls GET /avatarCategory/:categoryId", async () => {
    const { client, mcpClient } = await setup();
    const category = { _id: "cat1", name: "Animals" };
    vi.mocked(client.get).mockResolvedValue(category);

    const result = await mcpClient.callTool({ name: "get_avatar_category", arguments: { categoryId: "cat1" } });

    expect(client.get).toHaveBeenCalledWith("/avatarCategory/cat1");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(category) });
  });

  it("create_avatar_category calls POST /avatarCategory with name", async () => {
    const { client, mcpClient } = await setup();
    const created = { _id: "cat2", name: "Sports" };
    vi.mocked(client.post).mockResolvedValue(created);

    const result = await mcpClient.callTool({ name: "create_avatar_category", arguments: { name: "Sports" } });

    expect(client.post).toHaveBeenCalledWith("/avatarCategory", { name: "Sports" });
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(created) });
  });

  it("delete_avatar_category calls DELETE /avatarCategory/:categoryId", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ deleted: true });

    await mcpClient.callTool({ name: "delete_avatar_category", arguments: { categoryId: "cat1" } });

    expect(client.del).toHaveBeenCalledWith("/avatarCategory/cat1");
  });
});
