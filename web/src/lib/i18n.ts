"use client";
import { useSettings } from "./store/settings";

export type UiLang = "en" | "bn";

const en = {
  settings: "Settings", account: "Account", profile: "Profile", voice: "Voice", face: "Face", avatar: "Avatar",
  ai: "AI", history: "History", back: "Back", save: "Save", saved: "Saved", cancel: "Cancel",
  logout: "Log out", login: "Log in", signup: "Sign up", email: "Email", password: "Password",
  name: "Name", createAccount: "Create account", haveAccount: "Already have an account?",
  noAccount: "New here?", demoAccounts: "Demo accounts", signIn: "Sign in",
  welcome: "Welcome! I'm MyAi", thinking: "thinking…", typeMessage: "Type a message…",
  language: "Language", voice2: "Voice", speed: "Speed", pitch: "Pitch", demoVoice: "Demo voice",
  autoPlay: "Auto play", testVoice: "Test voice", expressions: "Expressions", blink: "Blink",
  subtitles: "Subtitles", motion: "Motion", breathing: "Breathing", headSway: "Head sway",
  shoulderBob: "Shoulder bob", thinkingFx: "Thinking effect",
  avatarPosition: "Avatar position", closeUp: "Close-up", chest: "Chest-up", fullBody: "Full body",
  lookHeight: "Look-at height", camHeight: "Camera height", distance: "Distance", fov: "FOV (lens)",
  saveLock: "Save & lock", locked: "Locked", adminControl: "admin control",
  adminOnlyNote: "Position is set by the admin — you can preview it here",
  model: "Model", provider: "Provider", apiKey: "API key", baseUrl: "Base URL",
  temperature: "Temperature", maxTokens: "Max output tokens", test: "Test", testing: "Testing…",
  change: "Change", remove: "Remove", upgrade: "Upgrade", keyLocked: "Custom API keys are for subscribers",
  keySaved: "Key saved", noHistory: "No conversations yet", clearAll: "Clear all",
  displayName: "Display name", role: "Role", subscription: "Subscription",
  freePlan: "Free plan — 50 messages/day, basic features", premiumAll: "All premium features unlocked 🎉",
  subscribers: "Subscriber", publicUser: "Public", admin: "Admin", messages: "messages",
  users: "Users", flags: "Feature flags", plans: "Plans", system: "System", audit: "Audit log",
  ban: "Ban", unban: "Unban", delete: "Delete", active: "active", banned: "banned",
  registrationOpen: "Registration open", defaultUiLang: "Default UI language",
  defaultInputLang: "Default input language", aiModel2: "AI model",
  positionLockedBy: "Locked by admin", preview: "preview", min: "min", daily: "per day",
};
type Dict = typeof en;
const bn: Dict = {
  settings: "সেটিংস", account: "অ্যাকাউন্ট", profile: "প্রোফাইল", voice: "ভয়েস", face: "চেহারা", avatar: "অ্যাভাটার",
  ai: "AI", history: "হিস্টোরি", back: "ফিরে যাও", save: "সেভ", saved: "সেভ হয়েছে", cancel: "বাতিল",
  logout: "লগআউট", login: "লগইন", signup: "সাইনআপ", email: "ইমেইল", password: "পাসওয়ার্ড",
  name: "নাম", createAccount: "অ্যাকাউন্ট খুলো", haveAccount: "অ্যাকাউন্ট আছে?",
  noAccount: "নতুন?", demoAccounts: "ডেমো অ্যাকাউন্ট", signIn: "লগইন",
  welcome: "নমস্কার! আমি MyAi", thinking: "ভাবছি…", typeMessage: "কিছু লিখো…",
  language: "ভাষা", voice2: "ভয়েস", speed: "স্পিড", pitch: "পিচ", demoVoice: "ডেমো ভয়েস",
  autoPlay: "অটো প্লে", testVoice: "ভয়েস টেস্ট", expressions: "এক্সপ্রেশন", blink: "চোখের পলক",
  subtitles: "সাবটাইটেল", motion: "নড়াচড়া", breathing: "নিঃশ্বাস", headSway: "মাথা দোলা",
  shoulderBob: "কাঁধ", thinkingFx: "থিংকিং ইফেক্ট",
  avatarPosition: "অ্যাভাটার পজিশন", closeUp: "ক্লোজ-আপ", chest: "বুক পর্যন্ত", fullBody: "ফুল বডি",
  lookHeight: "লুক-অ্যাট উচ্চতা", camHeight: "ক্যামেরা উচ্চতা", distance: "দূরত্ব", fov: "FOV (লেন্স)",
  saveLock: "সেভ ও লক", locked: "লক করা", adminControl: "admin control",
  adminOnlyNote: "পজিশন সেট করে অ্যাডমিন — তুমি প্রিভিউ দেখতে পারো",
  model: "মডেল", provider: "প্রোভাইডার", apiKey: "API Key", baseUrl: "Base URL",
  temperature: "Temperature", maxTokens: "Max Output Tokens", test: "টেস্ট", testing: "টেস্ট হচ্ছে…",
  change: "পরিবর্তন", remove: "সরাও", upgrade: "আপগ্রেড", keyLocked: "কাস্টম API key সাবস্ক্রাইবারদের জন্য",
  keySaved: "Key সেভ হয়েছে", noHistory: "এখনও কোনো কথাবার্তা নেই", clearAll: "সব মুছে দাও",
  displayName: "ডিসপ্লে নাম", role: "রোল", subscription: "সাবস্ক্রিপশন",
  freePlan: "ফ্রি প্ল্যান — দিনে ৫০ মেসেজ, বেসিক ফিচার", premiumAll: "সব প্রিমিয়াম ফিচার আনলকড 🎉",
  subscribers: "সাবস্ক্রাইবার", publicUser: "পাবলিক", admin: "অ্যাডমিন", messages: "মেসেজ",
  users: "ইউজারস", flags: "ফিচার ফ্ল্যাগস", plans: "প্ল্যান", system: "সিস্টেম", audit: "অডিট লগ",
  ban: "ব্যান", unban: "আনব্যান", delete: "ডিলিট", active: "চালু", banned: "ব্যান",
  registrationOpen: "রেজিস্ট্রেশন খোলা", defaultUiLang: "ডিফল্ট UI ভাষা",
  defaultInputLang: "ডিফল্ট ইনপুট ভাষা", aiModel2: "AI মডেল",
  positionLockedBy: "অ্যাডমিন লক করেছে", preview: "প্রিভিউ", min: "মিনিট", daily: "প্রতিদিন",
};

const DICTS: Record<UiLang, Dict> = { en, bn };

export function useT() {
  const lang = useSettings((s) => s.settings.uiLanguage ?? "en");
  return (k: keyof Dict) => DICTS[lang]?.[k] ?? en[k] ?? String(k);
}
