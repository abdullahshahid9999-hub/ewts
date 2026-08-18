// Passport scanning via Claude Vision API (server-side)
export type PassportScanResult = {
  ok: boolean; warning: string | null;
  surname?: string; givenName?: string; passportNumber?: string; nationality?: string;
  passportExpiry?: string; passportIssueDate?: string; dob?: string; gender?: string; issuingCountry?: string;
};

export async function scanPassport(file: File): Promise<PassportScanResult> {
  try {
    const fd = new FormData();
    fd.append("passport", file);
    const res = await fetch("/api/ocr-passport", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, warning: err.error || "OCR failed. Please fill in details manually." };
    }
    const d = await res.json();
    // API returns: givenName, surname, passportNo, dateOfBirth, dateOfIssue, dateOfExpiry, gender, nationality, issuingCountry
    return {
      ok: true,
      warning: null,
      surname: d.surname || undefined,
      givenName: d.givenName || undefined,
      passportNumber: d.passportNo || undefined,
      nationality: d.nationality || undefined,
      passportExpiry: d.dateOfExpiry || undefined,
      passportIssueDate: d.dateOfIssue || undefined,
      dob: d.dateOfBirth || undefined,
      gender: d.gender || undefined,
      issuingCountry: d.issuingCountry || undefined,
    };
  } catch {
    return { ok: false, warning: "Could not read passport. Please fill in details manually." };
  }
}
