import { ExpressionSegment, Plan } from "../types";

interface Reply {
  segments: ExpressionSegment[];
}

const BN_REPLIES: Reply[] = [
  {
    segments: [
      { expression: "happy", text: "নমস্কার! আমি MyAi, তোমার ব্যক্তিগত এআই সঙ্গী।" },
      { expression: "relaxed", text: "আমার সাথে বাংলা বা ইংরেজি — যেকোনো ভাষায় কথা বলতে পারো।" },
    ],
  },
  {
    segments: [
      { expression: "surprised", text: "ওহ, চমৎকার প্রশ্ন!" },
      { expression: "neutral", text: "এই মুহূর্তে আমি ডেমো মোডে আছি — সামনে ব্যাকএন্ড যুক্ত হলে আমি আসল এআই মডেল দিয়ে উত্তর দেবো।" },
      { expression: "happy", text: "ততদিন আমার সাথে গল্প করতে থাকো!" },
    ],
  },
  {
    segments: [
      { expression: "relaxed", text: "হুম, বুঝতে পারছি।" },
      { expression: "happy", text: "তুমি যা বলেছ সেটা নিয়ে ভাবছি… আসলে ডেমোতে আমার উত্তরগুলো আগে থেকে লেখা!" },
      { expression: "surprised", text: "তবে আমার অভিব্যক্তি আর ঠোঁটের নাচন একদম লাইভ, খেয়াল করেছ?" },
    ],
  },
  {
    segments: [
      { expression: "happy", text: "অবশ্যই!" },
      { expression: "neutral", text: "সেটিংসে গিয়ে আমার ভয়েস, অভিব্যক্তি আর অ্যানিমেশন বদলে দেখতে পারো।" },
      { expression: "relaxed", text: "সাবস্ক্রাইবার হলে নিজের এআই এপিআই কী-ও ব্যবহার করতে পারবে।" },
    ],
  },
];

const EN_REPLIES: Reply[] = [
  {
    segments: [
      { expression: "happy", text: "Hello! I am MyAi, your personal AI companion." },
      { expression: "relaxed", text: "You can talk to me in Bangla or English, whichever you like." },
    ],
  },
  {
    segments: [
      { expression: "surprised", text: "Oh, what a great question!" },
      { expression: "neutral", text: "Right now I am running in demo mode — once the backend is connected, I will answer with a real AI model." },
      { expression: "happy", text: "Until then, keep chatting with me!" },
    ],
  },
  {
    segments: [
      { expression: "relaxed", text: "Hmm, I see what you mean." },
      { expression: "happy", text: "My answers in this demo are pre-written, but my expressions and lip-sync are fully live!" },
      { expression: "surprised", text: "Did you notice my mouth moves with every word?" },
    ],
  },
  {
    segments: [
      { expression: "neutral", text: "Sure!" },
      { expression: "relaxed", text: "Open the settings to change my voice, expressions and animations." },
      { expression: "happy", text: "Subscribers can even plug in their own AI API key." },
    ],
  },
];

let pick = 0;
export function mockReply(lang: "bn" | "en"): Reply {
  const pool = lang === "bn" ? BN_REPLIES : EN_REPLIES;
  const r = pool[pick % pool.length];
  pick++;
  return r;
}

export const PLANS: Plan[] = [
  {
    id: "plan_monthly",
    name: "Basic Monthly",
    price: 199,
    currency: "BDT",
    cycle: "monthly",
    features: [
      "Custom AI API key",
      "সব ১২টা expression",
      "সব animation",
      "Unlimited history",
      "৫০০ message / দিন",
    ],
  },
  {
    id: "plan_yearly",
    name: "Pro Yearly",
    price: 1990,
    currency: "BDT",
    cycle: "yearly",
    popular: true,
    features: [
      "Basic Monthly এর সবকিছু",
      "২ মাস ফ্রি",
      "Voice speed + pitch control",
      "সব avatar model",
      "Priority response",
    ],
  },
];

export const DEMO_USERS = [
  { id: "u_rahim", name: "Rahim Ahmed", email: "rahim@demo.com", role: "public_user" as const, banned: false, lastActive: "2 মিনিট আগে" },
  { id: "u_karim", name: "Karim Hasan", email: "karim@demo.com", role: "subscriber" as const, banned: false, lastActive: "1 ঘণ্টা আগে" },
  { id: "u_lisa", name: "Lisa Rahman", email: "lisa@demo.com", role: "subscriber" as const, banned: false, lastActive: "৩ ঘণ্টা আগে" },
  { id: "u_spam", name: "Spam Bot", email: "spam@bot.io", role: "public_user" as const, banned: true, lastActive: "৫ দিন আগে" },
  { id: "u_nusrat", name: "Nusrat Jahan", email: "nusrat@demo.com", role: "public_user" as const, banned: false, lastActive: "এইমাত্র" },
];

export const BANGLA_VOICES = [
  { name: "bn-BD-NabanitaNeural", displayName: "Nabanita (বাংলা)" },
  { name: "bn-BD-PradeepNeural", displayName: "Pradeep (বাংলা)" },
];

export const ENGLISH_VOICES = [
  { name: "en-US-JennyNeural", displayName: "Jenny (English)" },
  { name: "en-US-GuyNeural", displayName: "Guy (English)" },
];
