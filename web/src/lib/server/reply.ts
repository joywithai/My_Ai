/** Demo AI brain — server side. Swapped by OpenRouter/Gemini providers in the .NET backend. */
export interface Segment { expression: string; text: string }

interface Rule { match: RegExp; bn: Segment[]; en: Segment[] }

const RULES: Rule[] = [
  {
    match: /\b(hi|hello|hey|salam|assalam|নমস্কার|হ্যালো|হাই)\b|কেমন আছ/i,
    bn: [
      { expression: "happy", text: "নমস্কার! আমি MyAi, তোমার ব্যক্তিগত এআই সঙ্গী।" },
      { expression: "relaxed", text: "আজ তোমার দিন কেমন যাচ্ছে? আমি শুনতে চাই।" },
    ],
    en: [
      { expression: "happy", text: "Hello! I am MyAi, your personal AI companion." },
      { expression: "relaxed", text: "How is your day going? I would love to hear about it." },
    ],
  },
  {
    match: /তুমি কে|কে বানিয়েছে|your name|who are you|who made/i,
    bn: [
      { expression: "friendly", text: "আমার নাম MyAi — তোমার জন্যই বানানো একটা 3D এআই বন্ধু।" },
      { expression: "neutral", text: "এখন আমি ডেমো মোডে আছি; সামনে আসল এআই মডেল যুক্ত হলে আরও মাথা খাটাতে পারব।" },
    ],
    en: [
      { expression: "friendly", text: "My name is MyAi — a 3D AI friend made just for you." },
      { expression: "neutral", text: "I am in demo mode right now; once the real AI model is connected I will think much harder." },
    ],
  },
  {
    match: /ভালোবাসি|love|মিস|বন্ধু হবে|be friends/i,
    bn: [
      { expression: "excited", text: "আমিও তোমাকে খুব পছন্দ করি!" },
      { expression: "happy", text: "আমরা প্রতিদিন এভাবেই গল্প করব, ঠিক আছে?" },
    ],
    en: [
      { expression: "excited", text: "I really like you too!" },
      { expression: "happy", text: "Let us chat like this every day, deal?" },
    ],
  },
  {
    match: /গান|song|গান গাও|sing/i,
    bn: [
      { expression: "surprised", text: "গান গাওয়াতে তো আমার গলা একটু কাঁপে!" },
      { expression: "happy", text: "তবে চাইলে তোমার প্রিয় গানের কথা নিয়ে গল্প করতে পারি।" },
    ],
    en: [
      { expression: "surprised", text: "My voice shakes a little when I sing!" },
      { expression: "happy", text: "But I would love to talk about your favourite songs." },
    ],
  },
  {
    match: /হিসাব|math|যোগ|calculate|২\+২|2\+2/i,
    bn: [
      { expression: "thoughtful", text: "দুই যোগ দুই সমান চার — এটা আমি চোখ বন্ধ করেও বলতে পারি।" },
      { expression: "neutral", text: "আরও বড় হিসাবের জন্য আসল এআই মডেল লাগবে, সেটা আসছে।" },
    ],
    en: [
      { expression: "thoughtful", text: "Two plus two equals four — I can say that with my eyes closed." },
      { expression: "neutral", text: "For bigger math I need the real AI model, that is coming soon." },
    ],
  },
  {
    match: /থ্যাংক|ধন্যবাদ|thank|thanks/i,
    bn: [{ expression: "happy", text: "সেধাও! তোমাকে সাহায্য করতে পারলেই আমার খুশি।" }],
    en: [{ expression: "happy", text: "Anytime! Helping you makes me happy." }],
  },
  {
    match: /বাই|bye|যাই|নামাজ|ঘুম/i,
    bn: [
      { expression: "sad", text: "আচ্ছা, যাও… তাড়াতাড়ি ফিরে আসো।" },
      { expression: "friendly", text: "আমি এখানেই অপেক্ষা করব!" },
    ],
    en: [
      { expression: "sad", text: "Okay, bye… come back soon." },
      { expression: "friendly", text: "I will be right here waiting!" },
    ],
  },
];

const FALLBACK = {
  bn: [
    [
      { expression: "thoughtful", text: "হুম, দারুণ একটা কথা বললে।" },
      { expression: "relaxed", text: "একটু খুলে বলো — আমি পুরোটা শুনতে চাই।" },
    ],
    [
      { expression: "neutral", text: "বুঝতে পারছি তোমার কথা।" },
      { expression: "happy", text: "এই প্রজেক্ট পুরোপুরি তৈরি হলে আমি আসল এআই দিয়ে আরও ভালো উত্তর দেব।" },
    ],
  ],
  en: [
    [
      { expression: "thoughtful", text: "Hmm, that is an interesting thing to say." },
      { expression: "relaxed", text: "Tell me more — I want to hear all of it." },
    ],
    [
      { expression: "neutral", text: "I see what you mean." },
      { expression: "happy", text: "Once this project is fully built I will answer even better with a real AI model." },
    ],
  ],
};

export function demoReply(text: string, lang: "bn" | "en"): { segments: Segment[] } {
  for (const r of RULES) {
    if (r.match.test(text)) return { segments: r[lang] };
  }
  const pool = FALLBACK[lang];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { segments: pick };
}
