import { PresetExpression } from "../types";

/** A named "emotion" expanded into VRM preset weights (composites) */
export const COMPOSITES: Record<string, Partial<Record<PresetExpression, number>>> = {
  neutral: { neutral: 0.7 },
  happy: { happy: 1 },
  excited: { happy: 1, surprised: 0.45 },
  sad: { sad: 1 },
  angry: { angry: 0.9 },
  surprised: { surprised: 1, happy: 0.12 },
  relaxed: { relaxed: 0.85 },
  friendly: { happy: 0.55, relaxed: 0.5 },
  confused: { surprised: 0.5, angry: 0.25 },
  thoughtful: { relaxed: 0.45, angry: 0.15 },
  concerned: { sad: 0.65, angry: 0.3 },
  serious: { angry: 0.35, neutral: 0.5 },
};

const PRESETS: PresetExpression[] = [
  "neutral",
  "happy",
  "angry",
  "sad",
  "relaxed",
  "surprised",
];

/** Smoothly fading facial expression controller */
export class ExpressionController {
  private current: Record<string, number> = {};
  private target: Record<string, number> = {};

  constructor() {
    for (const p of PRESETS) {
      this.current[p] = 0;
      this.target[p] = 0;
    }
  }

  setComposite(name: string) {
    const c = COMPOSITES[name] ?? COMPOSITES.neutral;
    const next: Record<string, number> = {};
    for (const p of PRESETS) next[p] = c[p] ?? 0;
    this.target = next;
  }

  /** weight target for a preset used additively (blink/mouth handled by engine) */
  getTarget(preset: string): number {
    return this.target[preset] ?? 0;
  }

  update(dt: number, apply: (preset: string, weight: number) => void) {
    const k = 1 - Math.exp(-9 * dt);
    for (const p of PRESETS) {
      this.current[p] += (this.target[p] - this.current[p]) * k;
      if (Math.abs(this.target[p] - this.current[p]) < 0.002)
        this.current[p] = this.target[p];
      apply(p, this.current[p]);
    }
  }
}
