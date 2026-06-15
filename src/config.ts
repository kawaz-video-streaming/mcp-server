import { createServerConfig, ServerConfig } from "@ido_kawaz/server-framework";
import z from "zod";

const kawazMcpConfigSchema = z.object({
  KAWAZ_BACKEND_URL: z.url().default("http://localhost:8080"),
  KAWAZ_MEDIA_PROCESSOR_URL: z.url().default("http://localhost:8081"),
});

export interface KawazMcpConfig {
  kawazBackendUrl: string;
  kawazMediaProcessorUrl: string;
  server: ServerConfig;
}

export const createKawazMcpConfig = () => {
  const result = kawazMcpConfigSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid config:\n${issues}`);
  }
  return {
    kawazBackendUrl: result.data.KAWAZ_BACKEND_URL,
    kawazMediaProcessorUrl: result.data.KAWAZ_MEDIA_PROCESSOR_URL,
    server: createServerConfig(),
  };
};
