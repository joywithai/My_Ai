import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  return NextResponse.json({ systemSettings: getDb().systemSettings });
}

export async function PUT(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const patch = await req.json();
  const s = db.systemSettings;
  if (patch.defaultUiLanguage === "bn" || patch.defaultUiLanguage === "en") s.defaultUiLanguage = patch.defaultUiLanguage;
  if (patch.defaultInputLanguage === "bn" || patch.defaultInputLanguage === "en") s.defaultInputLanguage = patch.defaultInputLanguage;
  if (typeof patch.registrationOpen === "boolean") s.registrationOpen = patch.registrationOpen;
  if (typeof patch.aiModel === "string" && patch.aiModel.trim()) s.aiModel = patch.aiModel.trim().slice(0, 80);
  save();
  audit(g.user.id, "update_system_settings", "system", JSON.stringify(patch));
  return NextResponse.json({ systemSettings: s });
}
