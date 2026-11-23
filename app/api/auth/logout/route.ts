import { NextRequest, NextResponse } from "next/server";
import { clientMeta } from "@/lib/auth/request";
import { endSession } from "@/lib/auth/session-cookie";
import { insertAudit } from "@/lib/auth/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const meta = clientMeta(req);
  const body = await req.json().catch(() => ({}));
  const timedOut = Boolean((body as { timedOut?: unknown }).timedOut);
  const { session } = await endSession(timedOut ? "timeout" : "logout");

  await insertAudit({
    userId: session?.userId ?? null,
    eventType: timedOut ? "session_timeout" : "logout",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ ok: true });
}
