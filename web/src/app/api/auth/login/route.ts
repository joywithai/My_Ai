import { NextRequest, NextResponse } from "next/server";
import { getDb, save, verifyPassword, signToken, audit, defaultSettings } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  if (user.status === "banned") {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }
  user.lastLoginAt = Date.now();
  if (!db.userSettings[user.id]) {
    db.userSettings[user.id] = defaultSettings(db.systemSettings.defaultInputLanguage, db.systemSettings.defaultUiLanguage);
  }
  save();
  audit(user.id, "login", "auth");
  return NextResponse.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    settings: db.userSettings[user.id],
  });
}
