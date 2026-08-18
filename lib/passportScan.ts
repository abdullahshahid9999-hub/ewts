"use client";
// Passport OCR — Tesseract.js v5 client-side, MRZ parse via regex

export type PassportScanResult = {
  ok: boolean; warning: string | null;
  surname?: string; givenName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; passportIssueDate?: string; dob?: string; gender?: string; issuingCountry?: string;
};

function parseMRZ(raw: string): Partial<PassportScanResult> | null {
  // Normalize: uppercase, collapse spaces within lines, split by newline
  const lines = raw
    .toUpperCase()
    .split("\n")
    .map(l => l.replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, ""))
    .filter(l => l.length >= 30);

  // Find line 1: must start with P< (passport) and be ~44 chars
  // Find line 2: must start with alphanumeric passport number
  let l1 = "";
  let l2 = "";

  for (const line of lines) {
    if (!l1 && /^P[A-Z<]/.test(line) && line.length >= 40) {
      l1 = line.slice(0, 44).padEnd(44, "<");
    } else if (l1 && !l2 && line.length >= 40 && /^[A-Z0-9]{1,9}/.test(line)) {
      l2 = line.slice(0, 44).padEnd(44, "<");
      break;
    }
  }

  // Fallback: last two long lines
  if (!l1 || !l2) {
    const long = lines.filter(l => l.length >= 40);
    if (long.length >= 2) {
      l1 = long[long.length - 2].slice(0, 44).padEnd(44, "<");
      l2 = long[long.length - 1].slice(0, 44).padEnd(44, "<");
    }
  }

  if (!l1 || !l2) return null;

  // --- Parse Line 1: P<CCC SURNAME<<GIVENNAME ---
  const issuingCountry = l1.slice(2, 5).replace(/</g, "");
  const namePart = l1.slice(5);
  const sepIdx = namePart.indexOf("<<");
  const surname  = sepIdx >= 0 ? namePart.slice(0, sepIdx).replace(/</g, " ").trim() : "";
  const givenName = sepIdx >= 0 ? namePart.slice(sepIdx + 2).replace(/</g, " ").trim() : "";

  // --- Parse Line 2 (fix O→0 in numeric fields) ---
  const fixNum = (s: string) => s.replace(/O/g, "0").replace(/[^0-9]/g, "0");

  const passportNumber = l2.slice(0, 9).replace(/</g, "");
  const nationality    = l2.slice(10, 13).replace(/</g, "");
  const dobRaw         = fixNum(l2.slice(13, 19));
  const gender         = l2.slice(20, 21);
  const expiryRaw      = fixNum(l2.slice(21, 27));

  const yymmdd = (s: string, isBirth: boolean): string | undefined => {
    if (!/^\d{6}$/.test(s)) return undefined;
    const yy = parseInt(s.slice(0, 2));
    const mm = s.slice(2, 4);
    const dd = s.slice(4, 6);
    const yyyy = isBirth
      ? (yy > 24 ? 1900 + yy : 2000 + yy)
      : (yy <= 35 ? 2000 + yy : 1900 + yy);
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    surname:        surname || undefined,
    givenName:      givenName || undefined,
    passportNumber: passportNumber || undefined,
    nationality:    nationality || undefined,
    issuingCountry: issuingCountry || undefined,
    dob:            yymmdd(dobRaw, true),
    passportExpiry: yymmdd(expiryRaw, false),
    gender:         (gender === "M" || gender === "F") ? gender : undefined,
  };
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (file.type === "application/pdf") {
    return { ok: true, warning: "PDF uploaded — please fill passport details manually." };
  }

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");

    await (worker as any).setParameters({
      tessedit_pageseg_mode: "6",
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
    });

    const url = URL.createObjectURL(file);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    await worker.terminate();

    const mrz = parseMRZ(data.text);

    if (!mrz || !mrz.passportNumber) {
      return { ok: false, warning: "Could not read passport MRZ. Please fill details manually." };
    }

    return { ok: true, warning: null, ...mrz };
  } catch (e) {
    console.error("Tesseract OCR error:", e);
    return { ok: false, warning: "OCR failed. Please fill in details manually." };
  }
}
