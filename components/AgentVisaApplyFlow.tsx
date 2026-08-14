"use client";
import { useState } from "react";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import { compressImage } from "@/lib/imageCompression";
import { APPLICANT_CATEGORIES, filterDocsForApplicant, passportExpiryWarning } from "@/lib/visaApplicantCategory";
import { checkImageQuality } from "@/lib/imageQualityCheck";
import { scanPassport } from "@/lib/passportScan";
import { useClientAutoSave } from "@/lib/useClientAutoSave";
import ClientConflictModal from "@/components/ClientConflictModal";

type RequiredDoc = { id: string; name: string; description: string | null; isRequired: boolean };
type VisaInfo = {
  id: string; title: string; country: string; type: string;
  priceAdult: number | null; priceChild: number | null; priceInfant: number | null;
  requiredDocuments: RequiredDoc[];
};
type AgeGroup = "adult" | "child" | "infant";
type Traveller = {
  fullName: string; passportNumber: string; passportExpiry: string;
  applicantCategory: string; nationality: string; ageGroup: AgeGroup; files: Record<string, File>;
};

function priceFor(visa: VisaInfo, g: AgeGroup) {
  return g === "adult" ? visa.priceAdult ?? 0 : g === "child" ? visa.priceChild ?? 0 : visa.priceInfant ?? 0;
}

const STEPS = ["Travellers", "Details & Docs", "Review"];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current - 1, active = i === current - 1;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: done ? "var(--gold)" : active ? "var(--navy,#0A1930)" : "var(--bdr,#e5e7eb)", color: done || active ? "#fff" : "var(--muted)" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? "var(--navy,#0A1930)" : done ? "var(--gold)" : "var(--muted)", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "var(--gold)" : "var(--bdr,#e5e7eb)", margin: "0 8px", marginBottom: 20 }} />}
          </div>
        );
      })}
    </div>
  );
}

