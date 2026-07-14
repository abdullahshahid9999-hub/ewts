"use client";

import { useState } from "react";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

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

function emptyDraft(visa: VisaInfo): ApplicationDraft {
  return {
    visa,
    fullName: "",
    passportNumber: "",
    phone: "",
    email: "",
    adults: 1,
    children: 0,
    infants: 0,
    files: {},
  };
}

function computePrice(draft: ApplicationDraft): number {
  const pa = draft.visa.priceAdult ?? 0;
  const pc = draft.visa.priceChild ?? 0;
  const pi = draft.visa.priceInfant ?? 0;
  return draft.adults * pa + draft.children * pc + draft.infants * pi;
}

// Same shape/validation/flow as the public site's VisaApplyFlow (customer
// selects a visa → fills applicant + traveler-count fields → uploads the
// required documents → can stack multiple applications in one batch) —
// the agent portal mirrors it exactly so an agent applies for a customer
// the same way the customer would apply for themselves.
export default function AgentVisaApplyFlow({ visa }: { visa: VisaInfo }) {
  const { accessToken, refresh } = useAgentAuth();
  const [drafts, setDrafts] = useState<ApplicationDraft[]>([emptyDraft(visa)]);
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
      const res = await agentFetch("/api/agent/visa-applications", accessToken, refresh, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setBatchRef(data.batchRef);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (batchRef) {
    return (
      <div className="ap-card" style={{ padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 10 }}>✅</p>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Application Submitted!</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          Reference: <strong style={{ fontFamily: "monospace" }}>{batchRef}</strong>
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          It now shows up for admin review, same as any customer application.
        </p>
        <button
          onClick={() => { setDrafts([emptyDraft(visa)]); setActiveIdx(0); setBatchRef(null); }}
          className="ap-btn ap-btn-ghost"
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
    <div className="ap-card" style={{ padding: "20px" }}>
      {drafts.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {drafts.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className="ap-btn ap-btn-ghost"
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 999,
                background: i === activeIdx ? "var(--gold)" : undefined,
                color: i === activeIdx ? "#000" : undefined,
                borderColor: i === activeIdx ? "var(--gold)" : undefined,
              }}
            >
              App {i + 1}{d.fullName ? ` — ${d.fullName.split(" ")[0]}` : ""}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Applicant Details</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div className="ap-field">
          <label>Full Name (as on passport)</label>
          <input required value={draft.fullName} onChange={(e) => updateDraft(activeIdx, { fullName: e.target.value })} />
        </div>
        <div className="ap-field">
          <label>Passport Number</label>
          <input required value={draft.passportNumber} onChange={(e) => updateDraft(activeIdx, { passportNumber: e.target.value })} placeholder="e.g. AB1234567" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="ap-field">
            <label>Phone</label>
            <input required type="tel" value={draft.phone} onChange={(e) => updateDraft(activeIdx, { phone: e.target.value })} placeholder="03xx-xxxxxxx" />
          </div>
          <div className="ap-field">
            <label>Email</label>
            <input required type="email" value={draft.email} onChange={(e) => updateDraft(activeIdx, { email: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Traveler counts — required fields the owner asked for, same
          adults/children/infants pax counters as the public flow. */}
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Number of Travelers</p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        <Counter label="Adults" value={draft.adults} min={1} onChange={(v) => updateDraft(activeIdx, { adults: v })} />
        <Counter label="Children" value={draft.children} min={0} onChange={(v) => updateDraft(activeIdx, { children: v })} />
        <Counter label="Infants" value={draft.infants} min={0} onChange={(v) => updateDraft(activeIdx, { infants: v })} />
      </div>

      {hasPricing && totalPrice > 0 && (
        <div style={{ background: "var(--bg)", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12.5, display: "flex", justifyContent: "space-between" }}>
          <span>Estimated total</span>
          <strong style={{ color: "var(--gold)" }}>PKR {totalPrice.toLocaleString()}</strong>
        </div>
      )}

      {/* Required document uploads */}
      <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: 14, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Upload Documents</p>

        {draft.visa.requiredDocuments.length === 0 ? (
          <div style={{ border: "1px solid var(--bdr)", borderRadius: 10, padding: 12, background: "var(--bg)" }}>
            <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
              Upload any supporting documents (passport scan, photo, bank statement, etc.)
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              style={{ fontSize: 11, width: "100%" }}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                files.forEach((f, idx) => setFile(activeIdx, `extra_${idx}_${activeIdx}`, f));
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.visa.requiredDocuments.map((doc) => (
              <div key={doc.id} style={{ border: "1px solid var(--bdr)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{doc.name}</span>
                    {doc.isRequired ? (
                      <span style={{ marginLeft: 6, fontSize: 11, color: "var(--red)", fontWeight: 700 }}>*required</span>
                    ) : (
                      <span style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)" }}>(optional)</span>
                    )}
                    {doc.description && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{doc.description}</p>}
                  </div>
                  {draft.files[doc.id] && <span style={{ color: "var(--green, #16a34a)", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>✓ Added</span>}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ fontSize: 11, width: "100%" }}
                  onChange={(e) => setFile(activeIdx, doc.id, e.target.files?.[0] ?? null)}
                />
                {draft.files[doc.id] && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>📎 {draft.files[doc.id].name}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {drafts.length > 1 && (
        <button type="button" onClick={() => removeDraft(activeIdx)} className="ap-btn ap-btn-ghost" style={{ width: "100%", color: "var(--red)", marginBottom: 12 }}>
          Remove this application
        </button>
      )}

      {error && (
        <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" onClick={addAnother} className="ap-btn ap-btn-ghost">
          + Add Another Visa Application
        </button>

        {drafts.length > 1 && (
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "var(--muted)" }}>
            {drafts.length} applications in this batch
            {hasPricing && <> · Total PKR {drafts.reduce((s, d) => s + computePrice(d), 0).toLocaleString()}</>}
          </div>
        )}

        <button type="button" onClick={handleSubmit} disabled={submitting} className="ap-btn ap-btn-gold">
          {submitting ? "Submitting…" : drafts.length > 1 ? `Submit All ${drafts.length} Applications` : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

function Counter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>−</button>
        <span style={{ minWidth: 20, textAlign: "center" }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>+</button>
      </div>
    </div>
  );
}
