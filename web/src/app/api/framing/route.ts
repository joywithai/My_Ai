import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

/** Public: the avatar framing everyone should see (locked = admin enforced). */
export async function GET() {
  const { framing } = getDb().systemSettings;
  return NextResponse.json({ framing });
}
