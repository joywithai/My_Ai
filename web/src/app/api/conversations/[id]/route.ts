import { NextRequest, NextResponse } from "next/server";
import { getDb, save, userFromRequest } from "@/lib/server/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const conv = db.conversations.find((c) => c.id === params.id && c.userId === user.id);
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const messages = db.messages
    .filter((m) => m.conversationId === conv.id)
    .map(({ role, content, segments, createdAt }) => ({ role, content, segments, createdAt }));
  return NextResponse.json({ conversation: conv, messages });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  db.conversations = db.conversations.filter((c) => !(c.id === params.id && c.userId === user.id));
  db.messages = db.messages.filter((m) => m.conversationId !== params.id);
  save();
  return NextResponse.json({ ok: true });
}
