import { NextRequest, NextResponse } from "next/server";
import { getDb, save, userFromRequest, audit } from "@/lib/server/db";
import { demoReply } from "@/lib/server/reply";

export async function POST(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.status === "banned") return NextResponse.json({ error: "banned" }, { status: 403 });

  const db = getDb();
  const { message, lang, conversationId } = await req.json();
  const text = String(message ?? "").slice(0, 500);
  const language: "bn" | "en" = lang === "en" ? "en" : "bn";
  if (!text.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  // daily limit from role flags
  const flags = db.flags[user.role] ?? {};
  const max = flags.maxMessagesPerDay ?? 50;
  const today = new Date().toISOString().slice(0, 10);
  const u = (db.usage[user.id] = db.usage[user.id] ?? { date: today, count: 0 });
  if (u.date !== today) {
    u.date = today;
    u.count = 0;
  }
  if (max >= 0 && u.count >= max) {
    return NextResponse.json({ error: "limit_reached", limit: max }, { status: 429 });
  }
  u.count += 1;

  // conversation
  let conv = conversationId ? db.conversations.find((c) => c.id === conversationId && c.userId === user.id) : null;
  if (!conv) {
    conv = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: text.slice(0, 40) || "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    db.conversations.unshift(conv);
  }
  conv.updatedAt = Date.now();

  db.messages.push({
    id: crypto.randomUUID(),
    conversationId: conv.id,
    userId: user.id,
    role: "user",
    content: text,
    lang: language,
    segments: [],
    createdAt: Date.now(),
  });

  // demo AI (backend swap: OpenRouter / Gemini providers)
  const { segments } = demoReply(text, language);
  db.messages.push({
    id: crypto.randomUUID(),
    conversationId: conv.id,
    userId: user.id,
    role: "assistant",
    content: segments.map((s) => s.text).join(" "),
    lang: language,
    segments,
    createdAt: Date.now(),
  });

  // history limit per role
  const maxHist = flags.maxConversationHistory ?? 10;
  if (maxHist >= 0) {
    const mine = db.conversations.filter((c) => c.userId === user.id).sort((a, b) => b.updatedAt - a.updatedAt);
    const drop = mine.slice(maxHist).map((c) => c.id);
    if (drop.length) {
      db.conversations = db.conversations.filter((c) => !drop.includes(c.id));
      db.messages = db.messages.filter((m) => !drop.includes(m.conversationId));
    }
  }
  save();
  audit(user.id, "chat", "chat", text.slice(0, 30));

  return NextResponse.json({
    conversationId: conv.id,
    segments,
    usage: { count: u.count, limit: max },
  });
}
