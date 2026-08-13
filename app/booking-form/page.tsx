"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── Types ─── */
type RoomType = { id: string; roomType: string; pricePerPersonPkr: number; pricePerChildWithBedPkr: number; pricePerChildWithoutBedPkr: number; pricePerInfantPkr: number; maxAdults: number; maxInfants: number };
type Pkg = { id: string; name: string; imageUrl?: string; duration?: string; roomTypes: RoomType[] };
type OcrData = { givenName?: string; surname?: string; passportNo?: string; dateOfBirth?: string; dateOfIssue?: string; dateOfExpiry?: string; gender?: string; nationality?: string; issuingCountry?: string; passportImageUrl?: string };
type Traveller = OcrData & { travellerType: "adult" | "child_with_bed" | "child_without_bed" | "infant"; scanning?: boolean };

const INP = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff", boxSizing: "border-box" as const };
const LBL = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block", marginBottom: 4 };

function emptyTraveller(type: Traveller["travellerType"]): Traveller {
  return { travellerType: type, givenName: "", surname: "", passportNo: "", dateOfBirth: "", dateOfIssue: "", dateOfExpiry: "", gender: "", nationality: "", issuingCountry: "", passportImageUrl: "" };
}

function calcTotal(rt: RoomType | null, adults: number, cwb: number, cwob: number, infants: number) {
  if (!rt) return 0;
  return adults * rt.pricePerPersonPkr + cwb * rt.pricePerChildWithBedPkr + cwob * rt.pricePerChildWithoutBedPkr + infants * rt.pricePerInfantPkr;
}

