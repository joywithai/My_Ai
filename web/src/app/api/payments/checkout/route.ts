import { NextRequest, NextResponse } from "next/server";
import { getDb, save, userFromRequest, audit } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const { planId } = await req.json();
  const plan = db.plans.find((p) => p.id === planId && p.active);
  if (!plan || plan.price <= 0) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  const payment = {
    id: crypto.randomUUID(),
    userId: user.id,
    planId: plan.id,
    amount: plan.price,
    currency: plan.currency,
    status: "succeeded" as const, // demo gateway; Stripe/SSLCommerz later
    provider: "demo",
    referenceId: "demo_" + crypto.randomUUID().slice(0, 8),
    createdAt: Date.now(),
  };
  db.payments.unshift(payment);
  const days = plan.cycle === "yearly" ? 365 : 30;
  db.subscriptions = db.subscriptions.filter((s) => s.userId !== user.id);
  db.subscriptions.push({
    id: crypto.randomUUID(),
    userId: user.id,
    planId: plan.id,
    status: "active",
    startedAt: Date.now(),
    expiresAt: Date.now() + days * 24 * 3600 * 1000,
  });
  if (user.role === "public_user") user.role = "subscriber";
  save();
  audit(user.id, "subscribe", "payment", `${plan.id} ${plan.price} ${plan.currency}`);
  return NextResponse.json({ ok: true, payment, role: user.role });
}
