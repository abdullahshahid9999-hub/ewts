"use client";

import { useState, useRef } from "react";
import { APPLICANT_CATEGORIES, filterDocsForApplicant, passportExpiryWarning } from "@/lib/visaApplicantCategory";
import { checkImageQuality } from "@/lib/imageQualityCheck";
import { scanPassport } from "@/lib/passportScan";
import { waLink } from "@/lib/whatsapp";

/* ─────────────────── Types ─────────────────── */
type RequiredDoc = { id: string; name: string; description: string | null; isRequired: boolean; icon?: string | null; applicantCategory?: string | null; nationality?: string | null };
type VisaInfo = { id: string; title: string; country: string; type: string; processingTime: string | null; priceAdult: number | null; priceChild: number | null; priceInfant: number | null; requiredDocuments: RequiredDoc[] };

type Traveller = {
  ageGroup: "adult" | "child" | "infant";
  surname: string;
  givenName: string;
  dob: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiry: string;
  nationality: string;
  issuingCountry: string;
  applicantCategory: string;
  files: Record<string, File>;
  docWarnings: Record<string, string | null>;
};

type ContactInfo = { name: string; email: string; phone: string };

function emptyTraveller(ageGroup: "adult" | "child" | "infant"): Traveller {
  return { ageGroup, surname: "", givenName: "", dob: "", passportNumber: "", passportIssueDate: "", passportExpiry: "", nationality: "Pakistani", issuingCountry: "Pakistan", applicantCategory: "", files: {}, docWarnings: {} };
}

function computeTotal(visa: VisaInfo, adults: number, children: number, infants: number) {
  return (visa.priceAdult ?? 0) * adults + (visa.priceChild ?? 0) * children + (visa.priceInfant ?? 0) * infants;
}

