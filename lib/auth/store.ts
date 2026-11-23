import { promises as fs } from "fs";
import path from "path";
import { randomBytes, createHash } from "crypto";
import {
  getBootstrapAdmin,
  INVITE_TTL_MS,
  LOCKOUT_DURATION_MS,
  LOCKOUT_MAX_ATTEMPTS,
  MFA_CHALLENGE_TTL_MS,
  SESSION_IDLE_MS,
} from "@/lib/auth/config";
import { hashPassword, hashPasswordTrusted, verifyPassword } from "@/lib/auth/password";
import type {
  AuditEventType,
  AuditRecord,
  AuthAccount,
  AuthInvite,
  AuthRole,
  AuthSession,
  AuthStoreData,
  MfaChallenge,
} from "@/lib/auth/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "auth-store.json");

let writeChain: Promise<void> = Promise.resolve();

function newId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function emptyStore(): AuthStoreData {
  return { accounts: [], sessions: [], challenges: [], invites: [], audit: [] };
}

async function ensureStore(): Promise<AuthStoreData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AuthStoreData;
    return {
      accounts: parsed.accounts || [],
      sessions: parsed.sessions || [],
      challenges: parsed.challenges || [],
      invites: parsed.invites || [],
      audit: parsed.audit || [],
    };
  } catch {
    const boot = emptyStore();
    await fs.writeFile(STORE_PATH, JSON.stringify(boot, null, 2), "utf8");
    return boot;
  }
}

async function persist(data: AuthStoreData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, STORE_PATH);
}

async function withStore<T>(fn: (data: AuthStoreData) => Promise<T> | T): Promise<T> {
  let result!: T;
  writeChain = writeChain.then(async () => {
    const data = await ensureStore();
    result = await fn(data);
    await persist(data);
  });
  await writeChain;
  return result;
}

