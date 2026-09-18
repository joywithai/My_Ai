import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  return NextResponse.json({ models: getDb().avatarModels });
}

export async function PUT(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const { id, patch } = await req.json();
  const m = db.avatarModels.find((x) => x.id === id);
  if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (typeof patch.active === "boolean") m.active = patch.active;
  if (patch.minRole === "public_user" || patch.minRole === "subscriber") m.minRole = patch.minRole;
  if (patch.isDefault === true) {
    db.avatarModels.forEach((x) => (x.isDefault = x.id === id));
  }
  if (typeof patch.file === "string" && patch.file.startsWith("/models/")) m.file = patch.file;
  if (typeof patch.name === "string" && patch.name.trim()) m.name = patch.name.trim().slice(0, 50);
  save();
  audit(g.user.id, "update_avatar_model", "avatars", `${m.name} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const { name, gender, file, minRole } = await req.json();
  if (!name || !file || !file.startsWith("/models/")) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const id = "avatar-" + crypto.randomUUID().slice(0, 8);
  db.avatarModels.push({
    id, name: String(name).slice(0, 50),
    gender: gender === "male" ? "male" : "female",
    file, minRole: minRole === "public_user" ? "public_user" : "subscriber",
    active: true, isDefault: false,
  });
  save();
  audit(g.user.id, "add_avatar_model", "avatars", name);
  return NextResponse.json({ ok: true, id });
}
