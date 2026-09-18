"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "../types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: SessionUser | null;
  login: (u: SessionUser) => void;
  logout: () => void;
  setRole: (role: Role) => void;
  updateProfile: (name: string) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      setRole: (role) => set((s) => (s.user ? { user: { ...s.user, role } } : s)),
      updateProfile: (name) =>
        set((s) => (s.user ? { user: { ...s.user, name } } : s)),
    }),
    { name: "myai.auth" }
  )
);
