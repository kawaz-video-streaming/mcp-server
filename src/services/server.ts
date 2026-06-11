import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { registerTools } from "../tools";
import { KawazMcpClient } from "./client/client";

export type KawazMcpServer = ReturnType<typeof createKawazMcpServer>;

export const createKawazMcpServer = (client: KawazMcpClient) => {
    const server = new McpServer({
        name: "kawaz-mcp-server",
        version: "1.0.0",
    });
    return {
        start: () => {
            registerTools(server, client);
            const transport = new StdioServerTransport();
            server.connect(transport);
            console.log("MCP server started and connected to transport");
        }
    }

}