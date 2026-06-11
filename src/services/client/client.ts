import { KawazMcpConfig } from "../../config";
import { createRequestHandler, login } from "./utils";

export type KawazMcpClient = Awaited<ReturnType<typeof createKawazMcpClient>>;

export const createKawazMcpClient = async (config: KawazMcpConfig) => {
  const { KAWAZ_BACKEND_URL, KAWAZ_MEDIA_PROCESSOR_URL } = config;

  const cookie = await login(config);
  const requestHandler = createRequestHandler(config, cookie);

  return {
    get: (path: string) => requestHandler("GET", `${KAWAZ_BACKEND_URL}${path}`),
    post: (path: string, body?: unknown) => requestHandler("POST", `${KAWAZ_BACKEND_URL}${path}`, body),
    put: (path: string, body?: unknown) => requestHandler("PUT", `${KAWAZ_BACKEND_URL}${path}`, body),
    del: (path: string, body?: unknown) => requestHandler("DELETE", `${KAWAZ_BACKEND_URL}${path}`, body),
    healthCheck: async (): Promise<{ backend: string; mediaProcessor: string }> => {
      const [backendRes, mpRes] = await Promise.allSettled([
        fetch(`${KAWAZ_BACKEND_URL}/health`),
        fetch(`${KAWAZ_MEDIA_PROCESSOR_URL}/health`),
      ]);
      return {
        backend: backendRes.status === "fulfilled" && backendRes.value.ok ? "ok" : "unreachable",
        mediaProcessor: mpRes.status === "fulfilled" && mpRes.value.ok ? "ok" : "unreachable",
      };
    }
  };
};
