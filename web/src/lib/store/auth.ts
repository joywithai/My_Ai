"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "../types";
import { api, setToken } from "../api";

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
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),

      login: async (email, password) => {
        const res = await api<{ token: string; user: SessionUser; settings: any }>("/auth/login", {
          method: "POST",
          json: { email, password },
        });
        setToken(res.token);
        set({ user: res.user, token: res.token, hydrated: true });
        if (res.settings) useSettingsSync(res.settings);
        return res.user;
      },

      register: async (name, email, password) => {
        const res = await api<{ token: string; user: SessionUser; settings: any }>("/auth/register", {
          method: "POST",
          json: { name, email, password },
        });
        setToken(res.token);
        set({ user: res.user, token: res.token, hydrated: true });
        if (res.settings) useSettingsSync(res.settings);
        return res.user;
      },

      logout: () => {
        setToken(null);
        set({ user: null, token: null, hydrated: true });
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
          set({ user: null, token: null, hydrated: true });
          setToken(null);
        }
      },
    }),
    {
      name: "myai.auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token);
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
