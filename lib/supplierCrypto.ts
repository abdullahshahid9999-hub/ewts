import crypto from "crypto";

/**
 * Encrypts/decrypts supplier API keys before they ever touch the database.
 * AES-256-GCM: a fresh random IV per encryption, auth tag verifies nothing
 * was tampered with. The encryption key itself lives ONLY in the
 * SUPPLIER_KEY_SECRET env var (never in the database, never in git) — if
 * that env var is lost, encrypted keys become unrecoverable, which is the
 * correct tradeoff for secrets (better than a recoverable-but-weaker
 * scheme). Generate it once with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * and set it as a Render env var.
 */

function getKey(): Buffer {
  const secret = process.env.SUPPLIER_KEY_SECRET;
  if (!secret) throw new Error("SUPPLIER_KEY_SECRET is not configured — cannot encrypt/decrypt supplier credentials.");
  // Accept either a 64-char hex string (32 bytes) or derive one via sha256
  // if the owner set something else — sha256 always yields exactly 32
  // bytes, which is what AES-256 requires.
  return /^[0-9a-f]{64}$/i.test(secret) ? Buffer.from(secret, "hex") : crypto.createHash("sha256").update(secret).digest();
}

export function encryptSupplierKey(plaintext: string): string {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as iv:authTag:ciphertext, each base64 — self-contained, one column.
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSupplierKey(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed encrypted supplier key.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Masked display for the admin UI — never send the real key back to the browser. */
export function maskedKeyPreview(stored: string | null): string {
  if (!stored) return "";
  try {
    const real = decryptSupplierKey(stored);
    return real.length <= 4 ? "••••" : `••••${real.slice(-4)}`;
  } catch {
    return "•••• (saved)";
  }
}
