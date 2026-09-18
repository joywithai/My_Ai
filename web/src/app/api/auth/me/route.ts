import { NextRequest, NextResponse } from "next/server";
import { getDb, save, userFromRequest } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const sub = db.subscriptions.find((s) => s.userId === user.id && s.status === "active");
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    settings: db.userSettings[user.id] ?? null,
    subscription: sub ?? null,
  });
}
export async function PATCH(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name } = await req.json();
  if (typeof name === "string" && name.trim()) user.name = name.trim().slice(0, 60);
  save();
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } });
}
