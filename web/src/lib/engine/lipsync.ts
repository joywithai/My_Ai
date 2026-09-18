import { ExpressionSegment, PresetExpression } from "../types";

export type Viseme = "aa" | "ih" | "ou" | "ee" | "oh";

export interface LipItem {
  t0: number;
  t1: number;
  viseme: Viseme;
  amp: number;
}

export interface SpeakTimeline {
  totalMs: number;
  items: LipItem[];
  segs: { t0: number; t1: number; expr: PresetExpression; text: string }[];
}

/** Bangla unicode vowel → viseme */
const BN_VOWELS: Array<[RegExp, Viseme]> = [
  [/[অআাা]/, "aa"],
  [/[ইঈিীঋৃ]/, "ih"],
  [/[উঊুূ]/, "ou"],
  [/[এঐেৈ]/, "ee"],
  [/[ওঔোৌ]/, "oh"],
];

const EN_VOWELS: Array<[RegExp, Viseme]> = [
  [/[aA]/, "aa"],
  [/[iI]/, "ih"],
  [/[uU]/, "ou"],
  [/[eE]/, "ee"],
  [/[oO]/, "oh"],
];

function visemesForWord(word: string, lang: "bn" | "en"): Viseme[] {
  const table = lang === "bn" ? BN_VOWELS : EN_VOWELS;
  const out: Viseme[] = [];
  for (const ch of word) {
    for (const [re, v] of table) {
      if (re.test(ch)) {
        out.push(v);
        break;
      }
    }
  }
  if (!out.length) {
    const all: Viseme[] = ["aa", "ih", "ou", "ee", "oh"];
    const n = Math.min(3, Math.max(1, Math.ceil(word.length / 2)));
    for (let i = 0; i < n; i++) out.push(all[Math.floor(Math.random() * all.length)]);
  }
  return out;
}

/**
 * Build a fake word-boundary timeline from reply segments.
 * Same shape the real Edge-TTS backend will return (word_boundaries),
 * so the frontend swap later will be trivial.
 */
export function buildSpeakTimeline(
  segments: ExpressionSegment[],
  lang: "bn" | "en",
  msPerChar = 62
): SpeakTimeline {
  const items: LipItem[] = [];
  const segs: SpeakTimeline["segs"] = [];
  let t = 0;

  for (const seg of segments) {
    t += 180; // small pause between segments
    const segStart = t;
    const words = seg.text.split(/\s+/).filter(Boolean);
    for (const w of words) {
      const wDur = Math.max(230, Math.min(1500, w.length * msPerChar));
      const visemes = visemesForWord(w, lang);
      const each = Math.max(80, (wDur - 50) / visemes.length);
      let wt = t;
      for (const v of visemes) {
        const dur = each * (0.85 + Math.random() * 0.3);
        items.push({
          t0: wt,
          t1: wt + dur,
          viseme: v,
          amp: 0.55 + Math.random() * 0.45,
        });
        wt += dur;
      }
      t = wt + 55; // gap between words
    }
    segs.push({ t0: segStart, t1: Math.max(t, segStart + 400), expr: seg.expression, text: seg.text });
    t += 120;
  }

  return { totalMs: t + 250, items, segs };
}
