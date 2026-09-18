import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  return NextResponse.json({ animations: getDb().animations });
}

export async function PUT(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const { id, patch } = await req.json();
  const a = db.animations.find((x) => x.id === id);
  if (!a) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (typeof patch.active === "boolean") a.active = patch.active;
  if (patch.minRole === "public_user" || patch.minRole === "subscriber") a.minRole = patch.minRole;
  save();
  audit(g.user.id, "update_animation", "animations", `${a.name} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ ok: true });
}
