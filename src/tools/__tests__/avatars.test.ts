import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerAvatarTools } from "../avatars";
import { makeMockClient, connectServer, textContent } from "./helpers";

async function setup() {
  const client = makeMockClient();
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerAvatarTools(server, client);
  const mcpClient = await connectServer(server);
  return { client, mcpClient };
}

describe("registerAvatarTools", () => {
  it("list_avatars calls GET /avatar", async () => {
    const { client, mcpClient } = await setup();
    const avatars = [{ _id: "av1", name: "Cat" }];
    vi.mocked(client.get).mockResolvedValue(avatars);

    const result = await mcpClient.callTool({ name: "list_avatars", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/avatar");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(avatars) });
  });

  it("get_avatar calls GET /avatar/:id", async () => {
    const { client, mcpClient } = await setup();
    const avatar = { _id: "av1", name: "Cat" };
    vi.mocked(client.get).mockResolvedValue(avatar);

    const result = await mcpClient.callTool({ name: "get_avatar", arguments: { id: "av1" } });

    expect(client.get).toHaveBeenCalledWith("/avatar/av1");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(avatar) });
  });

  it("delete_avatar calls DELETE /avatar/:id", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ deleted: true });

    await mcpClient.callTool({ name: "delete_avatar", arguments: { id: "av1" } });

    expect(client.del).toHaveBeenCalledWith("/avatar/av1");
  });
});