async function ensureBootstrapAdmin(data: AuthStoreData) {
  const boot = getBootstrapAdmin();
  if (!boot.password) return;
  const existing = data.accounts.find((a) => a.email === boot.email);
  if (existing) return;
  // Bootstrap admin may use a shorter env password; staff invites still enforce strong passwords.
  const now = new Date().toISOString();
  data.accounts.push({
    id: newId("usr"),
    name: boot.name,
    email: boot.email,
    passwordHash: await hashPasswordTrusted(boot.password),
    role: "admin",
    status: "active",
    failedAttempts: 0,
    lockedUntil: null,
    totpSecret: null,
    totpEnabled: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function insertAudit(input: {
  userId: string | null;
  eventType: AuditEventType;
  ip: string;
  userAgent: string;
  detail?: string;
}) {
  return withStore((data) => {
    const record: AuditRecord = {
      id: newId("aud"),
      userId: input.userId,
      eventType: input.eventType,
      timestamp: new Date().toISOString(),
      ip: input.ip || "unknown",
      userAgent: (input.userAgent || "unknown").slice(0, 500),
      detail: input.detail,
    };
    data.audit.unshift(record);
    data.audit = data.audit.slice(0, 5000);
    return record;
  });
}

export async function findAccountByEmail(email: string): Promise<AuthAccount | null> {
  return withStore(async (data) => {
    await ensureBootstrapAdmin(data);
    return data.accounts.find((a) => a.email === email.trim().toLowerCase()) || null;
  });
}

export async function findAccountById(id: string): Promise<AuthAccount | null> {
  return withStore((data) => data.accounts.find((a) => a.id === id) || null);
}

export async function listAudit(limit = 200): Promise<AuditRecord[]> {
  return withStore((data) => data.audit.slice(0, limit));
}

export function isAccountLocked(account: AuthAccount): boolean {
  return Boolean(account.lockedUntil && account.lockedUntil > Date.now());
}

export async function recordLoginFailure(account: AuthAccount | null, meta: { ip: string; userAgent: string }) {
  return withStore(async (data) => {
    let locked = false;
    if (account) {
      const row = data.accounts.find((a) => a.id === account.id);
      if (row) {
        row.failedAttempts += 1;
        row.updatedAt = new Date().toISOString();
        if (row.failedAttempts >= LOCKOUT_MAX_ATTEMPTS) {
          row.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
          row.failedAttempts = 0;
          locked = true;
        }
      }
    }
    data.audit.unshift({
      id: newId("aud"),
      userId: account?.id ?? null,
      eventType: "login_failure",
      timestamp: new Date().toISOString(),
      ip: meta.ip,
      userAgent: meta.userAgent.slice(0, 500),
    });
    if (locked && account) {
      data.audit.unshift({
        id: newId("aud"),
        userId: account.id,
        eventType: "account_locked",
        timestamp: new Date().toISOString(),
        ip: meta.ip,
        userAgent: meta.userAgent.slice(0, 500),
      });
    }
    data.audit = data.audit.slice(0, 5000);
    return { locked };
  });
}

export async function clearLoginFailures(userId: string) {
  return withStore((data) => {
    const row = data.accounts.find((a) => a.id === userId);
    if (row) {
      row.failedAttempts = 0;
      row.lockedUntil = null;
      row.updatedAt = new Date().toISOString();
    }
  });
}

export async function createMfaChallenge(input: {
  userId: string;
  email: string;
  pendingTotpSecret?: string;
}): Promise<MfaChallenge> {
  return withStore((data) => {
    data.challenges = data.challenges.filter((c) => c.expiresAt > Date.now());
    const challenge: MfaChallenge = {
      id: newId("mfa"),
      userId: input.userId,
      email: input.email,
      expiresAt: Date.now() + MFA_CHALLENGE_TTL_MS,
      pendingTotpSecret: input.pendingTotpSecret,
    };
    data.challenges.push(challenge);
    return challenge;
  });
}

export async function getMfaChallenge(id: string): Promise<MfaChallenge | null> {
  return withStore((data) => {
    data.challenges = data.challenges.filter((c) => c.expiresAt > Date.now());
    return data.challenges.find((c) => c.id === id) || null;
  });
}

export async function consumeMfaChallenge(id: string): Promise<MfaChallenge | null> {
  return withStore((data) => {
    const idx = data.challenges.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    const [challenge] = data.challenges.splice(idx, 1);
    if (challenge.expiresAt <= Date.now()) return null;
    return challenge;
  });
}

export async function enableTotp(userId: string, secret: string) {
  return withStore((data) => {
    const row = data.accounts.find((a) => a.id === userId);
    if (!row) return;
    row.totpSecret = secret;
    row.totpEnabled = true;
    row.updatedAt = new Date().toISOString();
  });
}

export async function createSession(input: {
  userId: string;
  email: string;
  role: AuthRole;
  ip: string;
  userAgent: string;
}): Promise<AuthSession> {
  return withStore((data) => {
    const now = Date.now();
    data.sessions = data.sessions.filter((s) => now - s.lastActiveAt < SESSION_IDLE_MS);
    const session: AuthSession = {
      id: newId("ses"),
      userId: input.userId,
      email: input.email,
      role: input.role,
      createdAt: now,
      lastActiveAt: now,
      ip: input.ip,
      userAgent: input.userAgent.slice(0, 500),
    };
    data.sessions.push(session);
    return session;
  });
}

export async function getSession(sessionId: string): Promise<AuthSession | null> {
  return withStore((data) => {
    const now = Date.now();
    const session = data.sessions.find((s) => s.id === sessionId) || null;
    if (!session) return null;
    if (now - session.lastActiveAt > SESSION_IDLE_MS) {
      data.sessions = data.sessions.filter((s) => s.id !== sessionId);
      return null;
    }
    return session;
  });
}

export async function touchSession(sessionId: string): Promise<AuthSession | null> {
  return withStore((data) => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const now = Date.now();
    if (now - session.lastActiveAt > SESSION_IDLE_MS) {
      data.sessions = data.sessions.filter((s) => s.id !== sessionId);
      return null;
    }
    session.lastActiveAt = now;
    return session;
  });
}

export async function destroySession(sessionId: string): Promise<AuthSession | null> {
  return withStore((data) => {
    const idx = data.sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return null;
    const [session] = data.sessions.splice(idx, 1);
    return session;
  });
}

export async function destroySessionTimedOut(sessionId: string): Promise<AuthSession | null> {
  return destroySession(sessionId);
}

export async function verifyAccountPassword(email: string, password: string) {
  const account = await findAccountByEmail(email);
  if (!account || account.status !== "active") {
    return { ok: false as const, account: null, reason: "invalid" as const };
  }
  if (isAccountLocked(account)) {
    return { ok: false as const, account, reason: "locked" as const };
  }
  const valid = await verifyPassword(account.passwordHash, password);
  if (!valid) return { ok: false as const, account, reason: "invalid" as const };
  return { ok: true as const, account };
}

export async function createInvite(input: {
  email: string;
  role: AuthRole;
  name: string;
  invitedBy: string;
}): Promise<{ invite: AuthInvite; rawToken: string }> {
  return withStore(async (data) => {
    await ensureBootstrapAdmin(data);
    const email = input.email.trim().toLowerCase();
    if (data.accounts.some((a) => a.email === email && a.status === "active")) {
      throw new Error("An active account with this email already exists.");
    }
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const invite: AuthInvite = {
      id: newId("inv"),
      email,
      role: input.role,
      name: input.name.trim(),
      tokenHash,
      invitedBy: input.invitedBy,
      expiresAt: Date.now() + INVITE_TTL_MS,
      usedAt: null,
      createdAt: new Date().toISOString(),
    };
    data.invites.push(invite);
    data.audit.unshift({
      id: newId("aud"),
      userId: input.invitedBy,
      eventType: "invite_created",
      timestamp: new Date().toISOString(),
      ip: "server",
      userAgent: "admin",
      detail: email,
    });
    return { invite, rawToken };
  });
}

export async function getInviteByRawToken(rawToken: string): Promise<AuthInvite | null> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  return withStore((data) => {
    const invite = data.invites.find((i) => i.tokenHash === tokenHash) || null;
    if (!invite) return null;
    if (invite.usedAt || invite.expiresAt <= Date.now()) return null;
    return invite;
  });
}

export async function acceptInvite(input: {
  rawToken: string;
  password: string;
  name?: string;
}): Promise<AuthAccount> {
  return withStore(async (data) => {
    const tokenHash = createHash("sha256").update(input.rawToken).digest("hex");
    const invite = data.invites.find((i) => i.tokenHash === tokenHash);
    if (!invite || invite.usedAt || invite.expiresAt <= Date.now()) {
      throw new Error("Invite is invalid or expired.");
    }
    const passwordHash = await hashPassword(input.password);
    const now = new Date().toISOString();
    let account = data.accounts.find((a) => a.email === invite.email);
    if (account) {
      account.passwordHash = passwordHash;
      account.name = (input.name || invite.name || account.name).trim();
      account.role = invite.role;
      account.status = "active";
      account.totpEnabled = false;
      account.totpSecret = null;
      account.failedAttempts = 0;
      account.lockedUntil = null;
      account.updatedAt = now;
    } else {
      account = {
        id: newId("usr"),
        name: (input.name || invite.name || invite.email).trim(),
        email: invite.email,
        passwordHash,
        role: invite.role,
        status: "active",
        failedAttempts: 0,
        lockedUntil: null,
        totpSecret: null,
        totpEnabled: false,
        createdAt: now,
        updatedAt: now,
      };
      data.accounts.push(account);
    }
    invite.usedAt = Date.now();
    data.audit.unshift({
      id: newId("aud"),
      userId: account.id,
      eventType: "invite_accepted",
      timestamp: now,
      ip: "server",
      userAgent: "invite",
      detail: invite.email,
    });
    return account;
  });
}

/** Dev helper: set/replace admin password hash when bootstrapping from env. */
export async function upsertAdminPasswordFromEnv() {
  const boot = getBootstrapAdmin();
  if (!boot.password) return;
  return withStore(async (data) => {
    await ensureBootstrapAdmin(data);
    const row = data.accounts.find((a) => a.email === boot.email);
    if (!row) return;
    // Only re-hash if still placeholder empty (should not happen) — keep existing hash stable.
    void hashPasswordTrusted;
  });
}
