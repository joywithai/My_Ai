import { NextRequest, NextResponse } from "next/server";
import { getDb, save, audit } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  const db = getDb();
  return NextResponse.json({ plans: db.plans, payments: db.payments.slice(0, 50), subscriptions: db.subscriptions });
}
