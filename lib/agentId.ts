/**
 * EWTS Agent ID Generator
 * Schema: {BRAND_INITIALS}-{ZERO_PADDED_SEQUENCE}
 * Examples: EW-01 (master admin), EW-02, EW-03 …
 */

const SKIP_WORDS = new Set(["and", "of", "&", "the", "a", "an"]);

/**
 * Derive 2-letter brand initials from a business name.
 * Rules:
 *  1. Split on whitespace
 *  2. Skip common connecting words (and, of, &, the, a, an)
 *  3. Take the first letter of each remaining primary word
 *  4. Use the first two letters of that result
 *  5. If only one primary word exists, take its first two letters
 */
export function getBrandInitials(brandName: string): string {
  const words = brandName.trim().split(/\s+/);
  const primary = words.filter((w) => !SKIP_WORDS.has(w.toLowerCase()));

  if (primary.length === 0) {
    // fallback: first two letters of full name
    return brandName.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  }

  if (primary.length === 1) {
    return primary[0].slice(0, 2).toUpperCase();
  }

  // Take first letter of each primary word, then grab first 2 chars
  const initials = primary.map((w) => w[0]).join("").toUpperCase();
  return initials.slice(0, 2);
}

/**
 * Format sequence number with zero-padding.
 * 1–99   → "01" … "99"
 * 100+   → "100" … (no padding needed)
 */
export function formatSequence(n: number): string {
  if (n < 1) throw new Error("Sequence must be ≥ 1");
  return n < 100 ? String(n).padStart(2, "0") : String(n);
}

/**
 * Generate a deterministic Agent ID.
 * @param brandName  Full business name, e.g. "East and West Travel Services"
 * @param sequence   Registration number (1 = master admin, 2+ = subsequent agents)
 */
export function generateAgentId(brandName: string, sequence: number): string {
  const initials = getBrandInitials(brandName);
  const seq = formatSequence(sequence);
  return `${initials}-${seq}`;
}

// ─── Quick reference examples ───────────────────────────────────────────────
// generateAgentId("East and West Travel Services", 1)  → "EW-01"
// generateAgentId("East and West Travel Services", 2)  → "EW-02"
// generateAgentId("Amazing Holidays", 1)               → "AH-01"
// generateAgentId("Faisalabad Hajj & Umrah", 1)        → "FH-01"
// generateAgentId("Aslam Travels", 1)                  → "AT-01"
// generateAgentId("Flydubai", 1)                       → "FL-01"
