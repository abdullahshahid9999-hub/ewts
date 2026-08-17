// Passport scanning via Claude Vision API (server-side) — replaces Tesseract.js client-side OCR
export type PassportScanResult = {
  ok: boolean; warning: string | null;
  fullName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; dob?: string;
};

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: true, warning: "PDF saved — please fill in passport details manually." };
  }
  try {
    const fd = new FormData();
    fd.append("passport", file);
    const res = await fetch("/api/ocr-passport", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, warning: err.error || "OCR failed. Please fill in details manually." };
    }
    const data = await res.json();
    return {
      ok: true,
      warning: data.warning || "✨ Auto-filled from passport — please double-check!",
      fullName: data.fullName,
      passportNumber: data.passportNumber,
      nationality: data.nationality,
      passportExpiry: data.passportExpiry,
      dob: data.dob,
    };
  } catch {
    return { ok: false, warning: "Could not read passport. Please fill in details manually." };
  }
}
