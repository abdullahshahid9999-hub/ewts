"use client";

import { useState } from "react";
import Link from "next/link";

type RequiredDoc = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
};

type VisaInfo = {
  id: string;
  title: string;
  country: string;
  type: string;
  priceAdult: number | null;
  priceChild: number | null;
  priceInfant: number | null;
  requiredDocuments: RequiredDoc[];
};

type ApplicationDraft = {
  visa: VisaInfo;
  fullName: string;
  passportNumber: string;
  phone: string;
  email: string;
  adults: number;
  children: number;
  infants: number;
  // doc id → File
  files: Record<string, File>;
};

function emptyDraft(visa: VisaInfo, initial?: { adults?: number; children?: number; infants?: number }): ApplicationDraft {
  return {
    visa,
    fullName: "",
    passportNumber: "",
    phone: "",
    email: "",
    adults: initial?.adults ?? 1,
    children: initial?.children ?? 0,
    infants: initial?.infants ?? 0,
    files: {},
  };
}

function computePrice(draft: ApplicationDraft): number {
  const pa = draft.visa.priceAdult ?? 0;
  const pc = draft.visa.priceChild ?? 0;
  const pi = draft.visa.priceInfant ?? 0;
  return draft.adults * pa + draft.children * pc + draft.infants * pi;
}

