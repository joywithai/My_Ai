import { NextResponse } from "next/server";
import { userFromRequest, DbUser } from "./db";

export function adminGuard(req: Request): { user: DbUser } | { resp: NextResponse } {
  const user = userFromRequest(req);
  if (!user) return { resp: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (user.role !== "admin") return { resp: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user };
}
