/**
 * Simple in-memory rate limiter
 * Resets on server restart — sufficient for Render single-instance
 * For multi-instance, replace Map with Redis
 */

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;

  if (!allowed) {
    // Auto-cleanup after window expires
    setTimeout(() => store.delete(key), entry.resetAt - now + 100);
  }

  return { allowed, remaining, resetAt: entry.resetAt };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

// Alias used throughout the codebase
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  return rateLimit(key, limit, windowMs).allowed;
}

// ── Idempotency key store ─────────────────────────────────────────────────────
// Prevents duplicate bookings from double-clicks / network retries.
// Key = idempotencyKey string, Value = serialised response + expiry
type IdempotencyEntry = { body: string; status: number; expiresAt: number };
const idempotencyStore = new Map<string, IdempotencyEntry>();

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getIdempotencyResult(key: string): IdempotencyEntry | null {
  const entry = idempotencyStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { idempotencyStore.delete(key); return null; }
  return entry;
}

export function setIdempotencyResult(key: string, body: string, status: number): void {
  idempotencyStore.set(key, { body, status, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS });
}

export function getClientIp(req: { headers: { get(k: string): string | null } }): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}
