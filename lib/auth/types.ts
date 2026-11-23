export type AuthRole = "admin" | "pharmacist" | "cashier" | "user";

export type AuthAccount = {
  id: string;
  name: string;
  email: string;
  /** argon2id hash only — never plaintext */
  passwordHash: string;
  role: AuthRole;
  status: "active" | "inactive" | "invited";
  failedAttempts: number;
  lockedUntil: number | null;
  totpSecret: string | null;
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  email: string;
  role: AuthRole;
  createdAt: number;
  lastActiveAt: number;
  ip: string;
  userAgent: string;
};

export type MfaChallenge = {
  id: string;
  userId: string;
  email: string;
  expiresAt: number;
  /** pending setup secret before first verify */
  pendingTotpSecret?: string;
};

export type AuthInvite = {
  id: string;
  email: string;
  role: AuthRole;
  name: string;
  tokenHash: string;
  invitedBy: string;
  expiresAt: number;
  usedAt: number | null;
  createdAt: string;
};

export type AuditEventType =
  | "login_success"
  | "login_failure"
  | "account_locked"
  | "mfa_success"
  | "mfa_failure"
  | "logout"
  | "session_timeout"
  | "invite_created"
  | "invite_accepted";

export type AuditRecord = {
  id: string;
  userId: string | null;
  eventType: AuditEventType;
  timestamp: string;
  ip: string;
  userAgent: string;
  detail?: string;
};

export type AuthStoreData = {
  accounts: AuthAccount[];
  sessions: AuthSession[];
  challenges: MfaChallenge[];
  invites: AuthInvite[];
  audit: AuditRecord[];
};
