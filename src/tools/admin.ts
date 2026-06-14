import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import z from "zod";
import { KawazMcpClient } from "../services/client/client";

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const registerAdminTools = (server: McpServer, client: KawazMcpClient): void => {
  server.registerTool(
    "get_me",
    { description: "Get the authenticated user's username" },
    async () => {
      const me = await client.get("/user/me") as { username: string; role: string };
      const result = me.role === "admin" ? me : { username: me.username };
      return text(result);
    }
  );

  server.registerTool(
    "list_pending_users",
    { description: "List all users awaiting admin approval (admin only)" },
    async () => text(await client.get("/admin/pending"))
  );

  server.registerTool(
    "approve_user",
    {
      description: "Approve a pending user signup with a role (admin only).",
      inputSchema: {
        username: z.string().min(1).describe("Username of the pending user"),
        role: z.string().min(1).describe("Role to assign"),
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

  server.registerTool(
    "create_profile",
    {
      description: "Create a new profile for the authenticated user",
      inputSchema: {
        profileName: z.string().min(1).describe("Profile name"),
        avatarId: z.string().describe("MongoDB ObjectId of the avatar to use"),
      },
    },
    async ({ profileName, avatarId }) => text(await client.post("/user/profile", { profileName, avatarId }))
  );

  server.registerTool(
    "update_profile_avatar",
    {
      description: "Update the avatar of an existing profile for the authenticated user",
      inputSchema: {
        profileName: z.string().min(1).describe("Name of the profile to update"),
        avatarId: z.string().describe("MongoDB ObjectId of the new avatar"),
      },
    },
    async ({ profileName, avatarId }) => text(await client.put("/user/profile", { profileName, avatarId }))
  );

  server.registerTool(
    "delete_profile",
    {
      description: "Delete one of the authenticated user's profiles",
      inputSchema: { name: z.string().min(1).describe("Name of the profile to delete") },
    },
    async ({ name }) => text(await client.del(`/user/profile/${name}`))
  );

  server.registerTool(
    "delete_account",
    {
      description: "Permanently delete the authenticated user's account, all profiles, and session. This is irreversible.",
      inputSchema: {},
    },
    async () => text(await client.del("/user/account"))
  );
};
