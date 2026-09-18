import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    plans: db.plans.filter((p) => p.active).map(({ id, name, price, currency, cycle, features, popular }) => ({
      id, name, price, currency, cycle, features, popular,
    })),
  });
}
