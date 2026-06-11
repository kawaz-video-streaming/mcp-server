import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerHealthTools } from "../health";
import { makeMockClient, connectServer, textContent } from "./helpers";

describe("registerHealthTools", () => {
  it("check_health calls client.healthCheck and returns the result as JSON", async () => {
    const status = { backend: "ok", mediaProcessor: "ok" };
    const client = makeMockClient({ healthCheck: vi.fn().mockResolvedValue(status) });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerHealthTools(server, client);
    const mcpClient = await connectServer(server);

    const result = await mcpClient.callTool({ name: "check_health", arguments: {} });

    expect(client.healthCheck).toHaveBeenCalledOnce();
    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(status) });
  });

  it("check_health reflects unreachable services", async () => {
    const status = { backend: "unreachable", mediaProcessor: "unreachable" };
    const client = makeMockClient({ healthCheck: vi.fn().mockResolvedValue(status) });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerHealthTools(server, client);
    const mcpClient = await connectServer(server);

    const result = await mcpClient.callTool({ name: "check_health", arguments: {} });

    expect(result.content[0]).toMatchObject({ type: "text", text: textContent(status) });
  });
});
