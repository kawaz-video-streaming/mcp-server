import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { KawazMcpClient } from "../services/client/client";
import { registerAdminTools } from "./admin";
import { registerCollectionTools } from "./collections";
import { registerGenreTools } from "./genres";
import { registerHealthTools } from "./health";
import { registerMediaTools } from "./media";

export const registerTools = (server: McpServer, client: KawazMcpClient): void => {
    registerHealthTools(server, client);
    registerMediaTools(server, client);
    registerCollectionTools(server, client);
    registerGenreTools(server, client);
    registerAdminTools(server, client);
};