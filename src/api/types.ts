import { Request } from '@ido_kawaz/server-framework';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { KawazMcpClient } from "../services/client/client";

export interface AuthCredentials {
    username: string;
    password: string;
}

export interface Session {
    transport: StreamableHTTPServerTransport;
}

export type Sessions = Map<string, Session>;

export interface RequestWithClient extends Request {
    client: KawazMcpClient;
}