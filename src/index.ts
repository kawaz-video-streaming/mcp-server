import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config";
import { createKawazClient } from "./client";
import { registerHealthTools } from "./tools/health";
import { registerMediaTools } from "./tools/media";
import { registerCollectionTools } from "./tools/collections";
import { registerGenreTools } from "./tools/genres";
import { registerAdminTools } from "./tools/admin";

const server = new McpServer({
  name: "kawaz-mcp-server",
  version: "1.0.0",
});

const client = createKawazClient(
  config.KAWAZ_BACKEND_URL,
  config.KAWAZ_MEDIA_PROCESSOR_URL,
  config.KAWAZ_USERNAME,
  config.KAWAZ_PASSWORD
);

registerHealthTools(server, client);
registerMediaTools(server, client);
registerCollectionTools(server, client);
registerGenreTools(server, client);
registerAdminTools(server, client);

const transport = new StdioServerTransport();
server.connect(transport).catch((err: unknown) => {
  process.stderr.write(`Failed to start MCP server: ${err}\n`);
  process.exit(1);
});
