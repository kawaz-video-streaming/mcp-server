import z from "zod";

const kawazMcpConfigSchema = z.object({
  KAWAZ_BACKEND_URL: z.url().default("http://localhost:8080"),
  KAWAZ_MEDIA_PROCESSOR_URL: z.url().default("http://localhost:8081"),
  KAWAZ_USERNAME: z.string().min(1, "KAWAZ_USERNAME is required"),
  KAWAZ_PASSWORD: z.string().min(1, "KAWAZ_PASSWORD is required"),
});

export type KawazMcpConfig = z.infer<typeof kawazMcpConfigSchema>;

export const createKawazMcpConfig = () => {
  const result = kawazMcpConfigSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid config:\n${issues}`);
  }
  return result.data;
};
