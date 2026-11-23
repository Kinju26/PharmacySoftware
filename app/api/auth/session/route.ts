import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session-cookie";
import { findAccountById } from "@/lib/auth/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const account = await findAccountById(session.userId);
  if (!account || account.status !== "active") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    },
    lastActiveAt: session.lastActiveAt,
  });
}
