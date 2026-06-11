import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerAdminTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "get_me",
    { description: "Get the authenticated user's username and role" },
    async () => text(await client.get("/user/me"))
  );

  server.registerTool(
    "list_pending_users",
    { description: "List all users awaiting admin approval (admin only)" },
    async () => text(await client.get("/admin/pending"))
  );

  server.registerTool(
    "approve_user",
    {
      description: "Approve a pending user signup with a role (admin only). Role must be 'user' or 'special'.",
      inputSchema: {
        username: z.string().min(1).describe("Username of the pending user"),
        role: z.enum(["user", "special"]).describe("Role to assign: 'user' or 'special'"),
      },
    },
    async ({ username, role }) =>
      text(await client.post(`/admin/pending/${username}/approve/${role}`))
  );

  server.registerTool(
    "deny_user",
    {
      description: "Deny and remove a pending user signup (admin only). Sends a denial email.",
      inputSchema: { username: z.string().min(1).describe("Username of the pending user to deny") },
    },
    async ({ username }) => text(await client.post(`/admin/pending/${username}/deny`))
  );

  server.registerTool(
    "send_newsletter",
    {
      description: "Send an HTML newsletter email to all approved users (admin only)",
      inputSchema: {
        html: z.string().min(1).describe("HTML content of the newsletter"),
        subject: z.string().optional().describe("Email subject line (optional)"),
      },
    },
    async ({ html, subject }) => text(await client.post("/admin/newsletter", { html, subject }))
  );

  server.registerTool(
    "list_user_profiles",
    { description: "List profiles belonging to the authenticated user" },
    async () => text(await client.get("/user/profiles"))
  );
};
