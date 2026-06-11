import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerAdminTools } from "../admin";
import { makeMockClient, connectServer, textContent } from "./helpers";

async function setup() {
  const client = makeMockClient();
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerAdminTools(server, client);
  const mcpClient = await connectServer(server);
  return { client, mcpClient };
}

describe("registerAdminTools", () => {
  it("get_me calls GET /user/me", async () => {
    const { client, mcpClient } = await setup();
    const user = { username: "admin", role: "admin" };
    vi.mocked(client.get).mockResolvedValue(user);

    const result = await mcpClient.callTool({ name: "get_me", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/user/me");
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(user) });
  });

  it("list_pending_users calls GET /admin/pending", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue([{ username: "newuser" }]);

    await mcpClient.callTool({ name: "list_pending_users", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/admin/pending");
  });

  it("approve_user calls POST /admin/pending/:username/approve/:role", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ approved: true });

    await mcpClient.callTool({
      name: "approve_user",
      arguments: { username: "newuser", role: "user" },
    });

    expect(client.post).toHaveBeenCalledWith("/admin/pending/newuser/approve/user");
  });

  it("deny_user calls POST /admin/pending/:username/deny", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ denied: true });

    await mcpClient.callTool({ name: "deny_user", arguments: { username: "baduser" } });

    expect(client.post).toHaveBeenCalledWith("/admin/pending/baduser/deny");
  });

  it("send_newsletter calls POST /admin/newsletter with html and optional subject", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ sent: true });

    await mcpClient.callTool({
      name: "send_newsletter",
      arguments: { html: "<h1>Hello</h1>", subject: "Weekly Update" },
    });

    expect(client.post).toHaveBeenCalledWith("/admin/newsletter", {
      html: "<h1>Hello</h1>",
      subject: "Weekly Update",
    });
  });

  it("send_newsletter works without subject", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ sent: true });

    await mcpClient.callTool({
      name: "send_newsletter",
      arguments: { html: "<p>News</p>" },
    });

    expect(client.post).toHaveBeenCalledWith("/admin/newsletter", {
      html: "<p>News</p>",
      subject: undefined,
    });
  });

  it("list_user_profiles calls GET /user/profiles", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.get).mockResolvedValue([{ name: "Profile 1" }]);

    await mcpClient.callTool({ name: "list_user_profiles", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/user/profiles");
  });

  it("create_profile calls POST /user/profile with profileName and avatarId", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.post).mockResolvedValue({ created: true });

    await mcpClient.callTool({
      name: "create_profile",
      arguments: { profileName: "Kids", avatarId: "av1" },
    });

    expect(client.post).toHaveBeenCalledWith("/user/profile", { profileName: "Kids", avatarId: "av1" });
  });

  it("update_profile_avatar calls PUT /user/profile with profileName and avatarId", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.put).mockResolvedValue({ updated: true });

    await mcpClient.callTool({
      name: "update_profile_avatar",
      arguments: { profileName: "Kids", avatarId: "av2" },
    });

    expect(client.put).toHaveBeenCalledWith("/user/profile", { profileName: "Kids", avatarId: "av2" });
  });

  it("delete_profile calls DELETE /user/profile/:name", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ deleted: true });

    await mcpClient.callTool({ name: "delete_profile", arguments: { name: "Kids" } });

    expect(client.del).toHaveBeenCalledWith("/user/profile/Kids");
  });

  it("delete_account calls DELETE /user/account", async () => {
    const { client, mcpClient } = await setup();
    vi.mocked(client.del).mockResolvedValue({ message: "Account deleted successfully" });

    await mcpClient.callTool({ name: "delete_account", arguments: {} });

    expect(client.del).toHaveBeenCalledWith("/user/account");
  });
});
