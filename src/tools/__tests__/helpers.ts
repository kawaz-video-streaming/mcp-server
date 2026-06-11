import { vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory";
import type { KawazMcpClient } from "../../services/client/client";

export function makeMockClient(
  overrides: Partial<Record<keyof KawazMcpClient, ReturnType<typeof vi.fn>>> = {}
): KawazMcpClient {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    del: vi.fn().mockResolvedValue({}),
    healthCheck: vi.fn().mockResolvedValue({ backend: "ok", mediaProcessor: "ok" }),
    ...overrides,
  } as unknown as KawazMcpClient;
}

export interface TestClient {
  callTool(params: { name: string; arguments: Record<string, unknown> }): Promise<ToolResult>;
  listTools(): Promise<{ tools: { name: string }[] }>;
}

export async function connectServer(server: McpServer): Promise<TestClient> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return {
    callTool: (params) => client.callTool(params).then((r) => r as unknown as ToolResult),
    listTools: () => client.listTools(),
  };
}

export interface ToolContent {
  type: string;
  text?: string;
}

export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

export function getResult(raw: unknown): ToolResult {
  return raw as ToolResult;
}

export function textContent(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
