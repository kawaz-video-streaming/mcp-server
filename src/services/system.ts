import { createServer } from "@ido_kawaz/server-framework";
import { registerRoutes } from "../api";
import { KawazMcpConfig } from "../config";

export class KawazMcpSystem {
    constructor(private config: KawazMcpConfig) {
    }

    async start() {
        const server = createServer(this.config.server, registerRoutes);
        await server.start(this.config);
    }
}