/**
 * Minimal in-memory rate limiter, keyed by an arbitrary string (e.g.
 * `login:${email}` or `otp:${agentId}`).
 *
 * LIMITATION: this only works correctly on a single server instance. If
 * this app is ever deployed across multiple Render instances/replicas,
 * replace this with a shared store (Redis, or a database-backed counter)
 * so limits are enforced across all instances. Documented here rather than
 * silently under-enforcing in production.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically clear expired buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

/**
 * Returns true if the action is allowed, false if the caller is
 * rate-limited. `windowMs` is the sliding window length, `max` is the
 * number of allowed attempts within that window.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}
