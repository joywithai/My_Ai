import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const users = db.users
    .map((u) => {
      const sub = db.subscriptions.find((s) => s.userId === u.id && s.status === "active");
      const usage = db.usage[u.id];
      const today = new Date().toISOString().slice(0, 10);
      const flags = db.flags[u.role] ?? {};
      return {
        id: u.id, email: u.email, name: u.name, role: u.role, status: u.status,
        createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
        subscribedUntil: sub?.expiresAt ?? null,
        messagesToday: usage?.date === today ? usage.count : 0,
        dailyLimit: flags.maxMessagesPerDay ?? 50,
        hasCustomKey: !!db.customAi[u.id],
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ users });
}
