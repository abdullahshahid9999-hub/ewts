/**
 * EWTS Agent ID System v2
 * Format: {BRAND_INITIALS}-{CITY_CODE}-{TIER_DIGIT}{SERIAL}
 *
 * BRAND_INITIALS: First letter of each primary word (skip: and, of, &, the, a, an) — max 2 letters
 * CITY_CODE: IATA 3-letter city code (uppercase)
 * TIER_DIGIT: 0=bronze, 1=silver, 2=gold, 3=platinum
 * SERIAL: 01-09 (1st agency slot), 11-19 (2nd agency), 21-29 (3rd)...
 *   - Owner always gets X1 (X01, X11, X21...), staff X2, X3... up to X9
 *   - 10, 20, 30... are NEVER assigned (reserved gap)
 *
 * Examples:
 *   Aslam Travels Quetta  Bronze owner  → AT-UET-001
 *   Aslam Travels Quetta  Bronze staff  → AT-UET-002
 *   Arshad Travels Quetta Bronze owner  → AT-UET-011
 *   Arshad Travels Lahore Bronze owner  → AT-LYP-001
 */

const SKIP = new Set(["and","of","&","the","a","an"]);

// Standard IATA city codes for Pakistan + common destinations
export const CITY_CODES: Record<string, string> = {
  // Pakistan
  karachi: "KHI", lahore: "LHE", islamabad: "ISB", rawalpindi: "RWP",
  peshawar: "PEW", quetta: "UET", faisalabad: "LYP", multan: "MUX",
  sialkot: "SKT", hyderabad: "HDD", gujranwala: "GUJ", abbottabad: "AAW",
  bahawalpur: "BHV", sargodha: "SGI", sukkur: "SKZ", larkana: "LRK",
  // Common abbreviations people use
  lhr: "LHE", khi: "KHI", isb: "ISB", pew: "PEW", uet: "UET",
  lyp: "LYP", mux: "MUX", skt: "SKT",
};

export function getBrandInitials(brandName: string): string {
  const words = brandName.trim().split(/\s+/).filter(w => !SKIP.has(w.toLowerCase()));
  if (words.length === 0) return brandName.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getCityCode(city: string): string {
  const key = city.trim().toLowerCase();
  return CITY_CODES[key] ?? city.trim().toUpperCase().slice(0, 3);
}

export const TIER_DIGIT: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3,
};

export const TIER_CREDIT: Record<string, number> = {
  bronze: 0, silver: 500000, gold: 1000000, platinum: 2000000,
};

/**
 * Given existing agentCodes for same prefix+city, find the next available slot.
 * Agency slots: 0X, 1X, 2X... (tens digit = agency block)
 * Within a block: owner=X1, staff=X2..X9, X0 never used
 *
 * Returns { agentCode, agencyBlock }
 */
export function generateAgentCode(
  brandName: string,
  city: string,
  tier: string,
  existingCodes: string[], // all codes with same prefix-city
  isOwner: boolean,
): string {
  const prefix = getBrandInitials(brandName);
  const cityCode = getCityCode(city);
  const tierDigit = TIER_DIGIT[tier.toLowerCase()] ?? 0;

  // Parse existing codes to find occupied agency blocks and serials
  // Code format: XX-XXX-{tierDigit}{tens}{ones} e.g. AT-UET-011
  const base = `${prefix}-${cityCode}-`;

  // Find all (tens) agency blocks already used
  const blocks: Record<number, number[]> = {}; // tens → [ones used]
  for (const code of existingCodes) {
    if (!code.startsWith(base)) continue;
    const suffix = code.slice(base.length); // e.g. "011" or "001"
    if (suffix.length < 3) continue;
    const ones = parseInt(suffix.slice(-1), 10);
    const tens = parseInt(suffix.slice(-2, -1), 10);
    if (!blocks[tens]) blocks[tens] = [];
    blocks[tens].push(ones);
  }

  if (isOwner) {
    // Find next free tens block (ones=1 free)
    let tens = 0;
    while (true) {
      const used = blocks[tens] ?? [];
      if (!used.includes(1)) break;
      tens++;
    }
    return `${base}${tierDigit}${tens}1`;
  } else {
    // Find an existing block where ones 2-9 are not all taken
    // Use the lowest block that has the owner (ones=1) assigned
    const ownerBlocks = Object.entries(blocks)
      .filter(([, ones]) => ones.includes(1))
      .map(([t]) => parseInt(t, 10))
      .sort((a, b) => a - b);

    for (const tens of ownerBlocks) {
      const used = blocks[tens] ?? [];
      for (let ones = 2; ones <= 9; ones++) {
        if (!used.includes(ones)) {
          return `${base}${tierDigit}${tens}${ones}`;
        }
      }
    }
    // No block with space — create new owner block first (shouldn't normally happen)
    let tens = 0;
    while (blocks[tens]?.includes(1)) tens++;
    return `${base}${tierDigit}${tens}2`;
  }
}
