# kawaz-mcp-server

**Version:** 1.0.0

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the kawaz video streaming backend as tools for AI assistants (e.g. Claude).

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
| `delete_media` | Delete a media item from the database and VOD storage *(admin)* |
| `search_tmdb_movie` | Look up movie metadata from TMDB by title *(admin)* |
| `search_tmdb_show` | Look up TV show metadata from TMDB by title *(admin)* |
| `search_tmdb_season` | Look up TV season metadata from TMDB *(admin)* |
| `search_tmdb_episode` | Look up TV episode metadata from TMDB *(admin)* |

### Collections
| Tool | Description |
|------|-------------|
| `list_collections` | List all media collections |
| `get_collection` | Get a specific collection by ID |
| `update_collection` | Update a collection's title, description, or genres *(admin)* |
| `delete_collection` | Delete an empty collection *(admin)* |

### Genres
| Tool | Description |
|------|-------------|
| `list_genres` | List all media genres |
| `create_genre` | Create a new genre *(admin)* |
| `delete_genre` | Delete a genre by name *(admin)* |

### Admin
| Tool | Description |
|------|-------------|
| `get_me` | Get the authenticated user's username |
| `list_pending_users` | List users awaiting admin approval *(admin)* |
| `approve_user` | Approve a pending user with a role *(admin)* |
| `deny_user` | Deny and remove a pending user *(admin)* |
| `send_newsletter` | Send an HTML newsletter to all approved users *(admin)* |
| `list_user_profiles` | List profiles for the authenticated user |

## Setup

### Prerequisites
- Node.js 18+
- A running [kawaz-backend](https://github.com/kawaz-video-streaming/kawaz-backend) instance
- A running [media-processor](https://github.com/kawaz-video-streaming/media-processor) instance

### Install & build

```bash
npm install
npm run build
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
KAWAZ_BACKEND_URL=http://localhost:8080
KAWAZ_MEDIA_PROCESSOR_URL=http://localhost:8081
KAWAZ_USERNAME=your-admin-username
KAWAZ_PASSWORD=your-admin-password
```

### Run

```bash
# production
npm start

# development (watch mode)
npm run dev
```

## MCP Client Configuration

Add this server to your MCP client config (e.g. `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "kawaz": {
      "command": "node",
      "args": ["/path/to/kawaz-mcp-server/dist/index.js"],
      "env": {
        "KAWAZ_BACKEND_URL": "http://localhost:8080",
        "KAWAZ_MEDIA_PROCESSOR_URL": "http://localhost:8081",
        "KAWAZ_USERNAME": "your-username",
        "KAWAZ_PASSWORD": "your-password"
      }
    }
  }
}
```
