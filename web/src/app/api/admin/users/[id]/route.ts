import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const user = db.users.find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (user.id === g.user.id) return NextResponse.json({ error: "cannot_modify_self" }, { status: 400 });

  const patch = await req.json();
  if (patch.role && ["admin", "subscriber", "public_user"].includes(patch.role)) user.role = patch.role;
  if (patch.status && ["active", "banned", "inactive"].includes(patch.status)) user.status = patch.status;
  if (typeof patch.name === "string" && patch.name.trim()) user.name = patch.name.trim().slice(0, 60);
  save();
  audit(g.user.id, "update_user", "users", `${user.email} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const user = db.users.find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (user.id === g.user.id) return NextResponse.json({ error: "cannot_modify_self" }, { status: 400 });
  db.users = db.users.filter((u) => u.id !== params.id);
  delete db.userSettings[params.id];
  delete db.customAi[params.id];
  db.conversations = db.conversations.filter((c) => c.userId !== params.id);
  save();
  audit(g.user.id, "delete_user", "users", user.email);
  return NextResponse.json({ ok: true });
}
