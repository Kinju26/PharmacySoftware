import { NextRequest, NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/auth/password";
import { clientMeta, sanitizeOtp, sanitizeText } from "@/lib/auth/request";
import { startSession } from "@/lib/auth/session-cookie";
import {
  acceptInvite,
  consumeMfaChallenge,
  createMfaChallenge,
  enableTotp,
  findAccountById,
  getInviteByRawToken,
  insertAudit,
} from "@/lib/auth/store";
import { generateTotpSecret, totpQrDataUrl, verifyTotpCode } from "@/lib/auth/totp";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = sanitizeText(req.nextUrl.searchParams.get("token"), 128);
  if (!token) return NextResponse.json({ error: "Invalid invite." }, { status: 400 });
  const invite = await getInviteByRawToken(token);
  if (!invite) return NextResponse.json({ error: "Invite is invalid or expired." }, { status: 404 });
  return NextResponse.json({
    email: invite.email,
    name: invite.name,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });
}

export async function POST(req: NextRequest) {
  const meta = clientMeta(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = sanitizeText((body as { token?: unknown }).token, 128);
  const password = (body as { password?: unknown }).password;
  const name = sanitizeText((body as { name?: unknown }).name, 80);
  const step = sanitizeText((body as { step?: unknown }).step, 20);
  const challengeId = sanitizeText((body as { challengeId?: unknown }).challengeId, 80);
  const code = sanitizeOtp((body as { code?: unknown }).code);

  if (!token) return NextResponse.json({ error: "Invalid invite." }, { status: 400 });

  if (step === "password" || (!step && typeof password === "string" && !code)) {
    if (typeof password !== "string") {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }
    const strength = validatePasswordStrength(password);
    if (strength) return NextResponse.json({ error: strength }, { status: 400 });

    try {
      const account = await acceptInvite({ rawToken: token, password, name: name || undefined });
      const secret = generateTotpSecret();
      const challenge = await createMfaChallenge({
        userId: account.id,
        email: account.email,
        pendingTotpSecret: secret,
      });
      const qrDataUrl = await totpQrDataUrl(account.email, secret);
      return NextResponse.json({
        requiresMfaSetup: true,
        challengeId: challenge.id,
        qrDataUrl,
        email: account.email,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invite failed.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!challengeId || !code) {
    return NextResponse.json({ error: "MFA code required." }, { status: 400 });
  }

  const challenge = await consumeMfaChallenge(challengeId);
  if (!challenge?.pendingTotpSecret) {
    await insertAudit({
      userId: null,
      eventType: "mfa_failure",
      ip: meta.ip,
      userAgent: meta.userAgent,
      detail: "invite_mfa",
    });
    return NextResponse.json({ error: "Invalid or expired MFA challenge." }, { status: 401 });
  }

  if (!verifyTotpCode(challenge.pendingTotpSecret, code)) {
    await insertAudit({
      userId: challenge.userId,
      eventType: "mfa_failure",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });
  }

  await enableTotp(challenge.userId, challenge.pendingTotpSecret);
  const account = await findAccountById(challenge.userId);
  if (!account) return NextResponse.json({ error: "Account missing." }, { status: 400 });

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
