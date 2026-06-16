# kawaz-mcp-server

**Version:** 1.0.0

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the kawaz video streaming backend as tools for AI assistants (e.g. Claude). It's an HTTP server (not stdio) deployed to Kubernetes at `mcp.kawazplus.com`, authenticated per-request with HTTP Basic auth against kawaz-backend.

## Tools

### Health
| Tool | Description |
|------|-------------|
| `check_health` | Check the health of kawaz-backend and media-processor services |

### Media
| Tool | Description |
|------|-------------|
| `list_media` | List all completed media items |
| `list_uploading_media` | List media currently pending, processing, or failed |
| `get_media` | Get metadata for a specific media item by ID |
| `get_media_progress` | Get conversion status and percentage for a media item |
| `update_media` | Update a media item's title, description, kind, episode number, genres, collection, or thumbnail focal point *(admin)* |
| `delete_media` | Delete a media item from the database and VOD storage *(admin)* |
| `initiate_upload` | Create a media record and return presigned PUT URLs for direct browser-to-storage upload *(admin)* |
| `complete_upload` | Signal that the upload finished and trigger the AMQP conversion pipeline *(admin)* |
| `initiate_subtitle_upload` | Reserve a subtitle slot and return a presigned PUT URL for a VTT file *(admin)* |
| `complete_subtitle_upload` | Confirm a subtitle upload, save the track, and rebuild the MPEG-DASH manifest *(admin)* |
| `update_subtitle` | Enable/disable or rename a subtitle track *(admin)* |
| `search_tmdb_movie` | Look up movie metadata from TMDB by title and year *(admin)* |
| `search_tmdb_show` | Look up TV show metadata from TMDB by title and year *(admin)* |
| `search_tmdb_season` | Look up TV season metadata from TMDB *(admin)* |
| `search_tmdb_episode` | Look up TV episode metadata from TMDB *(admin)* |
| `search_tmdb_collection` | Fetch TMDB collection metadata by collection ID *(admin)* |

### Collections
| Tool | Description |
|------|-------------|
| `list_collections` | List all media collections |
| `get_collection` | Get a specific collection by ID |
| `update_collection` | Update a collection's title, description, genres, season number, or parent collection *(admin)* |
| `delete_collection` | Delete an empty collection *(admin)* |

### Genres
| Tool | Description |
|------|-------------|
| `list_genres` | List all media genres |
| `get_genre` | Get a specific genre by ID |
| `create_genre` | Create a new genre *(admin)* |
| `delete_genre` | Delete a genre by name *(admin)* |

### Avatars
| Tool | Description |
|------|-------------|
| `list_avatars` | List all avatars |
| `get_avatar` | Get metadata for a specific avatar by ID |
| `delete_avatar` | Delete an avatar from the database and storage *(admin)* |

### Avatar Categories
| Tool | Description |
|------|-------------|
| `list_avatar_categories` | List all avatar categories |
| `get_avatar_category` | Get a specific avatar category by ID |
| `create_avatar_category` | Create a new avatar category *(admin)* |
| `delete_avatar_category` | Delete an avatar category (fails if it still contains avatars) *(admin)* |

### Users & Profiles
| Tool | Description |
|------|-------------|
| `get_me` | Get the authenticated user's username (and role/full record if admin) |
| `list_pending_users` | List users awaiting admin approval *(admin)* |
| `approve_user` | Approve a pending user with a role *(admin)* |
| `deny_user` | Deny and remove a pending user *(admin)* |
| `send_newsletter` | Send an HTML newsletter to all approved users *(admin)* |
| `list_user_profiles` | List profiles for the authenticated user |
| `create_profile` | Create a new profile for the authenticated user |
| `update_profile_avatar` | Update the avatar of an existing profile |
| `delete_profile` | Delete one of the authenticated user's profiles |
| `delete_account` | Permanently delete the authenticated user's account, profiles, and session (irreversible) |

## Setup

### Prerequisites
- Node.js 20+ (production Docker image uses `node:22-alpine`)
- A running [kawaz-backend](https://github.com/kawaz-video-streaming/kawaz-backend) instance
- A running [media-processor](https://github.com/kawaz-video-streaming/media-processor) instance (only needed for `check_health`)

### Install & build

```bash
npm install
npm run build
```

### Configuration

Copy `.env.example` to `.env` and fill in the backend URLs:

```bash
cp .env.example .env
```

```env
KAWAZ_BACKEND_URL=http://localhost:8080
KAWAZ_MEDIA_PROCESSOR_URL=http://localhost:8081
```

There are no server-side credentials — each MCP client authenticates per-request with its own `username:password` (see below), which the server forwards to kawaz-backend's `/auth/login`.

### Run

```bash
# production
npm start

# development (watch mode)
npm run dev
```

### Test

```bash
npm test          # vitest run
npm run test:watch
```

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | none | Liveness check |
| `GET` | `/api-docs` | none | Swagger UI |
| `POST` | `/mcp` | Basic (new session) or `Mcp-Session-Id` (existing) | MCP JSON-RPC endpoint |
| `DELETE` | `/mcp` | `Mcp-Session-Id` | Terminate an MCP session |

## MCP Client Configuration

This server is HTTP-based. Add it to your MCP client config (e.g. `.mcp.json` for Claude Code) with a Basic auth header of `base64(username:password)` for your kawaz account:

```json
{
  "mcpServers": {
    "kawaz": {
      "type": "http",
      "url": "https://mcp.kawazplus.com/mcp",
      "headers": {
        "Authorization": "Basic <base64(username:password)>"
      }
    }
  }
}
```

To run against a local instance instead, point `url` at `http://localhost:8080/mcp` (or whatever `PORT` you configured).

## Deployment

Pushing to `main` triggers `.github/workflows/kawaz-mcp-server.yml`, which runs the test suite, then builds and pushes a Docker image to GHCR (`ghcr.io/<owner>/kawaz-mcp-server`) and rolls it out to the `kawaz` GKE cluster (`europe-west3-a`). See [CI/CD](#cicd) below.

## CI/CD

On push to `main`, GitHub Actions (`.github/workflows/kawaz-mcp-server.yml`) runs:
1. **test** — `npm ci` + `npm test` (vitest)
2. **build-and-deploy** — only runs if `test` passes; builds the Docker image, pushes to GHCR, and rolls out to GKE
