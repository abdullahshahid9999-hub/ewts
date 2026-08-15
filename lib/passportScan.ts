import { createWorker } from "tesseract.js";
import { parse as parseMRZ } from "mrz";

// ISO 3166-1 alpha-3 → nationality label
const NAT: Record<string, string> = {
  PAK:"Pakistani",IND:"Indian",BGD:"Bangladeshi",AFG:"Afghan",GBR:"British",USA:"American",
  CAN:"Canadian",AUS:"Australian",ARE:"Emirati",SAU:"Saudi Arabian",CHN:"Chinese",DEU:"German",
  FRA:"French",TUR:"Turkish",MYS:"Malaysian",IDN:"Indonesian",THA:"Thai",PHL:"Filipino",
  NPL:"Nepali",LKA:"Sri Lankan",EGY:"Egyptian",QAT:"Qatari",KWT:"Kuwaiti",OMN:"Omani",
  BHR:"Bahraini",NZL:"New Zealander",ZAF:"South African",JPN:"Japanese",KOR:"Korean",EOL:"Eolian",
};

export type PassportScanResult = {
  ok: boolean; warning: string | null;
  fullName?: string; passportNumber?: string; nationality?: string; passportExpiry?: string; dob?: string;
};

// Preprocess image: crop bottom third (MRZ zone), increase contrast
async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Take full width, bottom 30% where MRZ always lives
      const cropH = Math.floor(img.height * 0.35);
      const cropY = img.height - cropH;
      canvas.width = img.width;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d")!;
      // Draw cropped region
      ctx.drawImage(img, 0, cropY, img.width, cropH, 0, 0, img.width, cropH);
      // Apply grayscale + contrast boost via ImageData
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const gray = 0.299 * data.data[i] + 0.587 * data.data[i+1] + 0.114 * data.data[i+2];
        // Increase contrast: push values toward extremes
        const c = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
        data.data[i] = data.data[i+1] = data.data[i+2] = c;
      }
      ctx.putImageData(data, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("blob")), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load")); };
    img.src = url;
  });
}

function findMRZ(text: string): [string, string] | null {
  const lines = text.split(/\n/)
    .map(l => l.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9<]/g, "<"))
    .filter(l => l.length >= 30);

  // Strict: P< line followed by digit-heavy line
  for (let i = 0; i < lines.length - 1; i++) {
    const l1 = lines[i], l2 = lines[i + 1];
    if (/^P[<A-Z]/.test(l1) && l1.length >= 40 && /^[A-Z0-9]/.test(l2) && l2.length >= 40) {
      return [l1.padEnd(44, "<").slice(0, 44), l2.padEnd(44, "<").slice(0, 44)];
    }
  }
  // Loose: any two adjacent lines with >80% MRZ chars
  const mrzLike = lines.filter(l => (l.match(/[A-Z0-9<]/g) || []).length / l.length > 0.8);
  if (mrzLike.length >= 2) return [mrzLike[0].padEnd(44,"<").slice(0,44), mrzLike[1].padEnd(44,"<").slice(0,44)];
  return null;
}

function mrzDate(yymmdd: string): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = parseInt(yymmdd.slice(0,2),10), mm = yymmdd.slice(2,4), dd = yymmdd.slice(4,6);
  const yyyy = yy < (new Date().getFullYear()%100)+30 ? 2000+yy : 1900+yy;
  return `${yyyy}-${mm}-${dd}`;
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: true, warning: "PDF saved — please fill in passport details manually below." };
  }

  let text = "";
  try {
    // First pass: full image
    const worker = await createWorker("eng");
    await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<" });
    const { data: d1 } = await worker.recognize(file);
    text = d1.text;

    // Second pass: preprocessed MRZ crop (browser only)
    if (typeof document !== "undefined") {
      try {
        const cropped = await preprocessImage(file);
        const { data: d2 } = await worker.recognize(cropped);
        text = text + "\n" + d2.text; // combine both passes
      } catch { /* canvas unavailable, use full image only */ }
    }
    await worker.terminate();
  } catch {
    return { ok: false, warning: "Could not read image. Please ensure the photo is clear and well-lit." };
  }

  const mrzLines = findMRZ(text);
  if (!mrzLines) {
    return { ok: false, warning: "Could not find machine-readable lines. Upload a flat, uncropped photo of the passport's photo page (both MRZ lines must be visible)." };
  }

  try {
    const result = parseMRZ(mrzLines);
    const f = result.fields;
    const fullName = [`${(f.firstName??"").replace(/</g," ").trim()}`, `${(f.lastName??"").replace(/</g," ").trim()}`].filter(Boolean).join(" ") || undefined;
    return {
      ok: true,
      warning: result.valid ? "✨ Auto-filled from passport — please double-check!" : "Partially read — please verify fields.",
      fullName,
      passportNumber: f.documentNumber?.replace(/</g,"") || undefined,
      nationality: f.nationality ? (NAT[f.nationality] ?? f.nationality) : undefined,
      passportExpiry: f.expirationDate ? mrzDate(f.expirationDate) ?? undefined : undefined,
      dob: f.birthDate ? mrzDate(f.birthDate) ?? undefined : undefined,
    };
  } catch {
    return { ok: false, warning: "Passport found but could not parse. Please fill in fields manually." };
  }
}
