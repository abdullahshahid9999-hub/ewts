"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";
import { legsFromFlight, type FlightLeg } from "@/lib/groupFlightLegs";

type GroupFlight = {
  id: string;
  flightNo: string | null;
  airline: string;
  route: string;
  depDate: string | null;
  depTime: string | null;
  arrTime: string | null;
  baggage: string | null;
  meal: string | null;
  region: string | null;
  tripType: string | null;
  price: string;
  seats: number;
  status: string;
  legs: unknown;
};

const emptyForm = {
  airline: "", route: "", price: "", depDate: "",
  baggage: "", meal: "Yes", region: "international", tripType: "oneway", seats: "0", status: "active",
};

const emptyLeg: FlightLeg = { flightNo: "", from: "", to: "", depTime: "", arrTime: "" };
const defaultLegs: FlightLeg[] = [{ ...emptyLeg }];

function GroupFlightsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems] = useState<GroupFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [legs, setLegs] = useState<FlightLeg[]>(defaultLegs);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/group-flights");
    const data = await res.json().catch(() => ({}));
    setItems(data.groupFlights ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() { setEditingId(null); setForm(emptyForm); setLegs(defaultLegs); setFile(null); setError(null); }

  function startEdit(f: GroupFlight) {
    setEditingId(f.id);
    setForm({
      airline: f.airline, route: f.route, price: f.price,
      depDate: f.depDate ?? "",
      baggage: f.baggage ?? "", meal: f.meal ?? "Yes", region: f.region ?? "international",
      tripType: f.tripType ?? "oneway", seats: String(f.seats), status: f.status,
    });
    setLegs(legsFromFlight(f));
    setFile(null);
  }

  function addLeg() {
    setLegs((l) => [...l, { ...emptyLeg }]);
  }

  function updateLeg(i: number, patch: Partial<FlightLeg>) {
    setLegs((l) => l.map((leg, idx) => (idx === i ? { ...leg, ...patch } : leg)));
  }

  function removeLeg(i: number) {
    // Minimum 1 leg required — "-" is disabled when it's the only row left.
    setLegs((l) => (l.length <= 1 ? l : l.filter((_, idx) => idx !== i)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.airline.trim() || !form.route.trim() || !form.price.trim()) { setError("Airline, route, and price are required."); return; }
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.set(k, v));
    if (file) body.set("airlineLogo", await compressImage(file));

    // At least one leg needs a flight number to be worth saving — empty
    // rows (from a stray "+ Add Leg") are dropped rather than persisted.
    const legsPayload = legs.filter((l) => l.flightNo.trim());
    if (legsPayload.length > 0) body.set("legs", JSON.stringify(legsPayload));

    const url = editingId ? `/api/admin/group-flights/${editingId}` : "/api/admin/group-flights";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flight?")) return;
    await adminFetch(`/api/admin/group-flights/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Group <em>Flights</em></h2><p>Group ticket listings shown on the public site &amp; agent portal</p></div></div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Flight" : "New Flight"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div><label>Airline</label><input required value={form.airline} onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value }))} /></div>
          <div><label>Route</label><input required placeholder="e.g. LAHORE→DUBAI" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} /></div>
          <div><label>Departure Date</label><input type="date" value={form.depDate} onChange={(e) => setForm((f) => ({ ...f, depDate: e.target.value }))} /></div>
          <div><label>Baggage</label><input placeholder="e.g. 20+7 KG" value={form.baggage} onChange={(e) => setForm((f) => ({ ...f, baggage: e.target.value }))} /></div>

          {/* LEGS — one row per flight leg. A direct flight is 1 row; a
              connecting flight (e.g. via Karachi) is 2+ rows. This whole
              option is still ONE bookable thing at ONE price/seats/date
              (set above) — legs are just its journey breakdown, shown
              stacked under a single "Book Now" in the agent portal.
              Minimum 1 leg — "-" disabled when it's the only row. */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Flight Legs (flight no., from/to city code &amp; times)</label>
            <div style={{ display: "grid", gap: "8px" }}>
              {legs.map((leg, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ width: "56px", fontSize: "11px", fontWeight: 700, color: "var(--a-muted)" }}>
                    Leg {i + 1}
                  </span>
                  <input
                    placeholder="Flight No. (e.g. EK-774)"
                    value={leg.flightNo}
                    onChange={(e) => updateLeg(i, { flightNo: e.target.value })}
                    style={{ flex: 1.2 }}
                  />
                  <input
                    placeholder="From (e.g. LHE)"
                    value={leg.from}
                    onChange={(e) => updateLeg(i, { from: e.target.value })}
                    style={{ width: "90px" }}
                  />
                  <input
                    placeholder="To (e.g. KHI)"
                    value={leg.to}
                    onChange={(e) => updateLeg(i, { to: e.target.value })}
                    style={{ width: "90px" }}
                  />
                  <input
                    type="time"
                    value={leg.depTime}
                    onChange={(e) => updateLeg(i, { depTime: e.target.value })}
                    style={{ width: "110px" }}
                  />
                  <input
                    type="time"
                    value={leg.arrTime}
                    onChange={(e) => updateLeg(i, { arrTime: e.target.value })}
                    style={{ width: "110px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeLeg(i)}
                    disabled={legs.length <= 1}
                    className="adp-btn adp-btn-r"
                    style={{ opacity: legs.length <= 1 ? 0.35 : 1, cursor: legs.length <= 1 ? "not-allowed" : "pointer" }}
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLeg} className="adp-btn adp-btn-t" style={{ marginTop: "8px" }}>
              + Add Connecting Leg
            </button>
          </div>
          <div>
            <label>Meal</label>
            <select value={form.meal} onChange={(e) => setForm((f) => ({ ...f, meal: e.target.value }))}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label>Region</label>
            <select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
              <option value="gulf">Gulf</option>
              <option value="ksa">KSA (Saudi Arabia)</option>
            </select>
          </div>
          <div>
            <label>Trip Type</label>
            <select value={form.tripType} onChange={(e) => setForm((f) => ({ ...f, tripType: e.target.value }))}>
              <option value="oneway">One-way</option>
              <option value="return">Return</option>
            </select>
          </div>
          <div><label>Price</label><input required placeholder="e.g. 80,000 PKR" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
          <div><label>Seats</label><input type="number" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} /></div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <div><label>Airline Logo</label><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>

          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">{submitting ? "Saving…" : editingId ? "Update" : "Create"}</button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? <p className="etd">Loading…</p> : items.length === 0 ? <p className="etd">No group flights yet.</p> : (
            <table className="adp-table">
              <thead><tr><th>Legs</th><th>Airline</th><th>Route</th><th>Date</th><th>Price</th><th>Seats</th><th></th></tr></thead>
              <tbody>
                {items.map((f) => {
                  const flightLegs = legsFromFlight(f);
                  return (
                    <tr key={f.id}>
                      <td>
                        {flightLegs.map((leg, i) => (
                          <div key={i} style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                            <strong>{leg.flightNo || "—"}</strong>
                            {(leg.from || leg.to) && ` ${leg.from}→${leg.to}`}
                            {(leg.depTime || leg.arrTime) && ` ${leg.depTime}-${leg.arrTime}`}
                          </div>
                        ))}
                      </td>
                      <td>{f.airline}</td>
                      <td>{f.route}</td>
                      <td>{f.depDate ?? "—"}</td>
                      <td>{f.price}</td>
                      <td>{f.seats}</td>
                      <td style={{ display: "flex", gap: "6px" }}>
                        <a href={`/admin/group-flights/${f.id}/bookings`} className="adp-btn adp-btn-s">Bookings</a>
                        <button onClick={() => startEdit(f)} className="adp-btn adp-btn-s">Edit</button>
                        <button onClick={() => handleDelete(f.id)} className="adp-btn adp-btn-r">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminGroupFlightsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <GroupFlightsInner />
      </AdminShell>
    </AdminGuard>
  );
}
