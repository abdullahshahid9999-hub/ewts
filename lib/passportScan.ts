import { createWorker } from "tesseract.js";
import { parse as parseMRZ } from "mrz";

const NAT: Record<string, string> = {
  PAK:"Pakistani",IND:"Indian",BGD:"Bangladeshi",AFG:"Afghan",GBR:"British",USA:"American",
  CAN:"Canadian",AUS:"Australian",ARE:"Emirati",SAU:"Saudi Arabian",CHN:"Chinese",DEU:"German",
  FRA:"French",TUR:"Turkish",MYS:"Malaysian",IDN:"Indonesian",THA:"Thai",PHL:"Filipino",
  NPL:"Nepali",LKA:"Sri Lankan",EGY:"Egyptian",QAT:"Qatari",KWT:"Kuwaiti",OMN:"Omani",
  BHR:"Bahraini",NZL:"New Zealander",ZAF:"South African",JPN:"Japanese",KOR:"Korean",EOL:"Eolian",
};

export type PassportScanResult = {
  ok: boolean; warning: string | null;
  fullName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; dob?: string;
};

function findMRZ(text: string): [string, string] | null {
  const lines = text.split(/\n/)
    .map(l => l.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9<]/g, "<"))
    .filter(l => l.length >= 30);
  for (let i = 0; i < lines.length - 1; i++) {
    const l1 = lines[i], l2 = lines[i + 1];
    if (/^P[<A-Z]/.test(l1) && l1.length >= 40 && /^[A-Z0-9]/.test(l2) && l2.length >= 40)
      return [l1.padEnd(44,"<").slice(0,44), l2.padEnd(44,"<").slice(0,44)];
  }
  const mrzLike = lines.filter(l => (l.match(/[A-Z0-9<]/g)||[]).length / l.length > 0.75 && l.length >= 30);
  if (mrzLike.length >= 2) return [mrzLike[0].padEnd(44,"<").slice(0,44), mrzLike[1].padEnd(44,"<").slice(0,44)];
  return null;
}

function mrzDate(yymmdd: string): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = parseInt(yymmdd.slice(0,2),10), mm = yymmdd.slice(2,4), dd = yymmdd.slice(4,6);
  const yyyy = yy < (new Date().getFullYear()%100)+30 ? 2000+yy : 1900+yy;
  return `${yyyy}-${mm}-${dd}`;
}

// Rotate canvas by degrees (0,90,180,270) and crop bottom 40% for MRZ
async function getRotatedBlob(file: File, deg: number, cropBottom: boolean): Promise<Blob> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const sw = img.width, sh = img.height;
      const rad = (deg * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
      const rw = Math.round(sw * cos + sh * sin);
      const rh = Math.round(sw * sin + sh * cos);
      const canvas = document.createElement("canvas");
      // For MRZ crop: bottom 40% after rotation
      const cropH = cropBottom ? Math.floor(rh * 0.4) : rh;
      const cropY = cropBottom ? rh - cropH : 0;
      canvas.width = rw; canvas.height = cropH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, rw, cropH);
      ctx.save();
      ctx.translate(rw/2, rh/2);
      ctx.rotate(rad);
      ctx.drawImage(img, -sw/2, -sh/2);
      ctx.restore();
      // Shift canvas to show only bottom crop
      if (cropBottom) {
        const full = document.createElement("canvas");
        full.width = rw; full.height = rh;
        const fctx = full.getContext("2d")!;
        fctx.fillStyle = "#fff"; fctx.fillRect(0,0,rw,rh);
        fctx.save(); fctx.translate(rw/2, rh/2); fctx.rotate(rad);
        fctx.drawImage(img, -sw/2, -sh/2); fctx.restore();
        canvas.width = rw; canvas.height = cropH;
        ctx.drawImage(full, 0, cropY, rw, cropH, 0, 0, rw, cropH);
      }
      // Contrast boost
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const g = 0.299*data.data[i] + 0.587*data.data[i+1] + 0.114*data.data[i+2];
        const c = Math.min(255, Math.max(0, (g-128)*1.8+128));
        data.data[i] = data.data[i+1] = data.data[i+2] = c;
      }
      ctx.putImageData(data, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? res(b) : rej(new Error("blob")), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("load")); };
    img.src = url;
  });
}

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: true, warning: "PDF saved — please fill in passport details manually." };
  }
  const worker = await createWorker("eng");
  await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<" });

  let mrzLines: [string, string] | null = null;
  const rotations = [0, 90, 270, 180];

  for (const deg of rotations) {
    if (mrzLines) break;
    // Try full image first, then cropped bottom
    for (const crop of [false, true]) {
      try {
        const blob = typeof document !== "undefined"
          ? await getRotatedBlob(file, deg, crop)
          : file;
        const { data } = await worker.recognize(blob);
        mrzLines = findMRZ(data.text);
        if (mrzLines) break;
      } catch { /* try next rotation */ }
    }
  }

  await worker.terminate();

  if (!mrzLines) {
    return { ok: false, warning: "Could not read passport. Upload a flat, well-lit photo of the photo page. Ensure the MRZ lines (two rows of text at the bottom) are fully visible." };
  }

  try {
    const result = parseMRZ(mrzLines);
    const f = result.fields;
    const firstName = (f.firstName??"").replace(/</g," ").trim();
    const lastName = (f.lastName??"").replace(/</g," ").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || undefined;
    return {
      ok: true,
      warning: result.valid ? "✨ Auto-filled — please double-check!" : "Partially read — please verify the fields.",
      fullName,
      passportNumber: f.documentNumber?.replace(/</g,"") || undefined,
      nationality: f.nationality ? (NAT[f.nationality] ?? f.nationality) : undefined,
      passportExpiry: f.expirationDate ? mrzDate(f.expirationDate) ?? undefined : undefined,
      dob: f.birthDate ? mrzDate(f.birthDate) ?? undefined : undefined,
    };
  } catch {
    return { ok: false, warning: "Could not parse passport. Please fill in details manually." };
  }
}
