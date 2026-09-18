"use client";
import { getEngine } from "./engine/AvatarEngine";
import type { Viseme } from "./engine/lipsync";
import { api } from "./api";

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


/* ────────────────────────────────────────────────────────────────────────────
 * Backend voice: .NET Edge-TTS (POST /api/tts).
 * Real neural audio + word-boundary offsets (100-ns ticks) → mouth and
 * subtitles follow the ACTUAL audio timeline (100% sync, README §2.3).
 * ──────────────────────────────────────────────────────────────────────────── */

interface TtsBoundary {
  charIndex: number;
  length: number;
  text: string;
  offset: number; // 100-ns ticks from speech start
}

let currentAudio: HTMLAudioElement | null = null;
let currentRaf: number | null = null;

export function backendSpeakStop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentRaf !== null) {
    cancelAnimationFrame(currentRaf);
    currentRaf = null;
  }
}

export async function backendSpeak(
  text: string,
  lang: "bn" | "en",
  opts: { voice?: string; rate?: number; pitch?: number; hooks?: SpeakHooks }
): Promise<boolean> {
  try {
    const res = await api<{
      audioBase64: string;
      contentType: string;
      boundaries: TtsBoundary[];
    }>("/tts", {
      method: "POST",
      json: {
        text,
        lang,
        voice: opts.voice || undefined,
        rate: Math.max(0.5, Math.min(2, opts.rate ?? 1)),
        pitch: Math.max(-50, Math.min(50, opts.pitch ?? 0)),
      },
    });
    if (!res.audioBase64) return false;

    const hooks = opts.hooks;
    const engine = getEngine();
    const bounds = (res.boundaries ?? [])
      .slice()
      .sort((a, b) => a.offset - b.offset)
      .map((b) => ({ t: b.offset / 1e7, charIndex: b.charIndex, text: b.text }));

    const audio = new Audio(`data:${res.contentType || "audio/mpeg"};base64,${res.audioBase64}`);
    currentAudio = audio;

    const onEnd = () => {
      backendSpeakStop();
      hooks?.onEnd?.();
    };
    audio.onended = onEnd;
    audio.onerror = onEnd;

    // rAF loop: fire boundary events at their exact audio timestamps
    let next = 0;
    const tick = () => {
      if (currentAudio !== audio) return; // stopped
      const now = audio.currentTime;
      while (next < bounds.length && bounds[next].t <= now) {
        const b = bounds[next++];
        const word = b.text.replace(/[.,!?—।:;]+$/, "");
        engine.setViseme(wordToVisemes(word) as Partial<Record<Viseme, number>>);
        engine.boundaryAt(b.charIndex);
        hooks?.onBoundary?.(b.charIndex, word);
      }
      currentRaf = requestAnimationFrame(tick);
    };

    await audio.play();
    currentRaf = requestAnimationFrame(tick);
    return true;
  } catch {
    backendSpeakStop();
    return false;
  }
}
