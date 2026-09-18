"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_FLAGS,
  DEFAULT_SETTINGS,
  FeatureFlags,
  AiProvider,
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
  saveCustomAi: (cfg: {
    provider: AiProvider;
    apiKey: string;
    model: string;
    baseUrl: string;
    temperature: number;
    maxOutputTokens: number;
  }) => void;
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
      saveCustomAi: (cfg) =>
        set((s) => ({
          settings: {
            ...s.settings,
            customAi: {
              provider: cfg.provider,
              maskedKey:
                cfg.apiKey.length > 10
                  ? cfg.apiKey.slice(0, 5) + "…" + cfg.apiKey.slice(-4)
                  : "••••••",
              model: cfg.model,
              baseUrl: cfg.baseUrl,
              temperature: cfg.temperature,
              maxOutputTokens: cfg.maxOutputTokens,
            },
          },
        })),
      removeCustomAi: () => set((s) => ({ settings: { ...s.settings, customAi: null } })),
      setFlag: (role, key, value) =>
        set((s) => ({
          flags: { ...s.flags, [role]: { ...s.flags[role], [key]: value } },
        })),
      resetFlags: () => set({ flags: { ...DEFAULT_FLAGS } }),
    }),
    {
      name: "myai.settings",
      version: 1,
      migrate: () => ({
        settings: { ...DEFAULT_SETTINGS },
        flags: { ...DEFAULT_FLAGS },
      }),
    }
  )
);
