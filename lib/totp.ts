import * as OTPAuth from "otpauth";
import { createHmac, randomBytes } from "crypto";

// Generate a new TOTP secret for an admin user
// Must be valid Base32 (RFC 4648): chars A-Z and 2-7 only, length multiple of 8
export function generateTotpSecret(): string {
  const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = randomBytes(20);
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += BASE32_CHARS[bytes[i % 20] % 32];
  }
  return result;
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
  const delta = totp.validate({ token, window: 2 });
  return delta !== null;
}
