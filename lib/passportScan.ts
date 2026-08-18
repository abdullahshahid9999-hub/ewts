"use client";
// Passport OCR — Tesseract.js v5 client-side, MRZ parse via regex
// Free, no API key, no server

export type PassportScanResult = {
  ok: boolean; warning: string | null;
  surname?: string; givenName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; passportIssueDate?: string; dob?: string; gender?: string; issuingCountry?: string;
};

function parseMRZ(raw: string): Partial<PassportScanResult> | null {
  // Clean OCR noise: O→0 in numeric positions handled per-field, strip spaces
  const lines = raw
    .split("\n")
    .map(l => l.replace(/\s+/g, "").toUpperCase())
    .filter(l => l.length >= 30); // MRZ lines are 44 chars but OCR sometimes cuts

  let l1 = "", l2 = "";

  // Find lines that are mostly MRZ characters (>80% A-Z0-9<)
  const mrzScore = (s: string) => {
    const m = s.match(/[A-Z0-9<]/g);
    return m ? m.length / s.length : 0;
  };

  const candidates = lines.filter(l => l.length >= 30 && mrzScore(l) > 0.8);

  // Try exact 44-char match first
  for (let i = 0; i < candidates.length - 1; i++) {
    if (candidates[i].length === 44 && candidates[i + 1].length === 44) {
      l1 = candidates[i]; l2 = candidates[i + 1]; break;
    }
  }

  // Fallback: pad/trim to 44
  if (!l1 && candidates.length >= 2) {
    l1 = candidates[candidates.length - 2].slice(0, 44).padEnd(44, "<");
    l2 = candidates[candidates.length - 1].slice(0, 44).padEnd(44, "<");
  }

  if (!l1 || !l2) return null;

  // Fix common OCR mistakes in MRZ: spaces, O vs 0
  const fixNums = (s: string) => s.replace(/O/g, "0").replace(/\s/g, "");

  // Line 1: P<CCC SURNAME<<GIVENNAMES...
  const issuingCountry = l1.slice(2, 5).replace(/</g, "");
  const namePart = l1.slice(5);
  const doubleBracket = namePart.indexOf("<<");
  const surname = doubleBracket >= 0
    ? namePart.slice(0, doubleBracket).replace(/</g, " ").trim()
    : namePart.replace(/</g, " ").trim();
  const givenName = doubleBracket >= 0
    ? namePart.slice(doubleBracket + 2).replace(/</g, " ").trim()
    : "";

  // Line 2 numeric fields — fix O→0
  const l2n = fixNums(l2);
  const passportNumber = l2n.slice(0, 9).replace(/</g, "");
  const nationality    = l2.slice(10, 13).replace(/</g, "");
  const dobRaw         = l2n.slice(13, 19);
  const gender         = l2.slice(20, 21);
  const expiryRaw      = l2n.slice(21, 27);

  const parseYYMMDD = (s: string, isBirth: boolean): string | undefined => {
    if (!/^\d{6}$/.test(s)) return undefined;
    const yy = parseInt(s.slice(0, 2));
    const mm = s.slice(2, 4);
    const dd = s.slice(4, 6);
    const yyyy = isBirth
      ? (yy > 24 ? 1900 + yy : 2000 + yy)   // born after 2024 unlikely
      : (yy <= 35 ? 2000 + yy : 1900 + yy);  // expiry before 2035 = 2000s
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    surname:        surname || undefined,
    givenName:      givenName || undefined,
    passportNumber: passportNumber || undefined,
    nationality:    nationality || undefined,
    issuingCountry: issuingCountry || undefined,
    dob:            parseYYMMDD(dobRaw, true),
    passportExpiry: parseYYMMDD(expiryRaw, false),
    gender:         (gender === "M" || gender === "F") ? gender : undefined,
  };
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (file.type === "application/pdf") {
    return { ok: true, warning: "PDF uploaded — please fill passport details manually." };
  }

  try {
    const Tesseract = await import("tesseract.js");
    const createWorker = Tesseract.createWorker;

    // v5 API: createWorker(lang) — no CDN path options needed, uses built-in defaults
    const worker = await createWorker("eng");

    // PSM 6 = uniform block of text — best for MRZ
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
      return {
        ok: false,
        warning: "Could not read passport MRZ. Please fill details manually.",
      };
    }

    return { ok: true, warning: null, ...mrz };
  } catch (e) {
    console.error("Tesseract OCR error:", e);
    return { ok: false, warning: "OCR failed. Please fill in details manually." };
  }
}
