"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  pricePerChildPkr: number;
  pricePerInfantPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
};

export default function AgentPackageBookingWidget({
  packageId,
  roomTypes,
  category,
}: {
  packageId: string;
  roomTypes: RoomType[];
  category: "umrah" | "tours";
}) {
  const { accessToken, refresh } = useAgentAuth();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(roomTypes[0]?.id ?? null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [sellPrice, setSellPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [travellers, setTravellers] = useState([{ fullName: "", passportNo: "", cnic: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selected = roomTypes.find((r) => r.id === selectedId) ?? null;

  const suggestedTotal = useMemo(
    () => (selected ? adults * selected.pricePerPersonPkr + children * selected.pricePerChildPkr + infants * selected.pricePerInfantPkr : 0),
    [selected, adults, children, infants]
  );

  const minInvalid = !!(selected?.minAdultsRequired && adults < selected.minAdultsRequired);

  function selectRoomType(rt: RoomType) {
    setSelectedId(rt.id);
    setAdults((a) => Math.min(Math.max(a, 1), rt.maxAdults));
    setInfants((i) => Math.min(i, rt.maxInfants));
    setSellPrice("");
  }

  function useSuggested() {
    setSellPrice(String(suggestedTotal));
  }

  function addTraveller() {
    setTravellers((t) => [...t, { fullName: "", passportNo: "", cnic: "" }]);
  }
  function updateTraveller(i: number, patch: Partial<{ fullName: string; passportNo: string; cnic: string }>) {
    setTravellers((t) => t.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeTraveller(i: number) {
    setTravellers((t) => (t.length > 1 ? t.filter((_, idx) => idx !== i) : t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) return;

    const price = Number(sellPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter the price you're charging the customer.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }
    const validTravellers = travellers.filter((t) => t.fullName.trim());
    if (category === "umrah" && validTravellers.length === 0) {
      setError("Add at least one passenger's full name for Umrah bookings.");
      return;
    }

    setSubmitting(true);
    const res = await agentFetch("/api/agent/bookings", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: category,
        packageId,
        roomType: selected.roomType,
        adults,
        children,
        infants,
        sellPrice: price,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        travellers: validTravellers,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create booking.");
      return;
    }
    router.push("/agent/bookings");
  }

  if (roomTypes.length === 0) {
    return <p className="etd">No room pricing set up for this package yet — ask admin to add it.</p>;
  }

  return (
    <div className="ap-card">
      <div className="ap-ch"><h3>Book This Package</h3></div>
      <div style={{ padding: "16px 18px" }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Select Room Type</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
          {roomTypes.map((rt) => (
            <button
              key={rt.id}
              type="button"
              onClick={() => selectRoomType(rt)}
              className="ap-card"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                border: selectedId === rt.id ? "2px solid var(--gold)" : "1px solid var(--bdr)",
                margin: 0,
                cursor: "pointer",
              }}
            >
              <p style={{ fontWeight: 600, fontSize: 12.5 }}>{rt.roomType}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>Rs. {rt.pricePerPersonPkr.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}> /person</span></p>
              <p style={{ fontSize: 10, color: "var(--muted)" }}>Up to {rt.maxAdults} adults{rt.maxInfants > 0 ? `, ${rt.maxInfants} infants` : ""}</p>
              {rt.minAdultsRequired && <p style={{ fontSize: 10, color: "var(--muted)" }}>Min {rt.minAdultsRequired} adults</p>}
            </button>
          ))}
        </div>

        {selected && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Adults</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => setAdults((a) => Math.max(1, a - 1))} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>−</button>
                  <span style={{ minWidth: 20, textAlign: "center" }}>{adults}</span>
                  <button type="button" onClick={() => setAdults((a) => Math.min(selected.maxAdults, a + 1))} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>+</button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Children</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => setChildren((c) => Math.max(0, c - 1))} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>−</button>
                  <span style={{ minWidth: 20, textAlign: "center" }}>{children}</span>
                  <button type="button" onClick={() => setChildren((c) => c + 1)} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>+</button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Infants</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => setInfants((i) => Math.max(0, i - 1))} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>−</button>
                  <span style={{ minWidth: 20, textAlign: "center" }}>{infants}</span>
                  <button type="button" onClick={() => setInfants((i) => Math.min(selected.maxInfants, i + 1))} className="ap-btn ap-btn-ghost" style={{ padding: "4px 10px" }}>+</button>
                </div>
              </div>
            </div>
            {minInvalid && <p style={{ color: "var(--red)", fontSize: 11, marginBottom: 10 }}>{selected.roomType} requires at least {selected.minAdultsRequired} adults.</p>}

            <div style={{ background: "var(--bg)", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Suggested total (from room pricing)</span>
                <strong>Rs. {suggestedTotal.toLocaleString()}</strong>
              </div>
              <button type="button" onClick={useSuggested} className="ap-btn ap-btn-ghost" style={{ marginTop: 8, fontSize: 11, padding: "4px 10px" }}>
                Use this as sell price
              </button>
            </div>

            <div className="ap-field" style={{ marginBottom: 16, maxWidth: 260 }}>
              <label>Price to Charge Customer (PKR)</label>
              <input type="number" min={1} required value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
            </div>

            <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: 14, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Customer Details</p>
              <div className="ap-field" style={{ marginBottom: 10 }}>
                <label>Full Name</label>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="ap-field">
                  <label>Phone</label>
                  <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div className="ap-field">
                  <label>Email (optional)</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: 14, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                Passenger Details {category === "umrah" && <span style={{ color: "var(--red)" }}>*</span>}
              </p>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
                {category === "umrah" ? "Required — full name of every traveller, as on passport." : "Optional — helps speed up documentation."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {travellers.map((t, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
                    <input
                      required={category === "umrah"}
                      placeholder={`Traveller ${i + 1} — Full Name`}
                      value={t.fullName}
                      onChange={(e) => updateTraveller(i, { fullName: e.target.value })}
                      style={{ padding: "8px 10px", border: "1.5px solid var(--bdr)", borderRadius: 8, fontSize: 13 }}
                    />
                    <input
                      placeholder="Passport No."
                      value={t.passportNo}
                      onChange={(e) => updateTraveller(i, { passportNo: e.target.value })}
                      style={{ padding: "8px 10px", border: "1.5px solid var(--bdr)", borderRadius: 8, fontSize: 13 }}
                    />
                    <input
                      placeholder="CNIC"
                      value={t.cnic}
                      onChange={(e) => updateTraveller(i, { cnic: e.target.value })}
                      style={{ padding: "8px 10px", border: "1.5px solid var(--bdr)", borderRadius: 8, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeTraveller(i)}
                      disabled={travellers.length <= 1}
                      className="ap-btn ap-btn-ghost"
                      style={{ padding: "8px 10px", opacity: travellers.length <= 1 ? 0.4 : 1 }}
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addTraveller} className="ap-btn ap-btn-ghost" style={{ marginTop: 10 }}>
                + Add Traveller
              </button>
            </div>

            {error && (
              <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="ap-btn ap-btn-gold">
              {submitting ? "Creating…" : "Create Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
