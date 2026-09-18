"use client";

/**
 * Demo voice using the browser's built-in speechSynthesis.
 * Real Edge-TTS comes with the backend later — this is a stand-in.
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
  const voices = loadVoices();
  return voices.some((v) => v.lang.toLowerCase().startsWith(lang));
}

export function demoSpeak(
  text: string,
  lang: "bn" | "en",
  speed: number,
  pitch: number
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
  u.pitch = 1 + pitch / 200; // -50..50 → 0.75..1.25
  synth.speak(u);
  return true;
}

export function demoSpeakStop() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