function Counter({ label, sub, value, min, onChange }: { label: string; sub?: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{sub}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--bdr)", borderRadius: 10, overflow: "hidden" }}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 44, height: 44, fontWeight: 700, fontSize: 20, border: "none", background: "var(--bg)", cursor: "pointer" }}>−</button>
        <span style={{ minWidth: 44, textAlign: "center", fontWeight: 700, fontSize: 18, background: "#fff" }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} style={{ width: 44, height: 44, fontWeight: 700, fontSize: 20, border: "none", background: "var(--bg)", cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

export default function AgentVisaApplyFlow({ visa }: { visa: VisaInfo }) {
  const { accessToken, refresh } = useAgentAuth();
  const { autoSave, conflict, saveAsNew, dismiss } = useClientAutoSave();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [counts, setCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [activeTrav, setActiveTrav] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ batchRef: string; total: number } | null>(null);
  const [docWarnings, setDocWarnings] = useState<Record<string, string | null>>({});
  const hasPricing = visa.priceAdult !== null;
  const total = travellers.reduce((s, t) => s + priceFor(visa, t.ageGroup), 0);
  const totalTravellers = counts.adults + counts.children + counts.infants;

  function setDocWarning(key: string, msg: string | null) { setDocWarnings(w => ({ ...w, [key]: msg })); }

  function buildTravellers() {
    const list: Traveller[] = [];
    for (let i = 0; i < counts.adults; i++) list.push({ fullName: "", passportNumber: "", passportExpiry: "", applicantCategory: "", nationality: "", ageGroup: "adult", files: {} });
    for (let i = 0; i < counts.children; i++) list.push({ fullName: "", passportNumber: "", passportExpiry: "", applicantCategory: "", nationality: "", ageGroup: "child", files: {} });
    for (let i = 0; i < counts.infants; i++) list.push({ fullName: "", passportNumber: "", passportExpiry: "", applicantCategory: "", nationality: "", ageGroup: "infant", files: {} });
    setTravellers(list); setActiveTrav(0);
  }

  function updateTrav(idx: number, patch: Partial<Traveller>) { setTravellers(p => p.map((t, i) => i === idx ? { ...t, ...patch } : t)); }

  async function setTravFile(idx: number, docId: string, file: File | null) {
    if (!file) { setTravellers(p => p.map((t, i) => { if (i !== idx) return t; const f = { ...t.files }; delete f[docId]; return { ...t, files: f }; })); return; }
    const c = await compressImage(file);
    setTravellers(p => p.map((t, i) => i === idx ? { ...t, files: { ...t.files, [docId]: c } } : t));
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
    setError(null); setSubmitting(true);
    const form = new FormData();
    const lead = travellers[0];
    form.set("visaId_0", visa.id);
    form.set("fullName_0", lead.fullName.trim());
    form.set("passportNumber_0", lead.passportNumber.trim());
    form.set("phone_0", ""); form.set("email_0", "");
    form.set("adults_0", String(counts.adults));
    form.set("children_0", String(counts.children));
    form.set("infants_0", String(counts.infants));
    form.set("travellerCount_0", String(travellers.length));
    travellers.forEach((t, ti) => {
      form.set(`trav_0_${ti}_fullName`, t.fullName.trim());
      form.set(`trav_0_${ti}_passportNumber`, t.passportNumber.trim());
      form.set(`trav_0_${ti}_ageGroup`, t.ageGroup);
      form.set(`trav_0_${ti}_passportExpiry`, t.passportExpiry);
      form.set(`trav_0_${ti}_applicantCategory`, t.applicantCategory);
      form.set(`trav_0_${ti}_nationality`, t.nationality);
      Object.entries(t.files).forEach(([docId, file]) => form.set(`travdoc_0_${ti}_${docId}`, file));
    });
    try {
      const res = await agentFetch("/api/agent/visa-applications", accessToken, refresh, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Submission failed."); setSubmitting(false); return; }
      if (lead?.fullName) autoSave({ fullName: lead.fullName, passportNumber: lead.passportNumber }, accessToken, refresh);
      setResult({ batchRef: data.batchRef, total }); setStep(4);
    } catch { setError("Network error. Please try again."); }
    setSubmitting(false);
  }

  // STEP 4: DONE
  if (step === 4 && result) {
    return (
      <div className="ap-card" style={{ padding: 40, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Application Submitted!</h3>
        <p style={{ color: "var(--muted)", marginBottom: 4 }}>{visa.title} · {travellers.length} traveller{travellers.length !== 1 ? "s" : ""}</p>
        {hasPricing && <p style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)", margin: "12px 0" }}>Total: PKR {result.total.toLocaleString()}</p>}
        <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "12px 20px", marginBottom: 20, display: "inline-block" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Reference Number</div>
          <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15 }}>{result.batchRef}</div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Admin will review and follow up.</p>
        <button onClick={() => { setStep(1); setCounts({ adults: 1, children: 0, infants: 0 }); setTravellers([]); setResult(null); }} className="ap-btn ap-btn-ghost">Submit another</button>
      </div>
    );
  }

  return (
    <>
      {conflict && <ClientConflictModal matches={conflict} onSaveNew={() => saveAsNew(accessToken, refresh)} onDismiss={dismiss} />}
      <div className="ap-card" style={{ padding: "28px 28px 24px" }}>
      <StepBar current={step} />

      {/* STEP 1: TRAVELLER COUNT */}
      {step === 1 && (<>
        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>How many travellers?</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>Select the number applying for this visa.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: 420, margin: "0 auto 32px" }}>
          <Counter label="Adults" sub="Age 12+" value={counts.adults} min={1} onChange={v => setCounts(c => ({ ...c, adults: v }))} />
          <Counter label="Children" sub="Age 2–11" value={counts.children} min={0} onChange={v => setCounts(c => ({ ...c, children: v }))} />
          <Counter label="Infants" sub="Under 2" value={counts.infants} min={0} onChange={v => setCounts(c => ({ ...c, infants: v }))} />
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 12, padding: "14px 20px", maxWidth: 420, margin: "0 auto 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{totalTravellers} Traveller{totalTravellers !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{counts.adults}A {counts.children > 0 ? `· ${counts.children}C ` : ""}{counts.infants > 0 ? `· ${counts.infants}I` : ""}</div>
          </div>
          {hasPricing && <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Estimated Total</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "var(--gold)" }}>PKR {(counts.adults * (visa.priceAdult ?? 0) + counts.children * (visa.priceChild ?? 0) + counts.infants * (visa.priceInfant ?? 0)).toLocaleString()}</div>
          </div>}
        </div>
        <button onClick={() => { buildTravellers(); setStep(2); }} className="ap-btn ap-btn-gold" style={{ width: "100%", padding: "14px", fontSize: 15 }}>Continue — Fill Details →</button>
      </>)}

      {/* STEP 2: TRAVELLER DETAILS + DOCS */}
      {step === 2 && travellers.length > 0 && (<>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>Traveller {activeTrav + 1} of {travellers.length}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, textTransform: "capitalize" }}>{travellers[activeTrav].ageGroup}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {travellers.map((t, i) => (
              <button key={i} type="button" onClick={() => setActiveTrav(i)}
                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid", cursor: "pointer", borderColor: i === activeTrav ? "var(--navy,#0A1930)" : t.fullName ? "var(--gold)" : "var(--bdr)", background: i === activeTrav ? "var(--navy,#0A1930)" : "transparent", color: i === activeTrav ? "#fff" : t.fullName ? "var(--gold)" : "var(--muted)" }}>
                {t.fullName ? "✓ " : ""}{i + 1}. {t.ageGroup.charAt(0).toUpperCase() + t.ageGroup.slice(1)}{t.fullName ? ` — ${t.fullName.split(" ")[0]}` : ""}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="ap-field" style={{ gridColumn: "1/-1" }}>
            <label>Full Name <span style={{ color: "var(--red)" }}>*</span> <span style={{ fontWeight: 400, fontSize: 11, color: "var(--muted)" }}>(as on passport)</span></label>
            <input required value={travellers[activeTrav].fullName} onChange={e => updateTrav(activeTrav, { fullName: e.target.value })} />
          </div>
          <div className="ap-field">
            <label>Passport Number</label>
            <input value={travellers[activeTrav].passportNumber} onChange={e => updateTrav(activeTrav, { passportNumber: e.target.value })} placeholder="AB1234567" />
          </div>
          <div className="ap-field">
            <label>Passport Expiry</label>
            <input type="date" value={travellers[activeTrav].passportExpiry} onChange={e => updateTrav(activeTrav, { passportExpiry: e.target.value })} />
            {passportExpiryWarning(travellers[activeTrav].passportExpiry) && <p style={{ fontSize: 11, color: "#B45309", marginTop: 4 }}>⚠️ {passportExpiryWarning(travellers[activeTrav].passportExpiry)}</p>}
          </div>
          <div className="ap-field">
            <label>Occupation <span style={{ color: "var(--red)", fontSize: 10 }}>* Required for documents</span></label>
            <select value={travellers[activeTrav].applicantCategory} onChange={e => updateTrav(activeTrav, { applicantCategory: e.target.value })}>
              <option value="">Select occupation…</option>
              {APPLICANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {travellers[activeTrav].ageGroup === "adult" && !travellers[activeTrav].applicantCategory && (
              <p style={{ fontSize: 11, color: "#B45309", marginTop: 4 }}>⚠️ Select occupation — required documents vary by job type</p>
            )}
            {travellers[activeTrav].applicantCategory && (
              <p style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>✓ Showing documents for: <strong>{APPLICANT_CATEGORIES.find(c => c.value === travellers[activeTrav].applicantCategory)?.label}</strong></p>
            )}
          </div>
          <div className="ap-field">
            <label>Nationality</label>
            <input value={travellers[activeTrav].nationality} onChange={e => updateTrav(activeTrav, { nationality: e.target.value })} placeholder="e.g. Pakistani" />
          </div>
        </div>

        {visa.requiredDocuments.length > 0 && (<>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700, fontSize: 13, marginBottom: 10, borderTop: "1px solid var(--bdr)", paddingTop: 14 }}>
            <span>Documents for Traveller {activeTrav + 1}</span>
            {travellers[activeTrav].applicantCategory && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(212,168,67,0.12)", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.3)" }}>
                {APPLICANT_CATEGORIES.find(c => c.value === travellers[activeTrav].applicantCategory)?.label} only
              </span>
            )}
          </div>
          {!travellers[activeTrav].applicantCategory && travellers[activeTrav].ageGroup === "adult" && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 12, fontSize: 12, color: "#92400E" }}>
              ⚠️ Select occupation above to see the correct required documents for this traveller.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 16 }}>
            {filterDocsForApplicant(visa.requiredDocuments, travellers[activeTrav].applicantCategory, travellers[activeTrav].nationality).map(doc => {
              const f = travellers[activeTrav].files[doc.id];
              const warnKey = `${activeTrav}_${doc.id}`;
              return (
                <div key={doc.id} style={{ border: `1.5px solid ${f ? "#16a34a" : "var(--bdr)"}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{doc.name}{doc.isRequired ? <span style={{ color: "var(--red)", marginLeft: 6, fontSize: 10 }}>*required</span> : <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 10 }}>(optional)</span>}</span>
                    {f && <span style={{ color: "#16a34a", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  {doc.description && <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{doc.description}</p>}
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ fontSize: 11, width: "100%" }}
                    onChange={async e => {
                      const file = e.target.files?.[0] ?? null; if (!file) return;
                      const isPassport = /passport/i.test(doc.name);
                      if (isPassport) {
                        setDocWarning(warnKey, "🔍 Reading passport…");
                        const scan = await scanPassport(file);
                        if (!scan.ok) { setDocWarning(warnKey, `❌ ${scan.warning}`); e.target.value = ""; return; }
                        await setTravFile(activeTrav, doc.id, file);
                        const qw = await checkImageQuality(file);
                        setDocWarning(warnKey, scan.warning ? `⚠️ ${scan.warning}` : qw ? `⚠️ ${qw}` : "✨ Auto-filled — please double-check!");
                        updateTrav(activeTrav, { fullName: scan.fullName || travellers[activeTrav].fullName, passportNumber: scan.passportNumber || travellers[activeTrav].passportNumber, passportExpiry: scan.passportExpiry || travellers[activeTrav].passportExpiry, nationality: scan.nationality || travellers[activeTrav].nationality });
                      } else { await setTravFile(activeTrav, doc.id, file); setDocWarning(warnKey, await checkImageQuality(file)); }
                    }} />
                  {f && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>📎 {f.name}</p>}
                  {docWarnings[warnKey] && <p style={{ fontSize: 11, marginTop: 4, color: docWarnings[warnKey]?.startsWith("✨") ? "#16a34a" : docWarnings[warnKey]?.startsWith("🔍") ? "#2563eb" : "#B45309" }}>{docWarnings[warnKey]}</p>}
                </div>
              );
            })}
          </div>
        </>)}

        {error && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setStep(1); setError(null); }} className="ap-btn ap-btn-ghost">← Back</button>
          <button onClick={() => {
            if (activeTrav < travellers.length - 1) { setActiveTrav(activeTrav + 1); return; }
            const v = validateTravellers(); if (v) { setError(v); return; }
            setError(null); setStep(3);
          }} className="ap-btn ap-btn-gold" style={{ flex: 1, padding: "13px" }}>
            {activeTrav < travellers.length - 1 ? `Next Traveller (${activeTrav + 2}/${travellers.length}) →` : "Review Application →"}
          </button>
        </div>
      </>)}

      {/* STEP 3: REVIEW */}
      {step === 3 && (<>
        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Review & Submit</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Check all details before submitting.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10, marginBottom: 16 }}>
          {travellers.map((t, i) => {
            const docCount = Object.keys(t.files).length;
            return (
              <div key={i} style={{ border: "1.5px solid var(--bdr)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{i + 1}. {t.fullName} <span style={{ fontWeight: 400, color: "var(--muted)", textTransform: "capitalize", fontSize: 11 }}>({t.ageGroup})</span></div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Passport: {t.passportNumber || "—"}</div>
                {hasPricing && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginTop: 4 }}>PKR {priceFor(visa, t.ageGroup).toLocaleString()}</div>}
                <div style={{ fontSize: 11, marginTop: 4, color: "var(--muted)" }}>📎 {docCount} doc{docCount !== 1 ? "s" : ""}</div>
                <button type="button" onClick={() => { setActiveTrav(i); setStep(2); }} style={{ fontSize: 11, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>Edit</button>
              </div>
            );
          })}
        </div>
        {hasPricing && <div style={{ background: "var(--bg)", border: "2px solid var(--gold)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Total Amount</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: "var(--gold)" }}>PKR {total.toLocaleString()}</span>
        </div>}
        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setStep(2); setError(null); }} className="ap-btn ap-btn-ghost">← Back</button>
          <button onClick={handleSubmit} disabled={submitting} className="ap-btn ap-btn-gold" style={{ flex: 1, padding: "14px", fontSize: 15 }}>{submitting ? "Submitting…" : "Submit Application ✓"}</button>
        </div>
      </>)}
    </div>
    </>
  );
}
