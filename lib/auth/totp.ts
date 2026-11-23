import { generateSecret, generateSync, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { TOTP_ISSUER } from "@/lib/auth/config";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return generateURI({
    issuer: TOTP_ISSUER,
    label: email,
    secret,
  });
}

export async function totpQrDataUrl(email: string, secret: string): Promise<string> {
  return QRCode.toDataURL(totpKeyUri(email, secret));
}

export function verifyTotpCode(secret: string, token: string): boolean {
  const code = String(token || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = verifySync({ secret, token: code });
    return Boolean(result && result.valid);
  } catch {
    return false;
  }
}

/** Dev/test helper — not used in production responses. */
export function currentTotpCode(secret: string): string {
  return generateSync({ secret });
}
