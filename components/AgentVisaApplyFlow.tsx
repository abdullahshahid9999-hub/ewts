"use client";

import { useState } from "react";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import { compressImage } from "@/lib/imageCompression";

type RequiredDoc = { id: string; name: string; description: string | null; isRequired: boolean };
type VisaInfo = {
  id: string; title: string; country: string; type: string;
  priceAdult: number | null; priceChild: number | null; priceInfant: number | null;
  requiredDocuments: RequiredDoc[];
};
type AgeGroup = "adult" | "child" | "infant";
type Traveller = { fullName: string; passportNumber: string; ageGroup: AgeGroup; files: Record<string, File> };

function priceFor(visa: VisaInfo, ageGroup: AgeGroup): number {
  if (ageGroup === "adult") return visa.priceAdult ?? 0;
  if (ageGroup === "child") return visa.priceChild ?? 0;
  return visa.priceInfant ?? 0;
}

// Step-by-step wizard for agents: visa summary → applicant contact →
// traveller count → per-traveller details+documents → review → submit →
// confirmation. Mirrors the public site's visa flow's fields (same
// contact fields, same required documents) but collects one full
// document set PER TRAVELLER instead of one shared upload for the whole
// application, per the owner's spec.
export default function AgentVisaApplyFlow({ visa }: { visa: VisaInfo }) {
  const { accessToken, refresh } = useAgentAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [counts, setCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [activeTrav, setActiveTrav] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ batchRef: string; total: number } | null>(null);

  function buildTravellers() {
    const list: Traveller[] = [];
    for (let i = 0; i < counts.adults; i++) list.push({ fullName: "", passportNumber: "", ageGroup: "adult", files: {} });
    for (let i = 0; i < counts.children; i++) list.push({ fullName: "", passportNumber: "", ageGroup: "child", files: {} });
    for (let i = 0; i < counts.infants; i++) list.push({ fullName: "", passportNumber: "", ageGroup: "infant", files: {} });
    setTravellers(list);
    setActiveTrav(0);
  }

  function updateTrav(idx: number, patch: Partial<Traveller>) {
    setTravellers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  async function setTravFile(idx: number, docId: string, file: File | null) {
    if (!file) {
      setTravellers((prev) => prev.map((t, i) => {
        if (i !== idx) return t;
        const files = { ...t.files };
        delete files[docId];
        return { ...t, files };
      }));
      return;
    }
    const compressed = await compressImage(file);
    setTravellers((prev) => prev.map((t, i) => (i === idx ? { ...t, files: { ...t.files, [docId]: compressed } } : t)));
  }

  const total = travellers.reduce((sum, t) => sum + priceFor(visa, t.ageGroup), 0);
  const hasPricing = visa.priceAdult !== null;

  function goToTravellerStep() {
    if (!phone.trim() || !email.trim()) { setError("Phone and email are required."); return; }
    setError(null);
    buildTravellers();
    setStep(4);
  }

  function validateTravellers(): string | null {
    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      if (!t.fullName.trim()) return `Traveller ${i + 1}: Full name is required.`;
      for (const doc of visa.requiredDocuments) {
        if (doc.isRequired && !t.files[doc.id]) return `Traveller ${i + 1}: "${doc.name}" is required.`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    const v = validateTravellers();
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);

    const form = new FormData();
    const lead = travellers[0];
    form.set("visaId_0", visa.id);
    form.set("fullName_0", lead.fullName.trim());
    form.set("passportNumber_0", lead.passportNumber.trim());
    form.set("phone_0", phone.trim());
    form.set("email_0", email.trim());
    form.set("adults_0", String(counts.adults));
    form.set("children_0", String(counts.children));
    form.set("infants_0", String(counts.infants));
    form.set("travellerCount_0", String(travellers.length));
    travellers.forEach((t, ti) => {
      form.set(`trav_0_${ti}_fullName`, t.fullName.trim());
      form.set(`trav_0_${ti}_passportNumber`, t.passportNumber.trim());
      form.set(`trav_0_${ti}_ageGroup`, t.ageGroup);
      Object.entries(t.files).forEach(([docId, file]) => form.set(`travdoc_0_${ti}_${docId}`, file));
    });

    try {
      const res = await agentFetch("/api/agent/visa-applications", accessToken, refresh, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Submission failed. Please try again."); setSubmitting(false); return; }
      setResult({ batchRef: data.batchRef, total });
      setStep(5);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  // STEP 5 — Confirmation
  if (step === 5 && result) {
    return (
      <div className="ap-card" style={{ padding: 24, textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 10 }}>✅</p>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Application Submitted!</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{visa.title} · {travellers.length} traveller{travellers.length > 1 ? "s" : ""}</p>
        {hasPricing && <p style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)", margin: "8px 0" }}>Total: PKR {result.total.toLocaleString()}</p>}
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Reference: <strong style={{ fontFamily: "monospace" }}>{result.batchRef}</strong></p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>No payment collected yet — this submits a booking request only. Admin will review and follow up.</p>
        <button
          onClick={() => { setStep(1); setPhone(""); setEmail(""); setCounts({ adults: 1, children: 0, infants: 0 }); setTravellers([]); setResult(null); }}
          className="ap-btn ap-btn-ghost"
        >
          Apply for another
        </button>
      </div>
    );
  }

  return (
    <div className="ap-card" style={{ padding: 20 }}>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, fontSize: 10, color: "var(--muted)" }}>
        {["Contact", "Travellers", "Details & Docs", "Review"].map((label, i) => (
          <span key={label} style={{ fontWeight: step === i + 2 || (i === 0 && step <= 2) ? 700 : 400, color: step >= i + 2 ? "var(--gold)" : "var(--muted)" }}>
            {i > 0 && " → "}{label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{visa.title}</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, textTransform: "capitalize" }}>{visa.country} · {visa.type} visa</p>
          {hasPricing && (
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Adult</span><strong>PKR {(visa.priceAdult ?? 0).toLocaleString()}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Child</span><strong>PKR {(visa.priceChild ?? 0).toLocaleString()}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Infant</span><strong>PKR {(visa.priceInfant ?? 0).toLocaleString()}</strong></div>
            </div>
          )}
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Customer Contact</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div className="ap-field"><label>Phone</label><input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" /></div>
            <div className="ap-field"><label>Email</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          {error && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</p>}
          <button onClick={goToTravellerStep} className="ap-btn ap-btn-gold" style={{ width: "100%" }}>Continue →</button>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>How many travellers?</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
            <Counter label="Adults" value={counts.adults} min={1} onChange={(v) => setCounts((c) => ({ ...c, adults: v }))} />
            <Counter label="Children" value={counts.children} min={0} onChange={(v) => setCounts((c) => ({ ...c, children: v }))} />
            <Counter label="Infants" value={counts.infants} min={0} onChange={(v) => setCounts((c) => ({ ...c, infants: v }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} className="ap-btn ap-btn-ghost">← Back</button>
            <button onClick={() => { buildTravellers(); setStep(3); }} className="ap-btn ap-btn-gold" style={{ flex: 1 }}>Continue →</button>
          </div>
        </>
      )}

      {step === 3 && travellers.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {travellers.map((t, i) => (
              <button key={i} type="button" onClick={() => setActiveTrav(i)} className="ap-btn ap-btn-ghost"
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: i === activeTrav ? "var(--gold)" : undefined, color: i === activeTrav ? "#000" : undefined }}>
                {i + 1}. {t.ageGroup}{t.fullName ? ` — ${t.fullName.split(" ")[0]}` : ""}
              </button>
            ))}
          </div>

          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, textTransform: "capitalize" }}>Traveller {activeTrav + 1} ({travellers[activeTrav].ageGroup})</p>
          <div className="ap-field" style={{ marginBottom: 10 }}>
            <label>Full Name (as on passport)</label>
            <input required value={travellers[activeTrav].fullName} onChange={(e) => updateTrav(activeTrav, { fullName: e.target.value })} />
          </div>
          <div className="ap-field" style={{ marginBottom: 16 }}>
            <label>Passport Number</label>
            <input value={travellers[activeTrav].passportNumber} onChange={(e) => updateTrav(activeTrav, { passportNumber: e.target.value })} placeholder="e.g. AB1234567" />
          </div>

          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Documents for this traveller</p>
          {visa.requiredDocuments.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--muted)" }}>No specific documents configured for this visa.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {visa.requiredDocuments.map((doc) => {
                const f = travellers[activeTrav].files[doc.id];
                return (
                  <div key={doc.id} style={{ border: "1px solid var(--bdr)", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {doc.name}{doc.isRequired ? <span style={{ color: "var(--red)", marginLeft: 6, fontSize: 11 }}>*required</span> : <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 11 }}>(optional)</span>}
                      </span>
                      {f && <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 700 }}>✓ Added</span>}
                    </div>
                    {doc.description && <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{doc.description}</p>}
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ fontSize: 11, width: "100%" }}
                      onChange={(e) => setTravFile(activeTrav, doc.id, e.target.files?.[0] ?? null)} />
                    {f && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>📎 {f.name}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(2)} className="ap-btn ap-btn-ghost">← Back</button>
            <button
              onClick={() => {
                if (activeTrav < travellers.length - 1) { setActiveTrav(activeTrav + 1); return; }
                const v = validateTravellers();
                if (v) { setError(v); return; }
                setError(null);
                setStep(4);
              }}
              className="ap-btn ap-btn-gold" style={{ flex: 1 }}
            >
              {activeTrav < travellers.length - 1 ? "Next Traveller →" : "Review Application →"}
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Review Application</p>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{visa.title} · {phone} · {email}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {travellers.map((t, i) => {
              const docCount = Object.keys(t.files).length;
              return (
                <div key={i} style={{ border: "1px solid var(--bdr)", borderRadius: 10, padding: 12, fontSize: 12.5 }}>
                  <strong style={{ textTransform: "capitalize" }}>{i + 1}. {t.fullName} <span style={{ fontWeight: 400, color: "var(--muted)" }}>({t.ageGroup})</span></strong>
                  <div style={{ color: "var(--muted)", marginTop: 2 }}>Passport: {t.passportNumber || "—"} · PKR {priceFor(visa, t.ageGroup).toLocaleString()}</div>
                  <div style={{ color: "var(--muted)", marginTop: 2 }}>📎 {docCount} document{docCount === 1 ? "" : "s"} attached</div>
                </div>
              );
            })}
          </div>
          {hasPricing && (
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>Total</span><strong style={{ color: "var(--gold)" }}>PKR {total.toLocaleString()}</strong>
            </div>
          )}
          {error && <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(3)} className="ap-btn ap-btn-ghost">← Back</button>
            <button onClick={handleSubmit} disabled={submitting} className="ap-btn ap-btn-gold" style={{ flex: 1 }}>
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </>
      )}
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
