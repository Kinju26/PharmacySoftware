import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSessionSecret, SESSION_IDLE_MS } from "@/lib/auth/config";
import {
  createSession,
  destroySession,
  getSession,
  touchSession,
} from "@/lib/auth/store";
import type { AuthRole } from "@/lib/auth/types";

function secretKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export async function setSessionCookie(sessionId: string) {
  const token = await new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${Math.ceil(SESSION_IDLE_MS / 1000)}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(SESSION_IDLE_MS / 1000),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sid = payload.sid;
    return typeof sid === "string" ? sid : null;
  } catch {
    return null;
  }
}

export async function startSession(input: {
  userId: string;
  email: string;
  role: AuthRole;
  ip: string;
  userAgent: string;
}) {
  const session = await createSession(input);
  await setSessionCookie(session.id);
  return session;
}

export async function getCurrentSession() {
  const sid = await readSessionIdFromCookie();
  if (!sid) return null;
  const session = await touchSession(sid);
  if (!session) {
    await clearSessionCookie();
    return null;
  }
  // refresh cookie expiry window on activity
  await setSessionCookie(session.id);
  return session;
}

export async function endSession(reason: "logout" | "timeout" = "logout") {
  const sid = await readSessionIdFromCookie();
  const session = sid ? await destroySession(sid) : null;
  await clearSessionCookie();
  return { session, reason };
}

export async function peekSession() {
  const sid = await readSessionIdFromCookie();
  if (!sid) return null;
  return getSession(sid);
}
