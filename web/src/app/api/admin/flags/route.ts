import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

const FLAG_KEYS = [
  "canUseCustomApiKey", "canAccessAllExpressions", "canAccessAllAnimations",
  "canSelectAvatarModel", "canCustomizeVoice", "canAccessChatHistory",
  "maxConversationHistory", "maxMessagesPerDay",
];

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  return NextResponse.json({ flags: getDb().flags });
}

export async function PUT(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const { role, patch } = await req.json();
  if (!db.flags[role]) return NextResponse.json({ error: "bad_role" }, { status: 400 });
  for (const [k, v] of Object.entries(patch)) {
    if (FLAG_KEYS.includes(k)) db.flags[role][k] = v;
  }
  save();
  audit(g.user.id, "update_flags", "flags", `${role} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ flags: db.flags });
}
