# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # compile TypeScript to dist/
npm run dev          # build + run with hot reload (ts-node-dev)
npm start            # run compiled dist/index.js (requires .env)
npm run clean        # remove dist/
```

There are no tests.

## Architecture

This is a stdio-based MCP server that wraps the kawaz video streaming REST API as AI-callable tools.

**Entry point:** `src/index.ts` — creates the `McpServer`, instantiates a single `KawazClient`, and registers all tool groups.

**`src/services/client/client.ts`** — the HTTP client. Authenticates via `POST /auth/login`, stores the `kawaz-token` session cookie in memory, and transparently re-logins on a 401. All tools route through `client.get/post/put/del`, which all hit `KAWAZ_BACKEND_URL`. The `healthCheck` method is the only one that also calls `KAWAZ_MEDIA_PROCESSOR_URL`.

**`src/tools/`** — one file per domain (`health`, `media`, `collections`, `genres`, `admin`, `avatars`, `avatarCategories`). Each exports a single `register*Tools(server, client)` function that calls `server.registerTool(name, schema, handler)`. To add a new tool, add it inside the relevant register function (or create a new file + register it in `src/tools/index.ts`).

**`src/config.ts`** — reads and validates env vars with Zod at startup; throws immediately if `KAWAZ_USERNAME` or `KAWAZ_PASSWORD` are missing.

## Adding a tool

1. Pick the appropriate file in `src/tools/` (or create one).
2. Call `server.tool(name, description, zodSchema, async handler)` — the handler receives validated args and must return `{ content: [{ type: "text", text: string }] }`.
3. If creating a new file, import and call its register function in `src/tools/index.ts`.
