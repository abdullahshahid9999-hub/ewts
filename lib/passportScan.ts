import { createWorker } from "tesseract.js";
import { parse as parseMRZ } from "mrz";

const NATIONALITY_CODES: Record<string, string> = {
  PAK: "Pakistani", IND: "Indian", BGD: "Bangladeshi", AFG: "Afghan", GBR: "British",
  USA: "American", CAN: "Canadian", AUS: "Australian", ARE: "Emirati", SAU: "Saudi",
  CHN: "Chinese", DEU: "German", FRA: "French", TUR: "Turkish", MYS: "Malaysian",
  IDN: "Indonesian", THA: "Thai", PHL: "Filipino", NPL: "Nepali", LKA: "Sri Lankan",
  EGY: "Egyptian", QAT: "Qatari", KWT: "Kuwaiti", OMN: "Omani", BHR: "Bahraini",
  EOL: "Eolian", NZL: "New Zealander", ZAF: "South African", JPN: "Japanese", KOR: "Korean",
};

export type PassportScanResult = {
  ok: boolean;
  warning: string | null;
  fullName?: string;
  passportNumber?: string;
  nationality?: string;
  passportExpiry?: string;
};

// Aggressively clean and find MRZ lines — OCR output is noisy.
// MRZ line 1: starts with P< or P followed by country code (3 alpha)
// MRZ line 2: starts with passport number digits/letters
function findMRZLines(text: string): [string, string] | null {
  // Normalise: strip spaces within lines, fix common OCR swaps in MRZ context
  const lines = text
    .split(/\n/)
    .map(l =>
      l
        .replace(/\s/g, "")
        .toUpperCase()
        // Common OCR errors in MRZ: 0→O and vice versa handled by mrz lib,
        // but clean obvious non-MRZ chars first
        .replace(/[^A-Z0-9<]/g, "<")
    )
    .filter(l => l.length >= 30); // at least 30 chars to consider

  // Try exact TD3 match (44 chars, two lines)
  for (let i = 0; i < lines.length - 1; i++) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    // Line 1 must look like P<COUNTRYNAME<<...
    if (/^P[<A-Z]/.test(l1) && l1.length >= 40 && /^[A-Z0-9]/.test(l2) && l2.length >= 40) {
      return [l1.padEnd(44, "<").slice(0, 44), l2.padEnd(44, "<").slice(0, 44)];
    }
  }

  // Looser: find any two adjacent lines with mostly MRZ chars (>80% A-Z0-9<)
  const mrzLike = lines.filter(l => {
    const mrzChars = (l.match(/[A-Z0-9<]/g) || []).length;
    return l.length >= 30 && mrzChars / l.length > 0.8;
  });

  if (mrzLike.length >= 2) {
    // Find pair with highest combined MRZ-char ratio
    for (let i = 0; i < mrzLike.length - 1; i++) {
      return [mrzLike[i].padEnd(44, "<").slice(0, 44), mrzLike[i + 1].padEnd(44, "<").slice(0, 44)];
    }
  }

  return null;
}

function mrzDateToISO(yymmdd: string): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  const yyyy = yy < currentYY + 30 ? 2000 + yy : 1900 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: true, warning: "Auto-read only works on photos (JPG/PNG). Your PDF was saved — please fill in passport details manually below." };
  }

  let text = "";
  try {
    // Use multiple PSM modes and pick the best MRZ result
    const worker = await createWorker("eng");
    // PSM 6 = uniform block of text (good for whole page)
    await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<" });
    const { data } = await worker.recognize(file);
    text = data.text;
    await worker.terminate();
  } catch {
    return { ok: false, warning: "Could not read this image. Please ensure the photo is well-lit and the full passport page is visible." };
  }

  const mrzLines = findMRZLines(text);
  if (!mrzLines) {
    return {
      ok: false,
      warning: "Could not find the machine-readable lines at the bottom of the passport page. Please upload a clear, uncropped photo showing both MRZ lines fully.",
    };
  }

  try {
    const result = parseMRZ(mrzLines);
    const f = result.fields;

    // Even if !result.valid, try to extract what we can
    const lastName = (f.lastName ?? "").replace(/</g, " ").trim();
    const firstName = (f.firstName ?? "").replace(/</g, " ").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
    const expiry = f.expirationDate ? mrzDateToISO(f.expirationDate) : null;
    const natCode = f.nationality ?? "";
    const nationality = natCode ? (NATIONALITY_CODES[natCode] ?? natCode) : undefined;
    const passportNumber = f.documentNumber?.replace(/</g, "") || undefined;

    if (!fullName && !passportNumber && !expiry) {
      return { ok: false, warning: "Passport detected but details unclear. Please upload a sharper, flat photo of the photo page." };
    }

    return {
      ok: true,
      warning: result.valid
        ? "✨ Auto-filled from passport — please double-check!"
        : "Partially read — please verify the fields below.",
      fullName,
      passportNumber,
      nationality,
      passportExpiry: expiry || undefined,
    };
  } catch {
    return { ok: false, warning: "Passport found but couldn't parse details reliably. Please fill in the fields manually." };
  }
}
