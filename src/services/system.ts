import { KawazMcpConfig } from "../config";
import { createKawazMcpClient } from "./client/client";
import { createKawazMcpServer } from "./server";

export class KawazMcpSystem {
    constructor(private config: KawazMcpConfig) {
    }

    async start() {
        const client = await createKawazMcpClient(this.config);
        const server = createKawazMcpServer(client);
        server.start();
    }
}