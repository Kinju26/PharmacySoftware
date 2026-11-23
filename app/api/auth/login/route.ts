import { NextRequest, NextResponse } from "next/server";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/config";
import { clientMeta, sanitizeEmail } from "@/lib/auth/request";
import { startSession } from "@/lib/auth/session-cookie";
import {
  clearLoginFailures,
  insertAudit,
  recordLoginFailure,
  verifyAccountPassword,
} from "@/lib/auth/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const meta = clientMeta(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
  }

  const email = sanitizeEmail((body as { email?: unknown }).email);
  const password = (body as { password?: unknown }).password;

  if (!email || typeof password !== "string" || !password) {
    await insertAudit({
      userId: null,
      eventType: "login_failure",
      ip: meta.ip,
      userAgent: meta.userAgent,
      detail: "invalid_input",
    });
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  const result = await verifyAccountPassword(email, password);
  if (!result.ok) {
    await recordLoginFailure(result.account, meta);
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  const account = result.account;
  await clearLoginFailures(account.id);
  await startSession({
    userId: account.id,
    email: account.email,
    role: account.role,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  await insertAudit({
    userId: account.id,
    eventType: "login_success",
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    },
  });
}
