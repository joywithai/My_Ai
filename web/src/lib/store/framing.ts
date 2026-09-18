"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AvatarFraming } from "../types";

interface FramingState {
  framing: AvatarFraming;
  /** admin saved & locked — main page always uses this */
  locked: boolean;
  setFraming: (f: Partial<AvatarFraming>) => void;
  saveLock: () => void;
  reset: () => void;
}

export const DEFAULT_FRAMING: AvatarFraming = {
  targetY: 1.43,
  camY: 1.46,
  camZ: 1.4,
  fov: 33,
};

export const useFraming = create<FramingState>()(
  persist(
    (set) => ({
      framing: { ...DEFAULT_FRAMING },
      locked: false,
      setFraming: (f) => set((s) => ({ framing: { ...s.framing, ...f } })),
      saveLock: () => set({ locked: true }),
      reset: () => set({ framing: { ...DEFAULT_FRAMING }, locked: false }),
    }),
    {
      name: "myai.framing",
      version: 1,
      migrate: () => ({ framing: { ...DEFAULT_FRAMING }, locked: false }),
    }
  )
);

/** transient ui state (not persisted) */
interface UiState {
  toast: { id: number; msg: string; kind: "ok" | "err" | "info" } | null;
  showToast: (msg: string, kind?: "ok" | "err" | "info") => void;
}

export const useUi = create<UiState>((set) => ({
  toast: null,
  showToast: (msg, kind = "ok") =>
    set({ toast: { id: Date.now(), msg, kind } }),
}));
