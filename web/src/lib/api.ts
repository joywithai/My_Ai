"use client";

let authToken: string | null = null;
export function setToken(t: string | null) {
  authToken = t;
}
export function getToken() {
  return authToken;
}

export async function api<T = any>(path: string, init?: RequestInit & { json?: any }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api${path}`, {
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
