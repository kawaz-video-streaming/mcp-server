import { isNil, isNotNil } from "ramda";
import { KawazMcpConfig } from "../../config";

export const login = async (config: KawazMcpConfig): Promise<string> => {
    const { KAWAZ_BACKEND_URL, KAWAZ_USERNAME, KAWAZ_PASSWORD } = config;
    const res = await fetch(`${KAWAZ_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: KAWAZ_USERNAME, password: KAWAZ_PASSWORD }),
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

export const createRequestHandler = (config: KawazMcpConfig, cookie?: string) =>
    async (method: string, url: string, body?: unknown, retried = false): Promise<unknown> => {
        if (isNil(cookie)) {
            cookie = await login(config);
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
            return createRequestHandler(config, undefined)(method, url, body, true);
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