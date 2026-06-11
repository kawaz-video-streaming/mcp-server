import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory";
import { registerTools } from "../tools";
import type { KawazMcpClient } from "../services/client/client";

interface ToolContent {
  type: string;
  text?: string;
}

interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

const ALL_TOOL_NAMES = [
  "check_health",
  "list_media",
  "list_uploading_media",
  "get_media",
  "get_media_progress",
  "delete_media",
  "search_tmdb_movie",
  "search_tmdb_show",
  "search_tmdb_episode",
  "search_tmdb_season",
  "list_collections",
  "get_collection",
  "delete_collection",
  "update_collection",
  "list_genres",
  "create_genre",
  "delete_genre",
  "get_me",
  "list_pending_users",
  "approve_user",
  "deny_user",
  "send_newsletter",
  "list_user_profiles",
];

function makeMockClient(): KawazMcpClient {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    del: vi.fn().mockResolvedValue({}),
    healthCheck: vi.fn().mockResolvedValue({ backend: "ok", mediaProcessor: "ok" }),
  } as unknown as KawazMcpClient;
}

async function createTestClient(client: KawazMcpClient) {
  const server = new McpServer({ name: "kawaz-mcp-server", version: "1.0.0" });
  registerTools(server, client);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const raw = new Client({ name: "test-client", version: "0.0.0" });
  await raw.connect(clientTransport);
  return {
    callTool: (params: { name: string; arguments: Record<string, unknown> }) =>
      raw.callTool(params).then((r) => r as unknown as ToolResult),
    listTools: () => raw.listTools(),
  };
}

describe("integration: all tools registered and callable", () => {
  it("lists all expected tools", async () => {
    const client = makeMockClient();
    const mcpClient = await createTestClient(client);

    const { tools } = await mcpClient.listTools();
    const names = tools.map((t) => t.name).sort();

    expect(names).toEqual([...ALL_TOOL_NAMES].sort());
  });

  it("health: check_health returns both service statuses", async () => {
    const status = { backend: "ok", mediaProcessor: "unreachable" };
    const client = makeMockClient();
    vi.mocked(client.healthCheck).mockResolvedValue(status);
    const mcpClient = await createTestClient(client);

    const result = await mcpClient.callTool({ name: "check_health", arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toMatchObject({ type: "text", text: JSON.stringify(status, null, 2) });
  });

  it("media: list_media returns items from backend", async () => {
    const items = [{ id: "m1", title: "Film" }];
    const client = makeMockClient();
    vi.mocked(client.get).mockResolvedValue(items);
    const mcpClient = await createTestClient(client);

    const result = await mcpClient.callTool({ name: "list_media", arguments: {} });

    expect(client.get).toHaveBeenCalledWith("/media");
    expect(result.content[0]).toMatchObject({ type: "text", text: JSON.stringify(items, null, 2) });
  });

  it("collections: update_collection strips id from body", async () => {
    const client = makeMockClient();
    vi.mocked(client.put).mockResolvedValue({ updated: true });
    const mcpClient = await createTestClient(client);

    await mcpClient.callTool({
      name: "update_collection",
      arguments: { id: "col1", title: "Updated" },
    });

    expect(client.put).toHaveBeenCalledWith("/media-collection/col1", { title: "Updated" });
  });

  it("genres: full create → list → delete flow", async () => {
    const client = makeMockClient();
    const mcpClient = await createTestClient(client);

    vi.mocked(client.post).mockResolvedValue({ name: "Thriller" });
    await mcpClient.callTool({ name: "create_genre", arguments: { name: "Thriller" } });
    expect(client.post).toHaveBeenCalledWith("/mediaGenre", { name: "Thriller" });

    vi.mocked(client.get).mockResolvedValue(["Thriller"]);
    await mcpClient.callTool({ name: "list_genres", arguments: {} });
    expect(client.get).toHaveBeenCalledWith("/mediaGenre");

    vi.mocked(client.del).mockResolvedValue({ deleted: true });
    await mcpClient.callTool({ name: "delete_genre", arguments: { name: "Thriller" } });
    expect(client.del).toHaveBeenCalledWith("/mediaGenre", { name: "Thriller" });
  });

  it("admin: approve_user encodes username and role in path", async () => {
    const client = makeMockClient();
    vi.mocked(client.post).mockResolvedValue({ approved: true });
    const mcpClient = await createTestClient(client);

    await mcpClient.callTool({
      name: "approve_user",
      arguments: { username: "alice", role: "special" },
    });

    expect(client.post).toHaveBeenCalledWith("/admin/pending/alice/approve/special");
  });
});
