"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_FLAGS,
  DEFAULT_SETTINGS,
  FeatureFlags,
  PresetExpression,
  Role,
  UserSettings,
} from "../types";

interface SettingsState {
  settings: UserSettings;
  flags: Record<Role, FeatureFlags>;
  patch: (p: Partial<UserSettings>) => void;
  setExpression: (e: string) => void;
  toggleAnimation: (name: string) => void;
  saveCustomAi: (model: string) => void;
  removeCustomAi: () => void;
  setFlag: (role: Role, key: keyof FeatureFlags, value: boolean | number) => void;
  resetFlags: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      flags: { ...DEFAULT_FLAGS },
      patch: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setExpression: (e) => set((s) => ({ settings: { ...s.settings, defaultExpression: e } })),
      toggleAnimation: (name) =>
        set((s) => {
          const list = s.settings.enabledAnimations.includes(name)
            ? s.settings.enabledAnimations.filter((a) => a !== name)
            : [...s.settings.enabledAnimations, name];
          return { settings: { ...s.settings, enabledAnimations: list } };
        }),
      saveCustomAi: (model) =>
        set((s) => ({
          settings: {
            ...s.settings,
            customAi: { maskedKey: "sk-or-...****" + Math.random().toString(36).slice(2, 6), model },
          },
        })),
      removeCustomAi: () => set((s) => ({ settings: { ...s.settings, customAi: null } })),
      setFlag: (role, key, value) =>
        set((s) => ({
          flags: { ...s.flags, [role]: { ...s.flags[role], [key]: value } },
        })),
      resetFlags: () => set({ flags: { ...DEFAULT_FLAGS } }),
    }),
    { name: "myai.settings" }
  )
);
