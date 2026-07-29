import * as OTPAuth from "otpauth";
import { createHmac, randomBytes } from "crypto";

// Generate a new TOTP secret for an admin user
export function generateTotpSecret(): string {
  return randomBytes(20).toString("base64").replace(/[^A-Z2-7]/gi, "A").slice(0, 32).toUpperCase();
}

// Generate the QR code URI for Google Authenticator
export function getTotpUri(secret: string, email: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: "East & West Travel",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

// Verify a TOTP code — allows 1 step window (±30s) for clock drift
export function verifyTotp(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
