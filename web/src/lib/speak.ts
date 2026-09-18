"use client";
import { getEngine } from "./engine/AvatarEngine";
import type { Viseme } from "./engine/lipsync";

/**
 * Demo voice: browser speechSynthesis.
 * Lip-sync driven by REAL audio events (`onboundary` word callbacks) →
 * engine.setViseme + engine.boundaryAt. Where boundary events are not
 * available (some browsers/voices) we transparently fall back to the
 * estimated timeline. The .NET backend will feed the exact same engine
 * functions from Edge-TTS word boundaries.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) cachedVoices = v;
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
  loadVoices();
}

export function hasVoiceFor(lang: "bn" | "en"): boolean {
  return loadVoices().some((v) => v.lang.toLowerCase().startsWith(lang));
}

/** vowel → viseme weight map for a word */
function wordToVisemes(word: string): Partial<Record<Viseme, number>> {
  const w = word.toLowerCase();
  const out: Partial<Record<Viseme, number>> = {};
  if (/a|আ|া/.test(w)) out["aa"] = 0.9;
  if (/i|y|ি|ী|ে/.test(w)) out["ih"] = 0.7;
  if (/[uo]|উ|ূ|ু/.test(w)) out["ou"] = 0.8;
  if (/e|এ/.test(w)) out["ee"] = 0.6;
  if (/o|ো|ও/.test(w)) out["oh"] = 0.85;
  if (!Object.keys(out).length) out["aa"] = 0.35; // consonant cluster → slight open
  return out;
}

export interface SpeakHooks {
  /** real-audio word boundary (charIndex into `text`) */
  onBoundary?: (charIndex: number, word: string) => void;
  onEnd?: () => void;
}

let current: SpeechSynthesisUtterance | null = null;

export function demoSpeak(
  text: string,
  lang: "bn" | "en",
  speed: number,
  pitch: number,
  hooks?: SpeakHooks
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const voices = loadVoices();
  if (!voices.length) return false;

  const match =
    voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  if (!match) return false;

  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = match;
  u.lang = match.lang;
  u.rate = Math.max(0.5, Math.min(2, speed));
  u.pitch = 1 + pitch / 200;
  let boundaryFired = false;

  u.onboundary = (e) => {
    if (e.name && e.name !== "word") return;
    const idx = e.charIndex ?? 0;
    const rest = text.slice(idx);
    const word = (rest.match(/^\S+/)?.[0] ?? "").replace(/[.,!?—।:;]+$/, "");
    boundaryFired = true;
    const engine = getEngine();
    engine.setViseme(wordToVisemes(word));
    engine.boundaryAt(idx);
    hooks?.onBoundary?.(idx, word);
  };
  u.onend = () => {
    current = null;
    hooks?.onEnd?.();
  };
  current = u;
  synth.speak(u);
  return boundaryFired || true;
}

export function demoSpeakStop() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  current = null;
}
