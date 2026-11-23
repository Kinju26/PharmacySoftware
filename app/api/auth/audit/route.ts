import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session-cookie";
import { findAccountById, listAudit } from "@/lib/auth/store";

export const runtime = "nodejs";

/** Read-only audit feed for admins. Records are insert-only elsewhere. */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await findAccountById(session.userId);
  if (!account || account.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const records = await listAudit(300);
  return NextResponse.json({ records });
}
