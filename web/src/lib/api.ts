"use client";

/**
 * NEXT_PUBLIC_API_BASE: set to the .NET backend origin (e.g. http://localhost:5000)
 * to bypass the built-in demo routes. Empty = demo backend (default).
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

let authToken: string | null = null;
export function setToken(t: string | null) {
  authToken = t;
}
export function getToken() {
  return authToken;
}

export async function api<T = any>(path: string, init?: RequestInit & { json?: any }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`${BASE}/api${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error ?? `http_${res.status}`), { status: res.status, data });
  return data as T;
}
