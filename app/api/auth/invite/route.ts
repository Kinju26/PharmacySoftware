import { NextRequest, NextResponse } from "next/server";
import { clientMeta, sanitizeEmail, sanitizeText } from "@/lib/auth/request";
import { getCurrentSession } from "@/lib/auth/session-cookie";
import { createInvite, findAccountById } from "@/lib/auth/store";
import type { AuthRole } from "@/lib/auth/types";

export const runtime = "nodejs";

const ROLES: AuthRole[] = ["admin", "pharmacist", "cashier", "user"];

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await findAccountById(session.userId);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = sanitizeEmail((body as { email?: unknown }).email);
  const name = sanitizeText((body as { name?: unknown }).name, 80);
  const roleRaw = sanitizeText((body as { role?: unknown }).role, 32);
  const role = ROLES.includes(roleRaw as AuthRole) ? (roleRaw as AuthRole) : null;

  if (!email || !name || !role) {
    return NextResponse.json({ error: "Valid name, email, and role are required." }, { status: 400 });
  }

  try {
    const { invite, rawToken } = await createInvite({
      email,
      name,
      role,
      invitedBy: admin.id,
    });
    const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const inviteUrl = `${base.replace(/\/$/, "")}/invite/${rawToken}`;
    void clientMeta(req);
    return NextResponse.json({
      ok: true,
      inviteId: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt,
      inviteUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create invite.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
