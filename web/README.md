# MyAi Web (Frontend Demo)

Next.js 14 + TypeScript + Tailwind + three-vrm। **সম্পূর্ণ frontend ডেমো মক (dummy) ডেটা দিয়ে চলে** —
ব্যাকএন্ড (.NET API) যুক্ত হলে শুধু service layer বদলালেই হবে।

## চালানো

```bash
npm install
npm run dev   # http://localhost:3000
```

VRM model: `public/models/avatar.vrm` (VRM 1.0, VRoid Studio)

## পেজ

| Route | কী |
|---|---|
| `/` | ল্যান্ডিং — avatar **shh পোজে** 🤫 + লগইন/সাইনআপ (ডেমো রোল সিলেক্টর সহ) |
| `/chat` | মেইন চ্যাট — avatar **greeting wave** 👋 → idle → **thinking pose** 🤔 → **speaking (lip-sync + expression)** |
| `/settings` | ভয়েস, expression, animation, AI API key, **চ্যাট হিস্টোরি** |
| `/subscription` | প্ল্যান + ডেমো চেকআউট (ক্লিক = success, রোল subscriber হয়) |
| `/admin` | **avatar framing সেটআপ (লাইভ প্রিভিউ + সেভ ও লক)**, ইউজার ম্যানেজমেন্ট, ফিচার ফ্ল্যাগস |

ডেমোতে লগইনে যেকোনো ইমেইল/পাসওয়ার্ড চলে; রোল বেছে নিলে সেই রোলের ফিচার-ফ্ল্যাগ অনুযায়ী UI লক/আনলক হয়।

## আর্কিটেকচার (ব্যাকএন্ড সোয়াপ প্ল্যান)

```
src/
├── lib/
│   ├── engine/          ← three-vrm avatar engine (pose, expression, lip-sync, camera)
│   ├── store/           ← zustand stores (auth, chat, settings, framing)
│   ├── mock/            ← 🔌 ব্যাকএন্ড যুক্ত হলে এখানকে service layer দিয়ে replace হবে
│   ├── types.ts         ← API DTO গুলো README অনুযায়ী
│   └── speak.ts         ← ডেমো ভয়েস (browser TTS) → পরে Edge-TTS audio
├── components/          ← avatar/, chat/, settings/, admin/, ui/
└── app/                 ← pages
```

- `mock/chatService.sendMockMessage` → `POST /api/v1/chat/ask`
- `useAuth.login` → `POST /api/v1/auth/login`
- chatStore/settingsStore persist → পরে API + Redis cache
- framing সেভ → পরে `system_settings` টেবিল (admin-only API)

## Avatar States (তোমার ডিজাইন অনুযায়ী)

| State | Pose | কখন |
|---|---|---|
| `shh` | 🤫 আঙুল ঠোঁটে | ল্যান্ডিং (ইনপুট বক্স নেই) |
| `greeting` | 👋 হাত নেড়ে hi | লগইনের পর ২.৭ সেকেন্ড |
| `idle` | স্বাভাবিক + breathing/blink | অপেক্ষা |
| `thinking` | 🤔 আঙুল থুতনিতে, চোখ উপরে | send → voice আসা পর্যন্ত |
| `speaking` | 🗣️ lip-sync + expression per segment | উত্তর প্লে হওয়ার সময় |

`tuning/` ফোল্ডারে pose verify/optimize করার dev স্ক্রিপ্ট আছে (অ্যাপের অংশ না)।
