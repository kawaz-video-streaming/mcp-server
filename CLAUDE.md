# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # compile TypeScript to dist/
npm run dev          # build + run with hot reload (ts-node-dev)
npm start            # run compiled dist/index.js (requires .env)
npm run clean        # remove dist/
npm test             # run vitest suite
```

Local `.env` needs: `PORT`, `KAWAZ_BACKEND_URL`, `KAWAZ_MEDIA_PROCESSOR_URL`.  
No `KAWAZ_USERNAME`/`KAWAZ_PASSWORD` — credentials come from each client's request.

## Architecture

This is an HTTP-based MCP server using `StreamableHTTPServerTransport`. It wraps the kawaz video streaming REST API as AI-callable tools and is deployed to Kubernetes at `mcp.kawazplus.com`.

**Entry point:** `src/index.ts` → `createKawazMcpConfig()` → `KawazMcpSystem.start()`

**`src/services/system.ts`** — wires `createServer` (from `@ido_kawaz/server-framework`) with `registerRoutes`.

**`src/api/index.ts`** — `registerRoutes(config)` returns `(app) => app`. Registers:
- `GET /health` — health check (no auth)
- `DELETE /mcp` — session termination (no auth)
- `app.use(createMcpAuthMiddleware)` — Basic auth / session routing
- `POST /mcp` — creates `McpServer` + `StreamableHTTPServerTransport` per new session, stores in sessions map
- `GET /api-docs` — Swagger UI

**`src/api/middlewares.ts`** — `createMcpAuthMiddleware`: if `Mcp-Session-Id` header present, routes to existing transport; otherwise decodes `Authorization: Basic base64(user:pass)`, logs in to kawaz-backend, attaches `KawazMcpClient` to `req`.

**`src/api/types.ts`** — `AuthCredentials`, `Session { transport }`, `Sessions`, `RequestWithClient`.

**`src/api/swagger.ts`** — `swagger-jsdoc` spec; picks up `@openapi` JSDoc from `src/api/**/*.ts`.

**`src/services/client/client.ts`** — `createKawazMcpClient(config, authCredentials)`. Authenticates via `POST /auth/login`, stores session cookie, re-logins transparently on 401. All tools route through `client.get/post/put/del`.

**`src/tools/`** — one file per domain. Each exports `register*Tools(server, client)`. To add a tool: pick the right file, call `server.tool(name, description, zodSchema, handler)`, register in `src/tools/index.ts` if new file.

## Session model

- First `POST /mcp`: client sends `Authorization: Basic base64(user:pass)` → server logs in, creates `KawazMcpClient`, returns `Mcp-Session-Id` header
- Subsequent requests: client sends `Mcp-Session-Id` → routed to existing transport, no re-auth
- `DELETE /mcp` with `Mcp-Session-Id`: closes and evicts session
