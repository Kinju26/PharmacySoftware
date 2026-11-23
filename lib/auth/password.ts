import argon2 from "argon2";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/messages";

const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /\d/;
const SYMBOL = /[^A-Za-z0-9]/;

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!UPPER.test(password)) return "Password must include an uppercase letter.";
  if (!LOWER.test(password)) return "Password must include a lowercase letter.";
  if (!DIGIT.test(password)) return "Password must include a number.";
  if (!SYMBOL.test(password)) return "Password must include a symbol.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const strength = validatePasswordStrength(password);
  if (strength) throw new Error(strength);
  return argon2.hash(password, { type: argon2.argon2id });
}

/** Hash without strength check — only for migrating already-validated passwords. */
export async function hashPasswordTrusted(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || typeof password !== "string") return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
