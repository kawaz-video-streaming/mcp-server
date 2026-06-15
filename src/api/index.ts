import { Application } from '@ido_kawaz/server-framework';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { randomUUID } from 'crypto';
import { isNotNil } from 'ramda';
import swaggerUi from 'swagger-ui-express';
import { KawazMcpConfig } from '../config';
import { registerTools } from '../tools';
import { createMcpAuthMiddleware } from './middlewares';
import { RequestWithClient, Session, Sessions } from './types';
import { swaggerSpec } from './swagger';

export const registerRoutes = (config: KawazMcpConfig) =>
    (app: Application) => {
        const sessions: Sessions = new Map<string, Session>();

        /**
         * @openapi
         * /health:
         *   get:
         *     summary: Health check
         *     tags: [Health]
         *     responses:
         *       200:
         *         description: Server is healthy
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 status:
         *                   type: string
         *                   example: ok
         */
        app.get("/health", async (_req, res) => {
            res.status(200).json({ status: "ok" });
        });

        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        /**
         * @openapi
         * /mcp:
         *   delete:
         *     summary: Terminate an MCP session
         *     tags: [MCP]
         *     parameters:
         *       - in: header
         *         name: mcp-session-id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Session closed
         */
        app.delete("/mcp", async (req, res) => {
            const sessionId = req.headers["mcp-session-id"];
            if (isNotNil(sessionId) && typeof sessionId === "string") {
                const session = sessions.get(sessionId);
                if (isNotNil(session)) {
                    await session.transport.close();
                    sessions.delete(sessionId);
                }
            }
            res.status(204).end();
        });

        app.use(createMcpAuthMiddleware(sessions, config));

        /**
         * @openapi
         * /mcp:
         *   post:
         *     summary: MCP JSON-RPC endpoint
         *     description: |
         *       New sessions: provide `Authorization: Basic base64(username:password)`.
         *       Existing sessions: provide `Mcp-Session-Id` returned from the first response.
         *     tags: [MCP]
         *     security:
         *       - basicAuth: []
         *     parameters:
         *       - in: header
         *         name: mcp-session-id
         *         required: false
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               jsonrpc:
         *                 type: string
         *                 example: "2.0"
         *               method:
         *                 type: string
         *                 example: tools/list
         *               id:
         *                 type: integer
         *                 example: 1
         *     responses:
         *       200:
         *         description: MCP JSON-RPC response
         *       401:
         *         description: Missing or invalid credentials / session
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/UnauthorizedError'
         */
        app.post("/mcp", async (req, res) => {
            const mcpServer = new McpServer({
                name: "kawaz-mcp-server",
                version: "1.0.0",
            });
            const client = (req as RequestWithClient).client;
            registerTools(mcpServer, client);
            const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
            await mcpServer.connect(transport);
            await transport.handleRequest(req, res, req.body);
            if (isNotNil(transport.sessionId)) {
                sessions.set(transport.sessionId, { transport });
            }
        });
        return app;
    };