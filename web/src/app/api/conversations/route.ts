import { NextRequest, NextResponse } from "next/server";
import { getDb, userFromRequest } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const flags = db.flags[user.role] ?? {};
  const max = flags.maxConversationHistory ?? 10;
  const mine = db.conversations
    .filter((c) => c.userId === user.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, max >= 0 ? max : undefined)
    .map((c) => ({ ...c, messageCount: db.messages.filter((m) => m.conversationId === c.id).length }));
  return NextResponse.json({ conversations: mine });
}
