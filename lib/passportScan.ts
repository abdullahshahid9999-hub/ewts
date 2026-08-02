import { createWorker } from "tesseract.js";
import { parse as parseMRZ } from "mrz";

const NATIONALITY_CODES: Record<string, string> = {
  PAK: "Pakistani", IND: "Indian", BGD: "Bangladeshi", AFG: "Afghan", GBR: "British",
  USA: "American", CAN: "Canadian", AUS: "Australian", ARE: "Emirati", SAU: "Saudi",
  CHN: "Chinese", DEU: "German", FRA: "French", TUR: "Turkish", MYS: "Malaysian",
  IDN: "Indonesian", THA: "Thai", PHL: "Filipino", NPL: "Nepali", LKA: "Sri Lankan",
  EGY: "Egyptian", QAT: "Qatari", KWT: "Kuwaiti", OMN: "Omani", BHR: "Bahraini",
};

export type PassportScanResult = {
  ok: boolean;
  warning: string | null;
  fullName?: string;
  passportNumber?: string;
  nationality?: string;
  passportExpiry?: string; // yyyy-mm-dd, ready for <input type="date">
};

// TD3 (passport) MRZ: two 44-char lines, mostly A-Z0-9< — this pattern
// is what we search the raw OCR text for, since Tesseract will pick up
// surrounding noise (stamps, other page text) too.
function findMRZLines(text: string): [string, string] | null {
  const candidates = text
    .split("\n")
    .map((l) => l.replace(/\s/g, "").toUpperCase())
    .filter((l) => l.length >= 40 && /^[A-Z0-9<]+$/.test(l));
  for (let i = 0; i < candidates.length - 1; i++) {
    if (candidates[i].startsWith("P<") || candidates[i][0] === "P") {
      return [candidates[i].padEnd(44, "<").slice(0, 44), candidates[i + 1].padEnd(44, "<").slice(0, 44)];
    }
  }
  // Fallback: any two adjacent long lines, in case line 1 didn't start with P<
  if (candidates.length >= 2) {
    return [candidates[0].padEnd(44, "<").slice(0, 44), candidates[1].padEnd(44, "<").slice(0, 44)];
  }
  return null;
}

function mrzDateToISO(yymmdd: string): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  // Expiry dates are always in the future-ish range — if the 2-digit year
  // reads earlier than "now", it's actually next century.
  const yyyy = yy < currentYY + 30 ? 2000 + yy : 1900 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, warning: "Passport must be uploaded as a photo (JPG/PNG), not a PDF, for auto-read to work." };
  }

  let text = "";
  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(file);
    text = data.text;
    await worker.terminate();
  } catch {
    return { ok: false, warning: "Could not read this image. Please try a clearer, well-lit photo of the passport's photo page." };
  }

  const mrzLines = findMRZLines(text);
  if (!mrzLines) {
    return { ok: false, warning: "Couldn't find the passport's machine-readable zone (the two lines at the bottom of the photo page). Please upload a clearer, uncropped photo of that page." };
  }

  try {
    const result = parseMRZ(mrzLines);
    if (!result.valid && result.details.every((d) => !d.valid)) {
      return { ok: false, warning: "This looks like a passport scan, but the details didn't check out — please upload a sharper, flat (non-angled) photo." };
    }
    const f = result.fields;
    const fullName = [f.firstName, f.lastName].filter(Boolean).join(" ").replace(/</g, " ").trim();
    const expiry = f.expirationDate ? mrzDateToISO(f.expirationDate) : null;

    return {
      ok: true,
      warning: result.valid ? null : "Auto-read partially succeeded — please double-check the fields below before submitting.",
      fullName: fullName || undefined,
      passportNumber: f.documentNumber?.replace(/</g, "") || undefined,
      nationality: f.nationality ? (NATIONALITY_CODES[f.nationality] ?? f.nationality) : undefined,
      passportExpiry: expiry || undefined,
    };
  } catch {
    return { ok: false, warning: "Found something that looked like a passport, but couldn't parse it reliably. Please double-check the fields manually." };
  }
}
