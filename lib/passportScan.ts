// Passport OCR — Tesseract.js (free, client-side, no API key)
// Strategy: scan full image, extract MRZ lines, parse with regex

export type PassportScanResult = {
  ok: boolean; warning: string | null;
  surname?: string; givenName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; passportIssueDate?: string; dob?: string; gender?: string; issuingCountry?: string;
};

// Parse ICAO 9303 MRZ — works for TD3 (standard passport, 2 lines of 44 chars)
function parseMRZ(lines: string[]): Partial<PassportScanResult> | null {
  // Find two consecutive lines that look like MRZ (44 chars, only A-Z 0-9 <)
  const mrzRe = /^[A-Z0-9<]{44}$/;
  const clean = lines.map((l: string) => l.replace(/\s/g, "").toUpperCase());
  let l1 = "", l2 = "";
  for (let i = 0; i < clean.length - 1; i++) {
    if (mrzRe.test(clean[i]) && mrzRe.test(clean[i + 1])) {
      l1 = clean[i]; l2 = clean[i + 1]; break;
    }
  }
  if (!l1 || !l2) return null;

  // Line 1: P<ISOSURNAME<<GIVENNAMES<<<...
  const issuingCountry = l1.slice(2, 5).replace(/</g, "");
  const namePart = l1.slice(5);
  const nameSplit = namePart.split("<<");
  const surname = (nameSplit[0] || "").replace(/</g, " ").trim();
  const givenName = (nameSplit.slice(1).join(" ") || "").replace(/</g, " ").trim();

  // Line 2: passportNo(9) + check + nationality(3) + dob(6) + check + sex + expiry(6) + check ...
  const passportNumber = l2.slice(0, 9).replace(/</g, "");
  const nationality = l2.slice(10, 13).replace(/</g, "");
  const dobRaw = l2.slice(13, 19);   // YYMMDD
  const gender = l2.slice(20, 21);
  const expiryRaw = l2.slice(21, 27); // YYMMDD

  const parseDate = (yymmdd: string, isBirth: boolean): string | undefined => {
    if (!/^\d{6}$/.test(yymmdd)) return undefined;
    const yy = parseInt(yymmdd.slice(0, 2));
    const mm = yymmdd.slice(2, 4);
    const dd = yymmdd.slice(4, 6);
    // Birth year: >30 → 1900s, ≤30 → 2000s
    const yyyy = isBirth ? (yy > 30 ? 1900 + yy : 2000 + yy) : (yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy);
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    surname: surname || undefined,
    givenName: givenName || undefined,
    passportNumber: passportNumber || undefined,
    nationality: nationality || undefined,
    dob: parseDate(dobRaw, true),
    passportExpiry: parseDate(expiryRaw, false),
    gender: gender === "M" || gender === "F" ? gender : undefined,
    issuingCountry: issuingCountry || undefined,
  };
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  try {
    // Tesseract works on images only — PDF: ask to fill manually
    if (file.type === "application/pdf") {
      return { ok: true, warning: "PDF uploaded — please fill passport details manually." };
    }

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      // Use CDN — no local files needed
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
      logger: () => {}, // silence logs
    });

    // Use SINGLE_BLOCK for MRZ — better than auto segmentation
    await worker.setParameters({ tessedit_pageseg_mode: "6" } as never);

    const url = URL.createObjectURL(file);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    await worker.terminate();

    const lines = data.text.split("\n").map(l => l.trim()).filter(Boolean);
    const mrz = parseMRZ(lines);

    if (!mrz || !mrz.passportNumber) {
      return { ok: false, warning: "Could not read passport. Please fill in details manually." };
    }

    return { ok: true, warning: null, ...mrz };
  } catch (e) {
    console.error("Tesseract OCR error:", e);
    return { ok: false, warning: "OCR failed. Please fill in details manually." };
  }
}
