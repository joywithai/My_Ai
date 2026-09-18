"use client";

/**
 * All data comes from the .NET backend (no demo layer).
 * NEXT_PUBLIC_API_BASE = backend origin; defaults to http://localhost:5000
 * (the pinned launchSettings port of MyAi.Api).
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

let authToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(token: string | null, refresh?: string | null) {
  authToken = token;
  if (refresh !== undefined) refreshToken = refresh;
}
/** backwards-compatible alias */
export const setToken = (t: string | null) => setTokens(t);
export function getToken() {
  return authToken;
}
export function getRefreshToken() {
  return refreshToken;
}

/** Rotate tokens via POST /auth/refresh (README §3.4). Returns true on success. */
async function rotateTokens(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      refreshToken = null;
      return false;
    }
    const data = await res.json();
    authToken = data.token ?? null;
    refreshToken = data.refreshToken ?? null;
    return !!authToken;
  } catch {
    return false;
  }
}

export async function api<T = any>(path: string, init?: RequestInit & { json?: any }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const call = () =>
    fetch(`${BASE}/api${path}`, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(rest.headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

  let res = await call();
  // access token expired → rotate once and retry
  if (res.status === 401 && (await rotateTokens())) res = await call();

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error ?? `http_${res.status}`), { status: res.status, data });
  return data as T;
}

/** Raw backend origin (audio blobs etc.) */
export const API_BASE = BASE;