/* ─────────────────── Step indicator ─────────────────── */
function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${i === current ? "bg-[var(--lp-brass)] text-black" : i < current ? "bg-[var(--lp-ink)] text-white" : "bg-surface text-muted border border-border"}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i === current ? "bg-black/20" : i < current ? "bg-white/20" : "bg-border"}`}>
              {i < current ? "✓" : i + 1}
            </span>
            <span className="max-w-[80px] truncate">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-px w-3 flex-shrink-0 ${i < current ? "bg-[var(--lp-ink)]" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── Traveller form ─────────────────── */
function TravellerForm({ t, docs, onChange, label }: { t: Traveller; docs: RequiredDoc[]; onChange: (patch: Partial<Traveller>) => void; label: string }) {
  const [ocrBusy, setOcrBusy] = useState(false);
  const passportDocId = docs.find(d => /passport/i.test(d.name))?.id ?? "__passport__";

  async function handlePassportUpload(docId: string, file: File | null) {
    if (!file) return;
    const warnings = { ...t.docWarnings };
    const files = { ...t.files };
    const isPassportDoc = /passport/i.test(docs.find(d => d.id === docId)?.name ?? "");
    if (isPassportDoc) {
      warnings[docId] = "🔍 Reading passport…";
      onChange({ docWarnings: warnings });
      setOcrBusy(true);
      const scan = await scanPassport(file);
      setOcrBusy(false);
      if (!scan.ok) {
        warnings[docId] = `❌ ${scan.warning}`;
        onChange({ docWarnings: warnings });
        return;
      }
      files[docId] = file;
      const qw = await checkImageQuality(file);
      warnings[docId] = scan.warning ? `⚠️ ${scan.warning}` : qw ? `⚠️ ${qw}` : "✨ Auto-filled from passport — please double-check!";
      // Parse fullName into surname/givenName
      const nameParts = (scan.fullName ?? "").trim().split(/\s+/);
      const surname = nameParts[0] ?? "";
      const givenName = nameParts.slice(1).join(" ");
      onChange({
        files,
        docWarnings: warnings,
        surname: scan.fullName && !t.surname ? surname : t.surname,
        givenName: scan.fullName && !t.givenName ? givenName : t.givenName,
        passportNumber: scan.passportNumber || t.passportNumber,
        passportExpiry: scan.passportExpiry || t.passportExpiry,
        nationality: scan.nationality || t.nationality,
      });
    } else {
      files[docId] = file;
      const qw = await checkImageQuality(file);
      warnings[docId] = qw;
      onChange({ files, docWarnings: warnings });
    }
  }

  // Check if any docs are occupation-scoped — if so, occupation is required before showing docs
  const hasOccupationScopedDocs = docs.some(d => d.applicantCategory);
  const needsOccupation = hasOccupationScopedDocs && t.ageGroup === "adult" && !t.applicantCategory;
  const filteredDocs = needsOccupation ? [] : filterDocsForApplicant(docs, t.applicantCategory, t.nationality);
  const expiryWarn = passportExpiryWarning(t.passportExpiry);

  return (
    <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
      <h3 className="font-semibold text-base text-[var(--lp-ink)] flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.ageGroup === "adult" ? "bg-[var(--lp-ink)] text-white" : t.ageGroup === "child" ? "bg-amber-100 text-amber-800" : "bg-pink-100 text-pink-800"}`}>
          {t.ageGroup.charAt(0).toUpperCase() + t.ageGroup.slice(1)}
        </span>
        {label}
      </h3>

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Surname (Family Name) *" value={t.surname} onChange={v => onChange({ surname: v })} placeholder="As on passport" />
        <Field label="Given Name(s) *" value={t.givenName} onChange={v => onChange({ givenName: v })} placeholder="As on passport" />
      </div>

      {/* DOB + Nationality row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateField label="Date of Birth *" value={t.dob} onChange={v => onChange({ dob: v })} />
        <Field label="Nationality *" value={t.nationality} onChange={v => onChange({ nationality: v })} placeholder="e.g. Pakistani" />
      </div>

      {/* Passport details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Passport Number *" value={t.passportNumber} onChange={v => onChange({ passportNumber: v })} placeholder="AA1234567" />
        <DateField label="Date of Issue *" value={t.passportIssueDate} onChange={v => onChange({ passportIssueDate: v })} />
        <div>
          <DateField label="Date of Expiry *" value={t.passportExpiry} onChange={v => onChange({ passportExpiry: v })} />
          {expiryWarn && <p className="text-xs text-amber-700 mt-1">⚠️ {expiryWarn}</p>}
        </div>
      </div>

      {/* Issuing country + occupation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Passport Issuing Country *" value={t.issuingCountry} onChange={v => onChange({ issuingCountry: v })} placeholder="e.g. Pakistan" />
        {t.ageGroup === "adult" && (
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Occupation *</label>
            <select value={t.applicantCategory} onChange={e => onChange({ applicantCategory: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--lp-brass)]">
              <option value="">Select…</option>
              {APPLICANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Document uploads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--lp-ink)]">📎 Documents</p>
          {ocrBusy && <span className="text-xs text-blue-600 animate-pulse">Reading passport…</span>}
        </div>

        {needsOccupation && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Select your occupation first</p>
              <p className="text-xs text-amber-700 mt-0.5">Required documents vary by occupation. Please select your occupation above to see the exact documents needed.</p>
            </div>
          </div>
        )}

        {/* Passport upload first — always shown, enables OCR */}
        {filteredDocs.length === 0 && !needsOccupation ? (
          <div className="border border-dashed border-border rounded-xl p-4 bg-surface">
            <p className="text-xs text-muted mb-2">Upload passport scan to auto-fill details, plus any supporting documents.</p>
            <UploadBtn onChange={f => handlePassportUpload(passportDocId, f)} />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map(doc => (
              <div key={doc.id} className={`rounded-xl border p-4 ${t.files[doc.id] ? "border-green-200 bg-green-50" : doc.isRequired ? "border-border bg-white" : "border-dashed border-border bg-surface"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold">{(doc as { icon?: string | null }).icon || "📄"} {doc.name}</span>
                    {doc.isRequired ? <span className="ml-2 text-xs text-red-500 font-bold">*required</span> : <span className="ml-2 text-xs text-muted">(optional)</span>}
                    {doc.description && <p className="text-xs text-muted mt-0.5">{doc.description}</p>}
                  </div>
                  {t.files[doc.id] && <span className="text-green-600 text-xs font-bold shrink-0 mt-0.5">✓ Added</span>}
                </div>
                <UploadBtn onChange={f => handlePassportUpload(doc.id, f)} uploaded={t.files[doc.id]} />
                {t.docWarnings[doc.id] && (
                  <p className={`text-xs mt-2 ${t.docWarnings[doc.id]?.startsWith("✨") ? "text-green-600" : t.docWarnings[doc.id]?.startsWith("🔍") ? "text-blue-600" : "text-amber-700"}`}>
                    {t.docWarnings[doc.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadBtn({ onChange, uploaded, accept = "image/jpeg,image/png,image/webp,application/pdf" }: { onChange: (f: File) => void; uploaded?: File; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      <button type="button" onClick={() => ref.current?.click()}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${uploaded ? "border-green-300 bg-green-50 text-green-700" : "border-border bg-surface text-[var(--lp-ink)] hover:border-[var(--lp-brass)]"}`}>
        <span>{uploaded ? "✅" : "📎"}</span>
        {uploaded ? uploaded.name.length > 28 ? uploaded.name.slice(0, 25) + "…" : uploaded.name : "Choose Document"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--lp-brass)]" />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--lp-brass)]" />
    </div>
  );
}

/* ─────────────────── Main wizard ─────────────────── */
export default function VisaApplyWizard({ visa, initialAdults = 1, initialChildren = 0, initialInfants = 0, initialOccupation = "" }: { visa: VisaInfo; initialAdults?: number; initialChildren?: number; initialInfants?: number; initialOccupation?: string }) {
  const [adults, setAdults] = useState(Math.max(1, initialAdults));
  const [children, setChildren] = useState(Math.max(0, initialChildren));
  const [infants, setInfants] = useState(Math.max(0, initialInfants));

  // Steps: 0=contact, then 1..adults for adults, then children, then infants, then review
  const totalTravellers = adults + children + infants;
  const adultSteps = Array.from({ length: adults }, (_, i) => `Adult ${i + 1}`);
  const childSteps = Array.from({ length: children }, (_, i) => `Child ${i + 1}`);
  const infantSteps = Array.from({ length: infants }, (_, i) => `Infant ${i + 1}`);
  const allStepLabels = ["Contact", ...adultSteps, ...childSteps, ...infantSteps, "Review"];
  const reviewStep = allStepLabels.length - 1;

  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<ContactInfo>({ name: "", email: "", phone: "" });
  const [travellers, setTravellers] = useState<Traveller[]>([
    ...Array.from({ length: initialAdults }, (_, i) => ({ ...emptyTraveller("adult"), applicantCategory: i === 0 ? initialOccupation : "" })),
    ...Array.from({ length: initialChildren }, () => emptyTraveller("child")),
    ...Array.from({ length: initialInfants }, () => emptyTraveller("infant")),
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [batchRef, setBatchRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  function scrollTop() { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }

  // Rebuild travellers when counts change
  function handlePaxChange(a: number, c: number, inf: number) {
    setAdults(a); setChildren(c); setInfants(inf);
    const prevAdults = travellers.filter(t => t.ageGroup === "adult");
    const prevChildren = travellers.filter(t => t.ageGroup === "child");
    const prevInfants = travellers.filter(t => t.ageGroup === "infant");
    const newT: Traveller[] = [
      ...Array.from({ length: a }, (_, i) => prevAdults[i] ?? { ...emptyTraveller("adult"), applicantCategory: i === 0 ? initialOccupation : "" }),
      ...Array.from({ length: c }, (_, i) => prevChildren[i] ?? emptyTraveller("child")),
      ...Array.from({ length: inf }, (_, i) => prevInfants[i] ?? emptyTraveller("infant")),
    ];
    setTravellers(newT);
    if (step > a + c + inf) setStep(0);
  }

  function updateTraveller(idx: number, patch: Partial<Traveller>) {
    setTravellers(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t));
  }

  // Step 0 = contact, step 1..totalTravellers = traveller forms, last = review
  function getTravellerIndex(currentStep: number) { return currentStep - 1; }

  function validateStep(): string | null {
    if (step === 0) {
      if (!contact.name.trim()) return "Full name is required.";
      if (!contact.phone.trim() && !contact.email.trim()) return "Please enter at least a phone number or email.";
      return null;
    }
    if (step >= 1 && step <= totalTravellers) {
      const t = travellers[getTravellerIndex(step)];
      if (!t) return null;
      if (!t.surname.trim()) return "Surname is required.";
      if (!t.givenName.trim()) return "Given name is required.";
      if (!t.dob) return "Date of birth is required.";
      if (!t.passportNumber.trim()) return "Passport number is required.";
      if (!t.passportExpiry) return "Passport expiry date is required.";
      // Check required docs
      const filteredDocs = filterDocsForApplicant(visa.requiredDocuments, t.applicantCategory, t.nationality);
      for (const doc of filteredDocs.filter(d => d.isRequired)) {
        if (!t.files[doc.id]) return `Please upload: ${doc.name}`;
      }
      return null;
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => Math.min(s + 1, reviewStep));
    scrollTop();
  }

  function back() { setError(null); setStep(s => Math.max(s - 1, 0)); scrollTop(); }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("visaId_0", visa.id);
      form.set("fullName_0", contact.name.trim() || `${travellers[0]?.givenName} ${travellers[0]?.surname}`.trim());
      form.set("passportNumber_0", travellers[0]?.passportNumber ?? "");
      form.set("phone_0", contact.phone.trim());
      form.set("email_0", contact.email.trim());
      form.set("adults_0", String(adults));
      form.set("children_0", String(children));
      form.set("infants_0", String(infants));
      form.set("applicantCategory_0", travellers[0]?.applicantCategory ?? "");
      form.set("nationality_0", travellers[0]?.nationality ?? "");
      form.set("passportExpiry_0", travellers[0]?.passportExpiry ?? "");
      form.set("travellerCount_0", String(totalTravellers));
      travellers.forEach((t, ti) => {
        form.set(`trav_0_${ti}_fullName`, `${t.givenName} ${t.surname}`.trim());
        form.set(`trav_0_${ti}_passportNumber`, t.passportNumber);
        form.set(`trav_0_${ti}_ageGroup`, t.ageGroup);
        form.set(`trav_0_${ti}_dob`, t.dob);
        form.set(`trav_0_${ti}_passportIssueDate`, t.passportIssueDate);
        form.set(`trav_0_${ti}_passportExpiry`, t.passportExpiry);
        form.set(`trav_0_${ti}_nationality`, t.nationality);
        form.set(`trav_0_${ti}_issuingCountry`, t.issuingCountry);
        form.set(`trav_0_${ti}_applicantCategory`, t.applicantCategory);
        Object.entries(t.files).forEach(([docId, file]) => {
          form.set(`travdoc_0_${ti}_${docId}`, file);
        });
      });
      const res = await fetch("/api/visa-applications", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Submission failed. Please try again."); setSubmitting(false); return; }
      setBatchRef(data.batchRef);
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  const totalPrice = computeTotal(visa, adults, children, infants);
  const hasPricing = visa.priceAdult !== null;
  const waMsg = `Assalam o Alaikum! I'd like to apply for the ${visa.country} ${visa.type} visa (${visa.title}). Travellers: ${adults} Adult(s), ${children} Child(ren), ${infants} Infant(s).`;

function estimatedReadyDate(processingTime: string | null): string | null {
  if (!processingTime) return null;
  // Extract the max number of working days from strings like "6 to 7 Working Days", "10-12 Days", "7 Working Days"
  const nums = processingTime.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  const workingDays = Math.max(...nums);
  const date = new Date();
  let added = 0;
  while (added < workingDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++; // skip weekends
  }
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
}

  /* ── Success ── */
  if (submitted) {
    const estDate = estimatedReadyDate(visa.processingTime);
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
          <h2 className="font-display text-2xl font-semibold mb-2 text-[var(--lp-ink)]">Application Submitted!</h2>
          <p className="text-muted mb-4">Reference: <strong className="font-mono text-[var(--lp-ink)]">{batchRef}</strong></p>

          {/* Processing countdown */}
          {estDate && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">⏱ Estimated Ready By</p>
              <p className="font-display text-2xl font-semibold text-amber-800">{estDate}</p>
              <p className="text-xs text-amber-600 mt-1">Based on {visa.processingTime} processing time (working days only)</p>
            </div>
          )}

          <p className="text-muted text-sm mb-5">We&apos;ll review your documents and contact you via WhatsApp or email with updates.</p>
          <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition mb-4 w-full justify-center">
            💬 Follow up on WhatsApp
          </a>
          <p className="text-xs text-muted">You can safely close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-1">{visa.country} · {visa.type} visa</p>
        <h1 className="font-display text-2xl font-semibold text-[var(--lp-ink)] mb-1">{visa.title}</h1>
        {hasPricing && (
          <p className="text-sm text-muted">
            {adults > 0 && <span>Adult: PKR {(visa.priceAdult ?? 0).toLocaleString()} × {adults}</span>}
            {children > 0 && <span className="ml-3">Child: PKR {(visa.priceChild ?? 0).toLocaleString()} × {children}</span>}
            {infants > 0 && <span className="ml-3">Infant: PKR {(visa.priceInfant ?? 0).toLocaleString()} × {infants}</span>}
          </p>
        )}
      </div>

      <StepBar steps={allStepLabels} current={step} />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Step 0: Contact + traveller counts */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[var(--lp-ink)]">Contact Information</h2>
            <Field label="Full Name *" value={contact.name} onChange={v => setContact(c => ({ ...c, name: v }))} placeholder="Lead applicant's name" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Phone Number</label>
                <input type="tel" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} placeholder="03xx-xxxxxxx"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--lp-brass)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Email Address</label>
                <input type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="you@email.com"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--lp-brass)]" />
              </div>
            </div>
          </div>

          {/* Traveller counts */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-[var(--lp-ink)] mb-4">Number of Travellers</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Adults", sub: "12+ years", value: adults, min: 1, set: (v: number) => handlePaxChange(v, children, infants) },
                { label: "Children", sub: "2–11 years", value: children, min: 0, set: (v: number) => handlePaxChange(adults, v, infants) },
                { label: "Infants", sub: "Under 2", value: infants, min: 0, set: (v: number) => handlePaxChange(adults, children, v) },
              ].map(p => (
                <div key={p.label} className="text-center p-4 border border-border rounded-xl">
                  <p className="font-semibold text-sm text-[var(--lp-ink)]">{p.label}</p>
                  <p className="text-xs text-muted mb-3">{p.sub}</p>
                  <div className="flex items-center justify-center gap-3">
                    <button type="button" onClick={() => p.set(Math.max(p.min, p.value - 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-lg hover:border-[var(--lp-brass)] transition">−</button>
                    <span className="font-bold text-lg w-6 text-center">{p.value}</span>
                    <button type="button" onClick={() => p.set(p.value + 1)}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-lg hover:border-[var(--lp-brass)] transition">+</button>
                  </div>
                </div>
              ))}
            </div>
            {hasPricing && totalPrice > 0 && (
              <div className="mt-4 flex items-center justify-between bg-[var(--gold-bg)] border border-[var(--gold-bd)] rounded-xl px-4 py-3">
                <span className="text-sm text-muted">Estimated Total</span>
                <span className="font-display font-bold text-xl text-[var(--lp-brass)]">PKR {totalPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traveller form steps */}
      {step >= 1 && step <= totalTravellers && (() => {
        const ti = getTravellerIndex(step);
        const t = travellers[ti];
        if (!t) return null;
        const label = (() => {
          if (t.ageGroup === "adult") {
            const adultIdx = travellers.filter((x, i) => x.ageGroup === "adult" && i <= ti).length;
            return `Adult ${adultIdx}`;
          }
          if (t.ageGroup === "child") {
            const childIdx = travellers.filter((x, i) => x.ageGroup === "child" && i <= ti).length;
            return `Child ${childIdx}`;
          }
          const infantIdx = travellers.filter((x, i) => x.ageGroup === "infant" && i <= ti).length;
          return `Infant ${infantIdx}`;
        })();
        return <TravellerForm key={ti} t={t} docs={visa.requiredDocuments} onChange={patch => updateTraveller(ti, patch)} label={label} />;
      })()}

      {/* Review step */}
      {step === reviewStep && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-[var(--lp-ink)] mb-4">📋 Application Review</h2>

            {/* Contact */}
            <div className="mb-4 pb-4 border-b border-border">
              <p className="text-xs text-muted uppercase font-semibold mb-2">Contact</p>
              <p className="text-sm font-semibold">{contact.name}</p>
              {contact.phone && <p className="text-sm text-muted">{contact.phone}</p>}
              {contact.email && <p className="text-sm text-muted">{contact.email}</p>}
            </div>

            {/* Travellers */}
            <div className="space-y-4">
              {travellers.map((t, i) => (
                <div key={i} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.ageGroup === "adult" ? "bg-[var(--lp-ink)] text-white" : t.ageGroup === "child" ? "bg-amber-100 text-amber-800" : "bg-pink-100 text-pink-800"}`}>
                      {t.ageGroup.charAt(0).toUpperCase() + t.ageGroup.slice(1)} {i + 1}
                    </span>
                    <span className="text-xs text-muted">
                      {Object.keys(t.files).length} doc{Object.keys(t.files).length !== 1 ? "s" : ""} uploaded
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <ReviewRow label="Name" value={`${t.givenName} ${t.surname}`.trim() || "—"} />
                    <ReviewRow label="Passport" value={t.passportNumber || "—"} />
                    <ReviewRow label="Nationality" value={t.nationality || "—"} />
                    <ReviewRow label="DOB" value={t.dob || "—"} />
                    <ReviewRow label="Expiry" value={t.passportExpiry || "—"} />
                    <ReviewRow label="Issuing Country" value={t.issuingCountry || "—"} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charges summary */}
          {hasPricing && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-[var(--lp-ink)]">💳 Charges</h3>
              </div>
              <div className="px-6 py-4 space-y-2 text-sm">
                {adults > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Adult × {adults}</span>
                    <span className="font-semibold">PKR {((visa.priceAdult ?? 0) * adults).toLocaleString()}</span>
                  </div>
                )}
                {children > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Child × {children}</span>
                    <span className="font-semibold">PKR {((visa.priceChild ?? 0) * children).toLocaleString()}</span>
                  </div>
                )}
                {infants > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Infant × {infants}</span>
                    <span className="font-semibold">PKR {((visa.priceInfant ?? 0) * infants).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-[var(--lp-brass)]">PKR {totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-amber-50 border-t border-amber-100 px-6 py-3">
                <p className="text-xs text-amber-800">⚠️ Payment is collected in-person at our office. No online payment required.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={back}
            className="flex-1 border border-border rounded-xl py-3 text-sm font-semibold text-muted hover:border-[var(--lp-brass)] transition">
            ← Back
          </button>
        )}
        {step < reviewStep ? (
          <button type="button" onClick={next}
            className="flex-1 bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold py-3 rounded-xl text-sm transition">
            Continue →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex-1 bg-[var(--lp-ink)] hover:bg-[var(--lp-ink-light)] text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-60">
            {submitting ? "Submitting…" : "✅ Submit Application"}
          </button>
        )}
      </div>

      {step === reviewStep && (
        <p className="text-xs text-muted text-center mt-3">
          By submitting you agree to our <a href="/terms" className="underline">Terms & Conditions</a>. No payment is processed online.
        </p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-[10px] uppercase font-semibold">{label}</p>
      <p className="font-semibold text-xs mt-0.5">{value}</p>
    </div>
  );
}
