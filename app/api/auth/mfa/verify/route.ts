import { NextRequest, NextResponse } from "next/server";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/config";
import { clientMeta, sanitizeOtp, sanitizeText } from "@/lib/auth/request";
import { startSession } from "@/lib/auth/session-cookie";
import {
  clearLoginFailures,
  consumeMfaChallenge,
  enableTotp,
  findAccountById,
  insertAudit,
} from "@/lib/auth/store";
import { verifyTotpCode } from "@/lib/auth/totp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const meta = clientMeta(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
  }

  const challengeId = sanitizeText((body as { challengeId?: unknown }).challengeId, 80);
  const code = sanitizeOtp((body as { code?: unknown }).code);

  if (!challengeId || !code) {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
  }

  const challenge = await consumeMfaChallenge(challengeId);
  if (!challenge) {
    await insertAudit({
      userId: null,
      eventType: "mfa_failure",
      ip: meta.ip,
      userAgent: meta.userAgent,
      detail: "challenge_missing",
    });
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  const account = await findAccountById(challenge.userId);
  if (!account || account.status !== "active") {
    await insertAudit({
      userId: challenge.userId,
      eventType: "mfa_failure",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  const secret = challenge.pendingTotpSecret || account.totpSecret;
  if (!secret || !verifyTotpCode(secret, code)) {
    await insertAudit({
      userId: account.id,
      eventType: "mfa_failure",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  if (challenge.pendingTotpSecret) {
    await enableTotp(account.id, challenge.pendingTotpSecret);
  }

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
    eventType: "mfa_success",
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
    user: { id: account.id, email: account.email, name: account.name, role: account.role },
  });
}
