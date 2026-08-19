import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// 3-letter ISO → full country name
const ISO3: Record<string, string> = {
  PAK: "Pakistan", USA: "United States", GBR: "United Kingdom", ARE: "United Arab Emirates",
  SAU: "Saudi Arabia", CHN: "China", IND: "India", TUR: "Turkey", MYS: "Malaysia",
  SGP: "Singapore", THA: "Thailand", AUS: "Australia", CAN: "Canada", DEU: "Germany",
  FRA: "France", ITA: "Italy", ESP: "Spain", JPN: "Japan", KOR: "South Korea",
  EGY: "Egypt", IRN: "Iran", IRQ: "Iraq", AFG: "Afghanistan", BGD: "Bangladesh",
};

// Fallback: extract passport fields directly from OCR text when MRZ is unreadable
// Works for Pakistani bio-page style passports where fields are printed clearly
function parseFromText(raw: string): Record<string, string | undefined> | null {
  const text = raw.toUpperCase();
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

  // Passport number: e.g. "KH1000125" or "AA1234567" — 2 letters + 7 digits
  const passportNoMatch = text.match(/\b([A-Z]{2}\d{7})\b/);
  const passportNo = passportNoMatch?.[1];

  // Surname and given name — look for lines after "SURNAME" or "NOM"
  let surname = "", givenName = "";
  for (let i = 0; i < lines.length; i++) {
    if (/surname|nom\/surname/i.test(lines[i]) && lines[i+1]) {
      surname = lines[i+1].replace(/[^A-Za-z ]/g, "").trim();
    }
    if (/given.?name|pr.?nom/i.test(lines[i]) && lines[i+1]) {
      givenName = lines[i+1].replace(/[^A-Za-z ]/g, "").trim();
    }
  }
  // Fallback: try MRZ-like line at bottom
  if (!surname || !givenName) {
    const mrzLike = lines.find(l => /^P<[A-Z]{3}/.test(l.replace(/\s/g,"")));
    if (mrzLike) {
      const clean = mrzLike.replace(/\s/g,"").slice(5);
      const sep = clean.indexOf("<<");
      if (sep >= 0) {
        surname = clean.slice(0, sep).replace(/</g, " ").trim();
        givenName = clean.slice(sep + 2).replace(/</g, " ").trim();
      }
    }
  }

  // Dates: DD MMM YYYY or DD/MM/YYYY or YYYY-MM-DD
  const months: Record<string,string> = {
    JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",
    JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12"
  };
  const dateRe = /(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/gi;
  const allDates: string[] = [];
  let dm: RegExpExecArray | null;
  while ((dm = dateRe.exec(raw)) !== null) {
    const dd = dm[1].padStart(2,"0");
    const mm = months[dm[2].toUpperCase()];
    allDates.push(`${dm[3]}-${mm}-${dd}`);
  }
  allDates.sort();
  // earliest = DOB (usually), middle = issue, latest = expiry
  const dob = allDates[0];
  const dateOfIssue = allDates.length >= 2 ? allDates[1] : undefined;
  const dateOfExpiry = allDates.length >= 3 ? allDates[allDates.length - 1] : undefined;

  // Nationality
  const natMatch = text.match(/nationality[:\s]+([A-Z]+)/i);
  const nationality = natMatch ? (ISO3[natMatch[1]] || natMatch[1]) : "Pakistan";

  if (!passportNo) return null;
  return { passportNo, surname, givenName, nationality, issuingCountry: "Pakistan", dateOfBirth: dob, dateOfIssue, dateOfExpiry, gender: undefined };
}

function parseMRZ(raw: string): Record<string, string | undefined> | null {
  const lines = raw.toUpperCase().split("\n")
    .map(l => l.replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, ""))
    .filter(l => l.length >= 30);

  let l1 = "", l2 = "";
  for (const line of lines) {
    if (!l1 && /^P[A-Z<]/.test(line) && line.length >= 40) {
      l1 = line.slice(0, 44).padEnd(44, "<");
    } else if (l1 && !l2 && line.length >= 40) {
      l2 = line.slice(0, 44).padEnd(44, "<");
      break;
    }
  }
  if (!l1 || !l2) {
    const long = lines.filter(l => l.length >= 40);
    if (long.length >= 2) {
      l1 = long[long.length - 2].slice(0, 44).padEnd(44, "<");
      l2 = long[long.length - 1].slice(0, 44).padEnd(44, "<");
    }
  }
  if (!l1 || !l2) return null;

  const iso3 = l1.slice(2, 5).replace(/</g, "");
  const namePart = l1.slice(5);
  const sepIdx = namePart.indexOf("<<");
  const surname   = sepIdx >= 0 ? namePart.slice(0, sepIdx).replace(/</g, " ").trim() : "";
  const givenName = sepIdx >= 0 ? namePart.slice(sepIdx + 2).replace(/</g, " ").trim() : "";

  const fixNum = (s: string) => s.replace(/O/g, "0").replace(/[^0-9]/g, "0");
  const passportNo  = l2.slice(0, 9).replace(/</g, "");
  const natIso      = l2.slice(10, 13).replace(/</g, "");
  const dobRaw      = fixNum(l2.slice(13, 19));
  const gender      = l2.slice(20, 21);
  const expiryRaw   = fixNum(l2.slice(21, 27));

  const yymmdd = (s: string, isBirth: boolean): string | undefined => {
    if (!/^\d{6}$/.test(s)) return undefined;
    const yy = parseInt(s.slice(0, 2)), mm = s.slice(2, 4), dd = s.slice(4, 6);
    const yyyy = isBirth ? (yy > 24 ? 1900 + yy : 2000 + yy) : (yy <= 35 ? 2000 + yy : 1900 + yy);
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    surname,
    givenName,
    passportNo,
    nationality:    ISO3[natIso] || natIso,   // "Pakistan" not "PAK"
    issuingCountry: ISO3[iso3] || iso3,        // "Pakistan" not "PAK"
    dateOfBirth:    yymmdd(dobRaw, true),
    dateOfExpiry:   yymmdd(expiryRaw, false),
    gender:         (gender === "M" || gender === "F") ? gender : undefined,
  };
}

