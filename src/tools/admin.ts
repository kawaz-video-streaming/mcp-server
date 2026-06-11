import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { KawazClient } from "../client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerAdminTools = (server: McpServer, client: KawazClient): void => {
  server.tool(
    "get_me",
    "Get the authenticated user's username and role",
    {},
    async () => text(await client.get("/user/me"))
  );

  server.tool(
    "list_pending_users",
    "List all users awaiting admin approval (admin only)",
    {},
    async () => text(await client.get("/admin/pending"))
  );

  server.tool(
    "approve_user",
    "Approve a pending user signup with a role (admin only). Role must be 'user' or 'special'.",
    {
      username: z.string().min(1).describe("Username of the pending user"),
      role: z.enum(["user", "special"]).describe("Role to assign: 'user' or 'special'"),
    },
    async ({ username, role }) =>
      text(await client.post(`/admin/pending/${username}/approve/${role}`))
  );

  server.tool(
    "deny_user",
    "Deny and remove a pending user signup (admin only). Sends a denial email.",
    { username: z.string().min(1).describe("Username of the pending user to deny") },
    async ({ username }) => text(await client.post(`/admin/pending/${username}/deny`))
  );

  server.tool(
    "send_newsletter",
    "Send an HTML newsletter email to all approved users (admin only)",
    {
      html: z.string().min(1).describe("HTML content of the newsletter"),
      subject: z.string().optional().describe("Email subject line (optional)"),
    },
    async ({ html, subject }) => text(await client.post("/admin/newsletter", { html, subject }))
  );

  server.tool(
    "list_user_profiles",
    "List profiles belonging to the authenticated user",
    {},
    async () => text(await client.get("/user/profiles"))
  );
};
