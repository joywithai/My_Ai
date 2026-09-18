import { NextRequest, NextResponse } from "next/server";
import { getDb, save, hashPassword, signToken, audit, defaultSettings } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  const db = getDb();
  if (!db.systemSettings.registrationOpen) {
    return NextResponse.json({ error: "registration_closed" }, { status: 403 });
  }
  const mail = String(email).toLowerCase().trim();
  if (!mail.includes("@") || String(password).length < 6 || !String(name).trim()) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (db.users.some((u) => u.email.toLowerCase() === mail)) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }
  const user = {
    id: crypto.randomUUID(),
    email: mail,
    name: String(name).trim().slice(0, 60),
    role: "public_user" as const,
    status: "active" as const,
    passwordHash: hashPassword(String(password)),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };
  db.users.push(user);
  db.userSettings[user.id] = defaultSettings(db.systemSettings.defaultInputLanguage, db.systemSettings.defaultUiLanguage);
  db.customAi[user.id] = null;
  save();
  audit(user.id, "register", "auth", mail);
  return NextResponse.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    settings: db.userSettings[user.id],
  });
}