export default function VisaApplyFlow({ visa, initialAdults, initialChildren, initialInfants }: { visa: VisaInfo; initialAdults?: number; initialChildren?: number; initialInfants?: number }) {
  const [mode, setMode] = useState<"idle" | "form" | "success">("idle");
  // The cart: list of application drafts
  const [drafts, setDrafts] = useState<ApplicationDraft[]>([emptyDraft(visa, { adults: initialAdults, children: initialChildren, infants: initialInfants })]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchRef, setBatchRef] = useState<string | null>(null);

  function updateDraft(idx: number, patch: Partial<ApplicationDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function setFile(idx: number, docId: string, file: File | null) {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const files = { ...d.files };
        if (file) files[docId] = file;
        else delete files[docId];
        return { ...d, files };
      })
    );
  }

  function addAnother() {
    setDrafts((prev) => [...prev, emptyDraft(visa)]);
    setActiveIdx(drafts.length);
  }

  function removeDraft(idx: number) {
    if (drafts.length === 1) return; // always keep at least one
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.min(prev, drafts.length - 2));
  }

  async function handleSubmit() {
    setError(null);

    // Basic validation
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d.fullName.trim()) { setError(`Application ${i + 1}: Full name is required.`); setActiveIdx(i); return; }
      if (!d.passportNumber.trim()) { setError(`Application ${i + 1}: Passport number is required.`); setActiveIdx(i); return; }
      if (!d.phone.trim()) { setError(`Application ${i + 1}: Phone is required.`); setActiveIdx(i); return; }
      if (!d.email.trim()) { setError(`Application ${i + 1}: Email is required.`); setActiveIdx(i); return; }
      const requiredDocs = d.visa.requiredDocuments.filter((doc) => doc.isRequired);
      for (const doc of requiredDocs) {
        if (!d.files[doc.id]) {
          setError(`Application ${i + 1}: "${doc.name}" is required.`);
          setActiveIdx(i);
          return;
        }
      }
    }

    setSubmitting(true);
    const form = new FormData();

    drafts.forEach((d, i) => {
      form.set(`visaId_${i}`, d.visa.id);
      form.set(`fullName_${i}`, d.fullName.trim());
      form.set(`passportNumber_${i}`, d.passportNumber.trim());
      form.set(`phone_${i}`, d.phone.trim());
      form.set(`email_${i}`, d.email.trim());
      form.set(`adults_${i}`, String(d.adults));
      form.set(`children_${i}`, String(d.children));
      form.set(`infants_${i}`, String(d.infants));
      Object.entries(d.files).forEach(([docId, file]) => {
        form.set(`doc_${docId}_${i}`, file);
      });
    });

    try {
      const res = await fetch("/api/visa-applications", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setBatchRef(data.batchRef);
      setMode("success");
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (mode === "idle") {
    return (
      <button
        onClick={() => setMode("form")}
        className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-xl text-sm transition-colors"
      >
        Apply Now →
      </button>
    );
  }

  if (mode === "success") {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-3">✅</p>
        <h3 className="font-semibold mb-1">Application Submitted!</h3>
        <p className="text-muted text-xs mb-2">Reference: <strong className="font-mono">{batchRef}</strong></p>
        <p className="text-muted text-xs mb-4">
          We&apos;ll review your documents and contact you on WhatsApp or email shortly.
        </p>
        <button
          onClick={() => { setMode("idle"); setDrafts([emptyDraft(visa)]); setActiveIdx(0); setBatchRef(null); }}
          className="text-xs text-muted hover:underline"
        >
          Submit another application
        </button>
      </div>
    );
  }

  const draft = drafts[activeIdx];
  const totalPrice = computePrice(draft);
  const hasPricing = draft.visa.priceAdult !== null;

  return (
    <div>
      {/* Application tabs / cart indicator */}
      {drafts.length > 1 && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {drafts.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${
                i === activeIdx
                  ? "bg-gold text-black border-gold"
                  : "border-border text-muted hover:border-gold"
              }`}
            >
              App {i + 1}{d.fullName ? ` — ${d.fullName.split(" ")[0]}` : ""}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {/* Applicant Info */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Full Name *</label>
          <input
            type="text"
            value={draft.fullName}
            onChange={(e) => updateDraft(activeIdx, { fullName: e.target.value })}
            placeholder="As on passport"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Passport Number *</label>
          <input
            type="text"
            value={draft.passportNumber}
            onChange={(e) => updateDraft(activeIdx, { passportNumber: e.target.value })}
            placeholder="e.g. AB1234567"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Phone *</label>
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => updateDraft(activeIdx, { phone: e.target.value })}
              placeholder="03xx-xxxxxxx"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Email *</label>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => updateDraft(activeIdx, { email: e.target.value })}
              placeholder="you@email.com"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Traveler counts */}
        <div className="grid grid-cols-3 gap-2">
          <Counter
            label="Adults"
            value={draft.adults}
            min={1}
            onChange={(v) => updateDraft(activeIdx, { adults: v })}
          />
          <Counter
            label="Children"
            value={draft.children}
            min={0}
            onChange={(v) => updateDraft(activeIdx, { children: v })}
          />
          <Counter
            label="Infants"
            value={draft.infants}
            min={0}
            onChange={(v) => updateDraft(activeIdx, { infants: v })}
          />
        </div>

        {/* Price preview */}
        {hasPricing && totalPrice > 0 && (
          <div className="bg-surface rounded-xl px-3 py-2.5 flex justify-between items-center">
            <span className="text-xs text-muted">Estimated total</span>
            <span className="font-display font-semibold text-gold">PKR {totalPrice.toLocaleString()}</span>
          </div>
        )}

        {/* Document uploads — always show section */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Upload Documents
          </p>

          {draft.visa.requiredDocuments.length === 0 ? (
            // No configured requirements — show a generic upload slot
            <div className="border border-border rounded-xl p-3 bg-surface">
              <p className="text-xs text-muted mb-2">
                Upload any supporting documents (passport scan, photo, bank statement, etc.)
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                className="text-xs w-full"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  files.forEach((f, idx) => setFile(activeIdx, `extra_${idx}_${activeIdx}`, f));
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {draft.visa.requiredDocuments.map((doc) => (
                <div key={doc.id} className="border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-semibold">{doc.name}</span>
                      {doc.isRequired ? (
                        <span className="ml-1.5 text-xs text-red-500 font-bold">*required</span>
                      ) : (
                        <span className="ml-1.5 text-xs text-muted">(optional)</span>
                      )}
                      {doc.description && (
                        <p className="text-xs text-muted mt-0.5">{doc.description}</p>
                      )}
                    </div>
                    {draft.files[doc.id] && (
                      <span className="text-green-600 text-xs font-bold shrink-0">✓ Added</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="text-xs w-full"
                    onChange={(e) => setFile(activeIdx, doc.id, e.target.files?.[0] ?? null)}
                  />
                  {draft.files[doc.id] && (
                    <p className="text-xs text-muted mt-1">📎 {draft.files[doc.id].name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remove this application (only if more than one) */}
        {drafts.length > 1 && (
          <button
            type="button"
            onClick={() => removeDraft(activeIdx)}
            className="text-xs text-red-500 hover:underline w-full text-center"
          >
            Remove this application
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {/* Add another visa application */}
        <button
          type="button"
          onClick={addAnother}
          className="w-full border border-border text-sm font-semibold py-2.5 rounded-xl hover:border-gold transition-colors"
        >
          + Add Another Visa Application
        </button>

        {/* Summary before submit */}
        {drafts.length > 1 && (
          <div className="bg-surface rounded-xl px-3 py-2 text-xs text-muted">
            {drafts.length} applications in this batch
            {hasPricing && (
              <> · Total PKR {drafts.reduce((s, d) => s + computePrice(d), 0).toLocaleString()}</>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : drafts.length > 1 ? `Submit All ${drafts.length} Applications` : "Submit Application"}
        </button>

        <button
          type="button"
          onClick={() => { setMode("idle"); setError(null); }}
          className="w-full text-xs text-muted hover:text-text transition-colors py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Counter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted uppercase font-semibold mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-sm font-bold hover:border-gold transition-colors"
        >−</button>
        <span className="w-6 text-center font-semibold text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-sm font-bold hover:border-gold transition-colors"
        >+</button>
      </div>
    </div>
  );
}
