import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  const plan = db.plans.find((p) => p.id === params.id);
  if (!plan) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patch = await req.json();
  if (typeof patch.price === "number" && patch.price >= 0) plan.price = patch.price;
  if (typeof patch.active === "boolean") plan.active = patch.active;
  if (typeof patch.name === "string" && patch.name.trim()) plan.name = patch.name.trim().slice(0, 50);
  if (Array.isArray(patch.features)) plan.features = patch.features.map((f: any) => String(f).slice(0, 80)).slice(0, 10);
  save();
  audit(g.user.id, "update_plan", "plans", `${plan.id} → ${JSON.stringify(patch)}`);
  return NextResponse.json({ ok: true });
}
