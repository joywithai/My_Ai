import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  return NextResponse.json({ expressions: getDb().expressions });
}

export async function PUT(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const { id, patch } = await req.json();
  const e = db.expressions.find((x) => x.id === id);
  if (!e) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (typeof patch.active === "boolean") e.active = patch.active;
  if (patch.minRole === "public_user" || patch.minRole === "subscriber") e.minRole = patch.minRole;
  if (typeof patch.label === "string") e.label = patch.label.slice(0, 40);
  save();
  audit(g.user.id, "update_expression", "expressions", `${e.name} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const { name, label, minRole } = await req.json();
  if (!name || db.expressions.some((x) => x.name === name)) {
    return NextResponse.json({ error: "invalid_or_duplicate" }, { status: 400 });
  }
  db.expressions.push({
    id: crypto.randomUUID(), name: String(name).slice(0, 30), label: String(label ?? name).slice(0, 40),
    minRole: minRole === "subscriber" ? "subscriber" : "public_user", active: true,
  });
  save();
  audit(g.user.id, "add_expression", "expressions", String(name));
  return NextResponse.json({ ok: true });
}
