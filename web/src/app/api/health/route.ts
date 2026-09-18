import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: { database: { status: "healthy" }, ai: { status: "demo" } },
    uptime: Math.round(process.uptime()),
    version: "1.0.0",
    users: db.users.length,
  });
}
