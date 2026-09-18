/**
 * Demo database — file-backed store mirroring the README §5 schema.
 * The real backend (.NET + PostgreSQL) speaks the exact same JSON shapes,
 * so the frontend only changes its base URL when we swap.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "admin" | "subscriber" | "public_user";
  status: "active" | "inactive" | "banned";
  createdAt: number;
  lastLoginAt: number | null;
}

export interface DbUserSettings {
  language: "bn" | "en";
  uiLanguage: "bn" | "en";
  voiceName: string;
  voiceSpeed: number;
  voicePitch: number;
  defaultExpression: string;
  enabledAnimations: string[];
  blinkEnabled: boolean;
  thinkingPoseEnabled: boolean;
  showSubtitles: boolean;
  autoPlayAudio: boolean;
  demoVoiceOn: boolean;
  avatarModelId: string;
}

export interface DbCustomAi {
  provider: "gemini" | "openrouter";
  keyEncrypted: string;
  maskedKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxOutputTokens: number;
  isValid: boolean;
  testedAt: number | null;
}

export interface DbConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}
export interface DbMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  lang: "bn" | "en";
  segments: { expression: string; text: string }[];
  createdAt: number;
}
export interface DbPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  cycle: "monthly" | "yearly";
  features: string[];
  popular?: boolean;
  active: boolean;
}
export interface DbExpression { id: string; name: string; label: string; minRole: "public_user" | "subscriber"; active: boolean; }
export interface DbAnimation { id: string; name: string; label: string; minRole: "public_user" | "subscriber"; active: boolean; }
export interface DbAvatarModel { id: string; name: string; gender: "female" | "male"; file: string; minRole: "public_user" | "subscriber"; active: boolean; isDefault: boolean; }
export interface DbSubscription { id: string; userId: string; planId: string; status: "active" | "cancelled" | "expired"; startedAt: number; expiresAt: number; }
export interface DbPayment { id: string; userId: string; planId: string; amount: number; currency: string; status: "pending" | "succeeded" | "failed"; provider: string; referenceId: string; createdAt: number; }
export interface DbAudit { id: string; userId: string | null; email: string; action: string; resource: string; detail: string; createdAt: number; }

export interface Db {
  secret: string;
  users: DbUser[];
  userSettings: Record<string, DbUserSettings>;
  customAi: Record<string, DbCustomAi | null>;
  conversations: DbConversation[];
  messages: DbMessage[];
  usage: Record<string, { date: string; count: number }>;
  flags: Record<string, Record<string, any>>;
  expressions: DbExpression[];
  animations: DbAnimation[];
  avatarModels: DbAvatarModel[];
  plans: DbPlan[];
  subscriptions: DbSubscription[];
  payments: DbPayment[];
  systemSettings: { defaultUiLanguage: "bn" | "en"; defaultInputLanguage: "bn" | "en"; registrationOpen: boolean; aiModel: string };
  audit: DbAudit[];
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

const now = () => Date.now();
const uid = () => crypto.randomUUID();

export function defaultSettings(inputLang: "bn" | "en", uiLang: "bn" | "en"): DbUserSettings {
  return {
    language: inputLang,
    uiLanguage: uiLang,
    voiceName: "bn-BD-NabanitaNeural",
    voiceSpeed: 1.0,
    voicePitch: 0,
    defaultExpression: "relaxed",
    enabledAnimations: ["breathing"],
    blinkEnabled: true,
    thinkingPoseEnabled: true,
    showSubtitles: true,
    autoPlayAudio: true,
    demoVoiceOn: true,
    avatarModelId: "avatar-female",
  };
}

function seed(): Db {
  const mk = (email: string, name: string, role: DbUser["role"], pass: string): DbUser => ({
    id: uid(), email, name, role, status: "active",
    passwordHash: hashPassword(pass),
    createdAt: now(), lastLoginAt: null,
  });
  const users = [
    mk("admin@demo.com", "Admin", "admin", "admin123"),
    mk("sub@demo.com", "Nabanita", "subscriber", "sub12345"),
    mk("public@demo.com", "Demo User", "public_user", "public123"),
  ];
  return {
    secret: crypto.randomBytes(24).toString("hex"),
    users,
    userSettings: Object.fromEntries(users.map((u) => [u.id, defaultSettings("bn", "en")])),
    customAi: Object.fromEntries(users.map((u) => [u.id, null])),
    conversations: [],
    messages: [],
    usage: {},
    flags: {
      admin: { canUseCustomApiKey: true, canAccessAllExpressions: true, canAccessAllAnimations: true, canSelectAvatarModel: true, canCustomizeVoice: true, canAccessChatHistory: true, maxConversationHistory: -1, maxMessagesPerDay: -1 },
      subscriber: { canUseCustomApiKey: true, canAccessAllExpressions: true, canAccessAllAnimations: true, canSelectAvatarModel: true, canCustomizeVoice: true, canAccessChatHistory: true, maxConversationHistory: -1, maxMessagesPerDay: 500 },
      public_user: { canUseCustomApiKey: false, canAccessAllExpressions: false, canAccessAllAnimations: false, canSelectAvatarModel: false, canCustomizeVoice: false, canAccessChatHistory: true, maxConversationHistory: 10, maxMessagesPerDay: 50 },
    },
    expressions: [
      ["neutral", "Neutral"], ["happy", "Happy"], ["sad", "Sad"], ["surprised", "Surprised"],
      ["relaxed", "Relaxed"], ["excited", "Excited"], ["friendly", "Friendly"], ["serious", "Serious"],
      ["thoughtful", "Thoughtful"], ["confused", "Confused"], ["concerned", "Concerned"], ["angry", "Angry"],
    ].map(([name, label], i) => ({
      id: uid(), name, label: label as string,
      minRole: i < 4 ? "public_user" : "subscriber",
      active: true,
    })),
    animations: [
      ["breathing", "Breathing", "public_user"],
      ["head-sway", "Head sway", "subscriber"],
      ["shoulder-bob", "Shoulder bob", "subscriber"],
      ["hand-gesture", "Hand gesture", "subscriber"],
      ["thinking-pose", "Thinking pose", "subscriber"],
      ["wave", "Wave", "subscriber"],
    ].map(([name, label, minRole]) => ({ id: uid(), name: name as string, label: label as string, minRole: minRole as any, active: true })),
    avatarModels: [
      { id: "avatar-female", name: "Nabanita (Female)", gender: "female", file: "/models/avatar.vrm", minRole: "public_user", active: true, isDefault: true },
      { id: "avatar-male", name: "Arjun (Male)", gender: "male", file: "/models/avatar-male.vrm", minRole: "subscriber", active: true, isDefault: false },
    ],
    plans: [
      { id: "free", name: "Free", price: 0, currency: "BDT", cycle: "monthly", active: true, features: ["50 messages / day", "Basic expressions", "Default avatar", "10 conversations"] },
      { id: "pro-monthly", name: "Pro Monthly", price: 499, currency: "BDT", cycle: "monthly", popular: true, active: true, features: ["Unlimited messages", "All 12 expressions", "All animations", "Custom AI key", "Voice speed & pitch", "All avatars"] },
      { id: "pro-yearly", name: "Pro Yearly", price: 4990, currency: "BDT", cycle: "yearly", active: true, features: ["Everything in Pro", "2 months free", "Priority response"] },
    ],
    subscriptions: [],
    payments: [],
    systemSettings: { defaultUiLanguage: "en", defaultInputLanguage: "bn", registrationOpen: true, aiModel: "gemini-2.5-flash" },
    audit: [],
  };
}

let cache: Db | null = null;

export function getDb(): Db {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (fs.existsSync(FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(FILE, "utf8")) as Db;
      return cache!;
    } catch {
      /* corrupted file → reseed */
    }
  }
  cache = seed();
  save();
  return cache;
}

