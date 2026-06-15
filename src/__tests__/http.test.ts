import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerRoutes } from "../api/index";
import type { KawazMcpConfig } from "../config";

vi.mock("../services/client/client", () => ({
    createKawazMcpClient: vi.fn(),
}));

import { createKawazMcpClient } from "../services/client/client";

const mockClient = {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    del: vi.fn().mockResolvedValue({}),
    healthCheck: vi.fn().mockResolvedValue({ backend: "ok", mediaProcessor: "ok" }),
};

const config: KawazMcpConfig = {
    kawazBackendUrl: "http://localhost:8080",
    kawazMediaProcessorUrl: "http://localhost:8081",
    server: {} as any,
};

const VALID_TOKEN = Buffer.from("user:pass").toString("base64");
const MCP_ACCEPT = "application/json, text/event-stream";

const MCP_INIT: Record<string, unknown> = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "0.0.0" },
    },
    id: 1,
};

function createApp() {
    const app = express();
    app.use(express.json());
    registerRoutes(config)(app);
    return app;
}

describe("GET /health", () => {
    it("returns 200 without auth", async () => {
        const res = await request(createApp()).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});

describe("POST /mcp — authentication", () => {
    beforeEach(() => {
        vi.mocked(createKawazMcpClient).mockResolvedValue(mockClient as any);
    });

    it("returns 401 with no Authorization header", async () => {
        const res = await request(createApp())
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .send(MCP_INIT);
        expect(res.status).toBe(401);
    });

    it("returns 401 with non-Basic scheme", async () => {
        const res = await request(createApp())
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("Authorization", "Bearer sometoken")
            .send(MCP_INIT);
        expect(res.status).toBe(401);
    });

    it("returns 401 when backend rejects credentials", async () => {
        vi.mocked(createKawazMcpClient).mockRejectedValue(new Error("Login failed (401)"));
        const res = await request(createApp())
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("Authorization", `Basic ${VALID_TOKEN}`)
            .send(MCP_INIT);
        expect(res.status).toBe(401);
    });

    it("returns 200 and Mcp-Session-Id with valid credentials", async () => {
        const res = await request(createApp())
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("Authorization", `Basic ${VALID_TOKEN}`)
            .send(MCP_INIT);
        expect(res.status).toBe(200);
        expect(res.headers["mcp-session-id"]).toBeDefined();
    });

    it("passes decoded username and password to createKawazMcpClient", async () => {
        const token = Buffer.from("alice:s3cret").toString("base64");
        await request(createApp())
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("Authorization", `Basic ${token}`)
            .send(MCP_INIT);
        expect(createKawazMcpClient).toHaveBeenCalledWith(
            config,
            { username: "alice", password: "s3cret" }
        );
    });
});

describe("POST /mcp — sessions", () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createKawazMcpClient).mockResolvedValue(mockClient as any);
        app = createApp();
    });

    it("returns 401 for unknown session ID", async () => {
        const res = await request(app)
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("mcp-session-id", "nonexistent-session-id")
            .send(MCP_INIT);
        expect(res.status).toBe(401);
    });

    it("reuses existing session without re-authenticating", async () => {
        const initRes = await request(app)
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("Authorization", `Basic ${VALID_TOKEN}`)
            .send(MCP_INIT);

        const sessionId = initRes.headers["mcp-session-id"];
        expect(sessionId).toBeDefined();

        await request(app)
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("mcp-session-id", sessionId)
            .send({ jsonrpc: "2.0", method: "tools/list", id: 2 });

        expect(createKawazMcpClient).toHaveBeenCalledTimes(1);
    });
});

describe("DELETE /mcp", () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        vi.mocked(createKawazMcpClient).mockResolvedValue(mockClient as any);
        app = createApp();
    });

    it("returns 204 with no session ID", async () => {
        const res = await request(app).delete("/mcp");
        expect(res.status).toBe(204);
    });

    it("returns 204 for unknown session ID", async () => {
        const res = await request(app)
            .delete("/mcp")
            .set("mcp-session-id", "nonexistent");
        expect(res.status).toBe(204);
    });

    it("does not require auth", async () => {
        const res = await request(app).delete("/mcp");
        expect(res.status).not.toBe(401);
    });

    it("evicts session so subsequent use returns 401", async () => {
        const initRes = await request(app)
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("Authorization", `Basic ${VALID_TOKEN}`)
            .send(MCP_INIT);

        const sessionId = initRes.headers["mcp-session-id"];

        await request(app).delete("/mcp").set("mcp-session-id", sessionId);

        const res = await request(app)
            .post("/mcp")
            .set("Accept", MCP_ACCEPT)
            .set("mcp-session-id", sessionId)
            .send({ jsonrpc: "2.0", method: "tools/list", id: 2 });

        expect(res.status).toBe(401);
    });
});
