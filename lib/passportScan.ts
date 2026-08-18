// Passport OCR — calls server-side /api/ocr-passport (ocr.space free API + MRZ parse)
export type PassportScanResult = {
  ok: boolean; warning: string | null;
  surname?: string; givenName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; passportIssueDate?: string; dob?: string; gender?: string; issuingCountry?: string;
};

export async function scanPassport(file: File): Promise<PassportScanResult> {
  if (file.type === "application/pdf") {
    return { ok: true, warning: "PDF uploaded — please fill passport details manually." };
  }
  try {
    const fd = new FormData();
    fd.append("passport", file);
    const res = await fetch("/api/ocr-passport", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({})) as Record<string, string>;
    if (!res.ok) {
      return { ok: false, warning: d.error || "OCR failed. Please fill in details manually." };
    }
    return {
      ok: true,
      warning: null,
      surname:        d.surname,
      givenName:      d.givenName,
      passportNumber: d.passportNo,
      nationality:    d.nationality,
      issuingCountry: d.issuingCountry,
      passportExpiry: d.dateOfExpiry,
      passportIssueDate: d.dateOfIssue,
      dob:            d.dateOfBirth,
      gender:         d.gender,
    };
  } catch {
    return { ok: false, warning: "Could not read passport. Please fill in details manually." };
  }
}