export function save() {
  if (!cache) return;
  fs.writeFileSync(FILE, JSON.stringify(cache, null, 1));
}

/* ── passwords (scrypt, standard node crypto) ── */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${h}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, h] = stored.split(":");
  const cand = crypto.scryptSync(pw, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(cand, "hex"));
}

/* ── tokens: uid.exp.hmac ── */
export function signToken(userId: string): string {
  const db = getDb();
  const exp = now() + 30 * 24 * 3600 * 1000;
  const sig = crypto.createHmac("sha256", db.secret).update(`${userId}.${exp}`).digest("hex").slice(0, 32);
  return `${userId}.${exp}.${sig}`;
}
export function verifyToken(token: string): string | null {
  const db = getDb();
  const [uid_, exp, sig] = token.split(".");
  if (!uid_ || !exp || !sig) return null;
  if (Number(exp) < now()) return null;
  const want = crypto.createHmac("sha256", db.secret).update(`${uid_}.${exp}`).digest("hex").slice(0, 32);
  return sig === want ? uid_ : null;
}

export function userFromRequest(req: Request): DbUser | null {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const userId = verifyToken(token);
  if (!userId) return null;
  return getDb().users.find((u) => u.id === userId) || null;
}

export function audit(userId: string | null, action: string, resource: string, detail = "") {
  const db = getDb();
  const u = db.users.find((x) => x.id === userId);
  db.audit.unshift({ id: uid(), userId, email: u?.email ?? "-", action, resource, detail, createdAt: now() });
  db.audit = db.audit.slice(0, 200);
  save();
}
