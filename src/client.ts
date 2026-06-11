export type KawazClient = ReturnType<typeof createKawazClient>;

export const createKawazClient = (backendUrl: string, mediaProcessorUrl: string, username: string, password: string) => {
  let cookie: string | null = null;

  const login = async (): Promise<void> => {
    const res = await fetch(`${backendUrl}/auth/login`, {
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
    if (!match) throw new Error("Login succeeded but no kawaz-token cookie was returned");
    cookie = match[1];
  };

  const request = async (method: string, url: string, body?: unknown, retried = false): Promise<unknown> => {
    if (!cookie) await login();
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: `kawaz-token=${cookie}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 401 && !retried) {
      cookie = null;
      return request(method, url, body, true);
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${url} → ${res.status}: ${text}`);
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const get = (path: string) => request("GET", `${backendUrl}${path}`);
  const post = (path: string, body?: unknown) => request("POST", `${backendUrl}${path}`, body);
  const put = (path: string, body?: unknown) => request("PUT", `${backendUrl}${path}`, body);
  const del = (path: string, body?: unknown) => request("DELETE", `${backendUrl}${path}`, body);

  const healthCheck = async (): Promise<{ backend: string; mediaProcessor: string }> => {
    const [backendRes, mpRes] = await Promise.allSettled([
      fetch(`${backendUrl}/health`),
      fetch(`${mediaProcessorUrl}/health`),
    ]);
    return {
      backend: backendRes.status === "fulfilled" && backendRes.value.ok ? "ok" : "unreachable",
      mediaProcessor: mpRes.status === "fulfilled" && mpRes.value.ok ? "ok" : "unreachable",
    };
  };

  return { get, post, put, del, healthCheck };
};
