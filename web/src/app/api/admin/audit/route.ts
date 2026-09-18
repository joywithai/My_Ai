import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { adminGuard } from "@/lib/server/guard";

export async function GET(req: NextRequest) {
  const g = adminGuard(req);
  if ("resp" in g) return g.resp;
  return NextResponse.json({ audit: getDb().audit.slice(0, 80) });
}
