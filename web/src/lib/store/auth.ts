"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "../types";
import { api, setTokens, setToken } from "../api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: string;
}

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (name: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  setRole: (role: Role) => void;
  updateProfile: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  markHydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),

      login: async (email, password) => {
        const res = await api<{ token: string; refreshToken?: string; user: SessionUser; settings: any }>("/auth/login", {
          method: "POST",
          json: { email, password },
        });
        setTokens(res.token, res.refreshToken);
        set({ user: res.user, token: res.token, refreshToken: res.refreshToken ?? null, hydrated: true });
        if (res.settings) useSettingsSync(res.settings);
        return res.user;
      },

      register: async (name, email, password) => {
        const res = await api<{ token: string; refreshToken?: string; user: SessionUser; settings: any }>("/auth/register", {
          method: "POST",
          json: { name, email, password },
        });
        setTokens(res.token, res.refreshToken);
        set({ user: res.user, token: res.token, refreshToken: res.refreshToken ?? null, hydrated: true });
        if (res.settings) useSettingsSync(res.settings);
        return res.user;
      },

      logout: () => {
        const rt = get().refreshToken;
        setTokens(null, null);
        set({ user: null, token: null, refreshToken: null, hydrated: true });
        if (rt) {
          // best-effort server revoke (POST /api/auth/logout)
          fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000"}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
            keepalive: true,
          }).catch(() => {});
        }
      },

      setRole: (role) => set((s) => (s.user ? { user: { ...s.user, role } } : s)),

      updateProfile: async (name) => {
        const res = await api<{ user: SessionUser }>("/auth/me", { method: "PATCH", json: { name } });
        set({ user: res.user });
      },

      refresh: async () => {
        const token = get().token;
        if (!token) {
          set({ hydrated: true });
          return;
        }
        setToken(token);
        try {
          const res = await api<{ user: SessionUser }>("/auth/me");
          set({ user: res.user, hydrated: true });
        } catch {
          set({ user: null, token: null, refreshToken: null, hydrated: true });
          setTokens(null, null);
        }
      },
    }),
    {
      name: "myai.auth",
      partialize: (s) => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setTokens(state.token, state.refreshToken);
      },
    }
  )
);

/** push server settings into the settings store after login */
function useSettingsSync(serverSettings: any) {
  import("./settings").then(({ useSettings }) => {
    useSettings.getState().hydrateFromServer(serverSettings);
  });
}