// Extract issue date from raw OCR text (not in MRZ — must read from page)
// Looks for patterns like "06 SEP 2024" or "2024-09-06" near "issue" keyword
function extractIssueDate(raw: string): string | undefined {
  const text = raw.toUpperCase();
  const months: Record<string, string> = {
    JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",
    JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12"
  };

  // Pattern: "06 SEP 2024" or "06-SEP-2024"
  const re = /(\d{1,2})\s*[-\/]?\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*[-\/]?\s*(20\d{2})/g;
  const found: string[] = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const dd = m[1].padStart(2, "0");
    const mm2 = months[m[2]];
    const yyyy = m[3];
    found.push(`${yyyy}-${mm2}-${dd}`);
  }

  // Issue date is usually the earlier date on the page (expiry is later)
  if (found.length >= 2) {
    found.sort();
    return found[0]; // earliest = issue date
  }
  if (found.length === 1) return found[0];
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("passport") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = (file.type || "image/jpeg").toLowerCase();
    if (mimeType === "image/jpg") mimeType = "image/jpeg";
    if (!IMAGE_MIMES.has(mimeType) && mimeType !== "application/pdf") mimeType = "image/jpeg";

    const ocrKey = process.env.OCR_SPACE_API_KEY || "helloworld";
    const ocrForm = new FormData();
    ocrForm.append("apikey", ocrKey);
    ocrForm.append("language", "eng");
    ocrForm.append("isOverlayRequired", "false");
    ocrForm.append("detectOrientation", "true");
    ocrForm.append("scale", "true");
    ocrForm.append("OCREngine", "2");
    ocrForm.append("base64Image", `data:${mimeType};base64,${buffer.toString("base64")}`);

    const ocrRes = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: ocrForm });
    if (!ocrRes.ok) return NextResponse.json({ error: "OCR service unavailable." }, { status: 502 });

    const ocrData = await ocrRes.json() as {
      ParsedResults?: Array<{ ParsedText: string }>;
      IsErroredOnProcessing?: boolean;
    };

    if (ocrData.IsErroredOnProcessing || !ocrData.ParsedResults?.length) {
      return NextResponse.json({ error: "OCR failed. Please fill manually." }, { status: 422 });
    }

    const rawText = ocrData.ParsedResults[0].ParsedText;
    const parsed = parseMRZ(rawText);

    // If MRZ failed, try to extract from OCR text directly (works for clear bio-page scans)
    if (!parsed || !parsed.passportNo) {
      const textParsed = parseFromText(rawText);
      if (textParsed && textParsed.passportNo) {
        return NextResponse.json({ ...textParsed, passportImageUrl: null });
      }
      return NextResponse.json({ error: "Could not read passport MRZ. Please fill manually." }, { status: 422 });
    }

    // Extract issue date from full OCR text
    parsed.dateOfIssue = extractIssueDate(rawText);

    // R2 upload — non-fatal
    let passportImageUrl: string | null = null;
    try {
      passportImageUrl = await uploadToR2({ buffer, contentType: IMAGE_MIMES.has(mimeType) ? mimeType : "image/jpeg", folder: "visas" });
    } catch (e) { console.error("R2 upload non-fatal:", e); }

    return NextResponse.json({ ...parsed, passportImageUrl });
  } catch (e: unknown) {
    console.error("OCR error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "OCR failed. Please fill manually." }, { status: 500 });
  }
}
