import z from "zod";

const configSchema = z.object({
  KAWAZ_BACKEND_URL: z.string().url().default("http://localhost:8080"),
  KAWAZ_MEDIA_PROCESSOR_URL: z.string().url().default("http://localhost:8081"),
  KAWAZ_USERNAME: z.string().min(1, "KAWAZ_USERNAME is required"),
  KAWAZ_PASSWORD: z.string().min(1, "KAWAZ_PASSWORD is required"),
});

const result = configSchema.safeParse(process.env);
if (!result.success) {
  const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid config:\n${issues}`);
}

export const config = result.data;
