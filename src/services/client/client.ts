import { AuthCredentials } from "../../api/types";
import { KawazMcpConfig } from "../../config";
import { createRequestHandler, login } from "./utils";

export type KawazMcpClient = Awaited<ReturnType<typeof createKawazMcpClient>>;

export const createKawazMcpClient = async (config: KawazMcpConfig, authCredentials: AuthCredentials) => {
  const { kawazBackendUrl, kawazMediaProcessorUrl } = config;

  const cookie = await login(config, authCredentials);
  const requestHandler = createRequestHandler(config, authCredentials, cookie);

  return {
    get: (path: string) => requestHandler("GET", `${kawazBackendUrl}${path}`),
    post: (path: string, body?: unknown) => requestHandler("POST", `${kawazBackendUrl}${path}`, body),
    put: (path: string, body?: unknown) => requestHandler("PUT", `${kawazBackendUrl}${path}`, body),
    del: (path: string, body?: unknown) => requestHandler("DELETE", `${kawazBackendUrl}${path}`, body),
    healthCheck: async (): Promise<{ backend: string; mediaProcessor: string }> => {
      const [backendRes, mpRes] = await Promise.allSettled([
        fetch(`${kawazBackendUrl}/health`),
        fetch(`${kawazMediaProcessorUrl}/health`),
      ]);
      return {
        backend: backendRes.status === "fulfilled" && backendRes.value.ok ? "ok" : "unreachable",
        mediaProcessor: mpRes.status === "fulfilled" && mpRes.value.ok ? "ok" : "unreachable",
      };
    }
  };
};
