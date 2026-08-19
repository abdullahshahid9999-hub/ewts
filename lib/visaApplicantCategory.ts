export const APPLICANT_CATEGORIES = [
  { value: "job_holder", label: "Job Holder (Salaried)" },
  { value: "business_owner", label: "Business Owner / Businessman" },
  { value: "self_employed", label: "Self Employed / Freelancer" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Student" },
  { value: "housewife", label: "Housewife" },
  { value: "other", label: "Other" },
];

export type RequiredDocLike = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  applicantCategory?: string | null;
  nationality?: string | null;
};

// A document applies if its category/nationality is unset (universal) OR
// matches what this specific applicant selected. Both conditions must
// pass — a document scoped to BOTH "business_owner" AND "UAE" only shows
// for business owners who are also UAE nationals, not just either one.
export function docAppliesTo(doc: RequiredDocLike, category: string, nationality: string): boolean {
  const categoryOk = !doc.applicantCategory || doc.applicantCategory === category;
  const nationalityOk = !doc.nationality || doc.nationality.trim().toLowerCase() === nationality.trim().toLowerCase();
  return categoryOk && nationalityOk;
}

export function filterDocsForApplicant<T extends RequiredDocLike>(docs: T[], category: string, nationality: string): T[] {
  if (!category && !nationality) return docs; // nothing selected yet — show everything so nothing looks "missing"
  return docs.filter((d) => docAppliesTo(d, category, nationality));
}

// Passport must have at least 6 months' validity for most destinations —
// a soft warning (not a hard block, since some countries need less), so
// the applicant isn't blindsided by an embassy rejection.
export function passportExpiryWarning(expiryDate: string): string | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (expiry < new Date()) return "This passport has already expired.";
  if (expiry < sixMonthsFromNow) return "Most countries require at least 6 months' passport validity — this may cause delays or rejection.";
  return null;
}
