/** Client-side auth helpers: lockout, remember-device, demo OTP. */

export const REMEMBER_KEY = "canadian_pharmacy_os_remember_v1";
export const LOCK_KEY = "canadian_pharmacy_os_lock_v1";
export const OTP_KEY = "canadian_pharmacy_os_otp_v1";

export const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;
export const LOCK_AFTER = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const SESSION_IDLE_MS = 15 * 60 * 1000;
export const SESSION_WARN_MS = 60 * 1000;

type LockState = { fails: number; until: number };
type RememberState = { email: string; expires: number };
type OtpState = { email: string; code: string; expires: number };

function readJson<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T | null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getLockState(): LockState {
  const s = readJson<LockState>(LOCK_KEY);
  if (!s) return { fails: 0, until: 0 };
  if (s.until && Date.now() >= s.until) {
    writeJson(LOCK_KEY, { fails: 0, until: 0 });
    return { fails: 0, until: 0 };
  }
  return s;
}

export function lockoutMessage(): string | null {
  const s = getLockState();
  if (!s.until || Date.now() >= s.until) return null;
  const mins = Math.max(1, Math.ceil((s.until - Date.now()) / 60000));
  return `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`;
}

export function recordFailedAttempt(): string {
  const s = getLockState();
  const fails = s.fails + 1;
  if (fails >= LOCK_AFTER) {
    writeJson(LOCK_KEY, { fails, until: Date.now() + LOCK_MS });
    return `Too many failed attempts. Try again in 15 minutes.`;
  }
  writeJson(LOCK_KEY, { fails, until: 0 });
  return "Invalid email or password";
}

export function clearFailedAttempts() {
  writeJson(LOCK_KEY, { fails: 0, until: 0 });
}

export function setRememberedEmail(email: string) {
  writeJson(REMEMBER_KEY, { email, expires: Date.now() + REMEMBER_MS } satisfies RememberState);
}

export function clearRememberedEmail() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* ignore */
  }
}

export function getRememberedEmail(): string | null {
  const s = readJson<RememberState>(REMEMBER_KEY);
  if (!s?.email || !s.expires || Date.now() >= s.expires) {
    clearRememberedEmail();
    return null;
  }
  return s.email;
}

export function createOtp(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  writeJson(OTP_KEY, {
    email: email.trim().toLowerCase(),
    code,
    expires: Date.now() + 5 * 60 * 1000,
  } satisfies OtpState);
  return code;
}

export function verifyOtp(email: string, code: string): boolean {
  const s = readJson<OtpState>(OTP_KEY);
  if (!s) return false;
  if (Date.now() >= s.expires) {
    try {
      localStorage.removeItem(OTP_KEY);
    } catch {
      /* ignore */
    }
    return false;
  }
  const ok =
    s.email === email.trim().toLowerCase() && s.code === code.trim();
  if (ok) {
    try {
      localStorage.removeItem(OTP_KEY);
    } catch {
      /* ignore */
    }
  }
  return ok;
}
