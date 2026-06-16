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

**`src/tools/`** — one file per domain, each exporting `register*Tools(server, client)`, wired up in `src/tools/index.ts`:
- `health.ts` — `check_health`
- `media.ts` — media CRUD, uploads, subtitles, TMDB search
- `collections.ts` — collection CRUD
- `genres.ts` — genre CRUD
- `admin.ts` — user approval/denial, newsletter, profiles, account deletion
- `avatars.ts` — avatar CRUD
- `avatarCategories.ts` — avatar category CRUD

Tools use `server.registerTool(name, { description, inputSchema }, handler)` with Zod schemas; handlers call `client.get/post/put/del` and wrap the JSON response as `{ content: [{ type: "text", text }] }`. To add a tool: pick the right file (or create one and register it in `src/tools/index.ts`), follow the existing pattern. Each domain file has a matching test in `src/tools/__tests__/`.

## Session model

- First `POST /mcp`: client sends `Authorization: Basic base64(user:pass)` → server logs in, creates `KawazMcpClient`, returns `Mcp-Session-Id` header
- Subsequent requests: client sends `Mcp-Session-Id` → routed to existing transport, no re-auth
- `DELETE /mcp` with `Mcp-Session-Id`: closes and evicts session

## CI/CD

`.github/workflows/kawaz-mcp-server.yml` runs on push to `main` with two jobs:
- `test` — `npm ci` + `npm test`
- `build-and-deploy` — `needs: test`; builds/pushes the Docker image to GHCR and rolls out to GKE (`kawaz` cluster, `europe-west3-a`)

A failing test suite blocks the Docker build and deploy.
