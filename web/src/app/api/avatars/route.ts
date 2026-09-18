import { NextRequest, NextResponse } from "next/server";
import { getDb, userFromRequest } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  const db = getDb();
  const role = user?.role ?? "public_user";
  const minRank: Record<string, number> = { public_user: 0, subscriber: 1, admin: 2 };
  const models = db.avatarModels
    .filter((a) => a.active && minRank[role] >= minRank[a.minRole])
    .map(({ id, name, gender, file, isDefault }) => ({ id, name, gender, file, isDefault }));
  return NextResponse.json({ models });
}