/* ─── Traveller Card ─── */
function TravellerCard({ t, idx, label, onChange }: { t: Traveller; idx: number; label: string; onChange: (u: Partial<Traveller>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleScan(file: File) {
    onChange({ scanning: true });
    const fd = new FormData(); fd.append("passport", file);
    const res = await fetch("/api/ocr-passport", { method: "POST", body: fd });
    const d: OcrData = await res.json().catch(() => ({}));
    onChange({ ...d, scanning: false });
  }

  const fields: { key: keyof OcrData; label: string; type?: string }[] = [
    { key: "givenName", label: "Given Name" },
    { key: "surname", label: "Surname" },
    { key: "passportNo", label: "Passport Number" },
    { key: "dateOfBirth", label: "Date of Birth", type: "date" },
    { key: "dateOfIssue", label: "Date of Issue", type: "date" },
    { key: "dateOfExpiry", label: "Date of Expiry", type: "date" },
    { key: "nationality", label: "Nationality" },
    { key: "issuingCountry", label: "Issuing Country" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "12px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{label}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {t.passportImageUrl && <span style={{ fontSize: 11, color: "#16a34a" }}>✓ Passport saved</span>}
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ background: t.scanning ? "#94a3b8" : "#0E2A26", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: t.scanning ? "not-allowed" : "pointer" }}
            disabled={t.scanning}>
            {t.scanning ? "Scanning…" : "📷 Scan Passport"}
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleScan(f); }} />
        </div>
      </div>
      <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
        {fields.map(f => (
          <div key={f.key} style={f.key === "givenName" || f.key === "surname" ? {} : {}}>
            <label style={LBL}>{f.label}</label>
            <input style={INP} type={f.type ?? "text"} value={(t[f.key] as string) ?? ""}
              onChange={e => onChange({ [f.key]: e.target.value })} />
          </div>
        ))}
        <div>
          <label style={LBL}>Gender</label>
          <select style={INP} value={t.gender ?? ""} onChange={e => onChange({ gender: e.target.value })}>
            <option value="">—</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
function BookingFormInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const packageId = sp.get("packageId") ?? "";
  const roomTypeId = sp.get("roomTypeId") ?? sp.get("roomType") ?? ""; // support both old and new param

  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [adults, setAdults] = useState(Number(sp.get("adults") ?? 1));
  const [cwb, setCwb] = useState(Number(sp.get("childrenWithBed") ?? sp.get("children") ?? 0));   // children with bed
  const [cwob, setCwob] = useState(Number(sp.get("childrenWithoutBed") ?? 0)); // children without bed
  const [infants, setInfants] = useState(0);
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load package
  useEffect(() => {
    if (!packageId) return;
    fetch(`/api/public/packages/${packageId}`).then(r => r.json()).then(d => {
      setPkg(d.pkg);
      const rt = d.pkg?.roomTypes?.find((r: RoomType) => r.id === roomTypeId)
        ?? d.pkg?.roomTypes?.find((r: RoomType) => r.roomType === roomTypeId)
        ?? d.pkg?.roomTypes?.[0] ?? null;
      setRoomType(rt);
    }).catch(() => {});
  }, [packageId, roomTypeId]);

  // Rebuild travellers list when counts change
  useEffect(() => {
    const list: Traveller[] = [
      ...Array(adults).fill(null).map(() => emptyTraveller("adult")),
      ...Array(cwb).fill(null).map(() => emptyTraveller("child_with_bed")),
      ...Array(cwob).fill(null).map(() => emptyTraveller("child_without_bed")),
      ...Array(infants).fill(null).map(() => emptyTraveller("infant")),
    ];
    setTravellers(prev => list.map((t, i) => ({ ...t, ...prev[i] })));
  }, [adults, cwb, cwob, infants]);

  function updateTraveller(idx: number, u: Partial<Traveller>) {
    setTravellers(prev => prev.map((t, i) => i === idx ? { ...t, ...u } : t));
  }

  const total = calcTotal(roomType, adults, cwb, cwob, infants);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, roomTypeId: roomType?.id, adults, childrenWithBed: cwb, childrenWithoutBed: cwob, infants, customerName: lead.name, customerEmail: lead.email, customerPhone: lead.phone, specialRequests, travellers, totalPricePkr: total }),
    });
    const d = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(d.error ?? "Submission failed."); return; }
    router.push(`/booking-confirmation?ref=${d.bookingRef}`);
  }

  // Traveller labels
  const travellerLabels: string[] = [
    ...Array(adults).fill(null).map((_, i) => `Adult ${i + 1}`),
    ...Array(cwb).fill(null).map((_, i) => `Child ${i + 1} (With Bed)`),
    ...Array(cwob).fill(null).map((_, i) => `Child ${i + 1} (Without Bed)`),
    ...Array(infants).fill(null).map((_, i) => `Infant ${i + 1}`),
  ];

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>

        {/* LEFT */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Lead Booker */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 22px", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>1. Your Contact Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={LBL}>Full Name *</label>
                <input style={INP} required value={lead.name} onChange={e => setLead(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div>
                <label style={LBL}>Email</label>
                <input style={INP} type="email" value={lead.email} onChange={e => setLead(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
              </div>
              <div>
                <label style={LBL}>Phone *</label>
                <input style={INP} required value={lead.phone} onChange={e => setLead(f => ({ ...f, phone: e.target.value }))} placeholder="03001234567" />
              </div>
            </div>
          </div>

          {/* Step 2: Traveller Count */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 22px", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>2. Traveller Count</h3>
            {[
              { label: "Adults", val: adults, set: setAdults, min: 1, max: roomType?.maxAdults ?? 10 },
              { label: "Children (With Bed)", val: cwb, set: setCwb, min: 0, max: 4 },
              { label: "Children (Without Bed, max 2)", val: cwob, set: setCwob, min: 0, max: 2 },
              { label: "Infants (max 2)", val: infants, set: setInfants, min: 0, max: Math.min(2, roomType?.maxInfants ?? 2) },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{r.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button type="button" onClick={() => r.set(Math.max(r.min, r.val - 1))}
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center" }}>{r.val}</span>
                  <button type="button" onClick={() => r.set(Math.min(r.max, r.val + 1))}
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
              </div>
            ))}
            {roomType && (
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                Room occupancy: {adults + cwb} beds used of {roomType.maxAdults} max
              </p>
            )}
          </div>

          {/* Step 3: Traveller Details */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>3. Traveller Details</h3>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Scan passport for auto-fill, or enter manually. Names must match passport exactly.</p>
            {travellers.map((t, i) => (
              <TravellerCard key={`${t.travellerType}-${i}`} t={t} idx={i} label={travellerLabels[i]} onChange={u => updateTraveller(i, u)} />
            ))}
          </div>

          {/* Special Requests */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 22px", marginBottom: 20 }}>
            <label style={{ ...LBL, marginBottom: 8, display: "block" }}>Special Requests (optional)</label>
            <textarea style={{ ...INP, resize: "vertical", minHeight: 80 }} value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Wheelchair access, dietary requirements, room preferences…" />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={submitting}
            style={{ width: "100%", padding: "14px", background: submitting ? "#94a3b8" : "#0E2A26", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(14,42,38,0.2)" }}>
            {submitting ? "Submitting…" : "Confirm Booking Request →"}
          </button>
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>Our team will contact you within 24 hours to confirm and process payment.</p>
        </form>

        {/* RIGHT — Summary */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
            {pkg?.imageUrl && (
              <div style={{ position: "relative", height: 180 }}>
                <Image src={pkg.imageUrl} alt={pkg.name ?? ""} fill style={{ objectFit: "cover" }} />
              </div>
            )}
            <div style={{ padding: "18px 20px" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, margin: "0 0 4px", color: "#0f172a" }}>{pkg?.name ?? "Loading…"}</h3>
              {roomType && <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>{roomType.roomType}</p>}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                {adults > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{adults} Adult{adults > 1 ? "s" : ""}</span><span>PKR {((roomType?.pricePerPersonPkr ?? 0) * adults).toLocaleString()}</span></div>}
                {cwb > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{cwb} Child (bed)</span><span>PKR {((roomType?.pricePerChildWithBedPkr ?? 0) * cwb).toLocaleString()}</span></div>}
                {cwob > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{cwob} Child (no bed)</span><span>PKR {((roomType?.pricePerChildWithoutBedPkr ?? 0) * cwob).toLocaleString()}</span></div>}
                {infants > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{infants} Infant{infants > 1 ? "s" : ""}</span><span>PKR {((roomType?.pricePerInfantPkr ?? 0) * infants).toLocaleString()}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, paddingTop: 10, marginTop: 8, borderTop: "1px solid #f1f5f9", color: "#B8862E" }}>
                  <span>Total</span><span>PKR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function BookingFormPage() {
  return <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}><BookingFormInner /></Suspense>;
}
