import { isNil, isNotNil } from "ramda";
import { KawazMcpConfig } from "../../config";
import { AuthCredentials } from "../../api/types";

export const login = async (config: KawazMcpConfig, authCredentials: AuthCredentials): Promise<string> => {
    const { kawazBackendUrl } = config;
    const { username, password } = authCredentials;
    const res = await fetch(`${kawazBackendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed (${res.status}): ${text}`);
    }
    const raw = res.headers.get("set-cookie") ?? "";
    const match = raw.match(/kawaz-token=([^;]+)/);
    if (!match) {
        throw new Error("Login succeeded but no kawaz-token cookie was returned");
    }
    const cookie = match[1];
    return cookie;
};

export const createRequestHandler = (config: KawazMcpConfig, authCredentials: AuthCredentials, cookie?: string) =>
    async (method: string, url: string, body?: unknown, retried = false): Promise<unknown> => {
        if (isNil(cookie)) {
            cookie = await login(config, authCredentials);
        };
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Cookie: `kawaz-token=${cookie}`,
            },
            ...(isNotNil(body) && { body: JSON.stringify(body) }),
        });
        if (res.status === 401 && !retried) {
            return createRequestHandler(config, authCredentials)(method, url, body, true);
        }
        const text = await res.text();
        if (!res.ok) {
            throw new Error(`${method} ${url} → ${res.status}: ${text}`);
        }
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    };