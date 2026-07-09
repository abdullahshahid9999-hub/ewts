"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/adminAuthClient";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
};

const emptyRt = { roomType: "", pricePerPersonPkr: "", maxAdults: "2", maxInfants: "0", minAdultsRequired: "" };

export default function PackageRoomTypesManager({
  packageId,
  roomTypes,
  accessToken,
  refresh,
  onChange,
}: {
  packageId: string;
  roomTypes: RoomType[];
  accessToken: string | null;
  refresh: () => Promise<string | null>;
  onChange: () => void;
}) {
  const [form, setForm] = useState(emptyRt);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function startEdit(rt: RoomType) {
    setEditingId(rt.id);
    setForm({
      roomType: rt.roomType,
      pricePerPersonPkr: String(rt.pricePerPersonPkr),
      maxAdults: String(rt.maxAdults),
      maxInfants: String(rt.maxInfants),
      minAdultsRequired: rt.minAdultsRequired != null ? String(rt.minAdultsRequired) : "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyRt);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.roomType.trim() || !form.pricePerPersonPkr || !form.maxAdults) {
      setError("Room type, price, and max adults are required.");
      return;
    }
    setSubmitting(true);

    const payload = {
      roomType: form.roomType,
      pricePerPersonPkr: Number(form.pricePerPersonPkr),
      maxAdults: Number(form.maxAdults),
      maxInfants: Number(form.maxInfants || 0),
      minAdultsRequired: form.minAdultsRequired ? Number(form.minAdultsRequired) : null,
    };

    const url = editingId
      ? `/api/admin/packages/${packageId}/room-types/${editingId}`
      : `/api/admin/packages/${packageId}/room-types`;
    const res = await adminFetch(url, accessToken, refresh, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save room type."); return; }
    resetForm();
    onChange();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this room type?")) return;
    await adminFetch(`/api/admin/packages/${packageId}/room-types/${id}`, accessToken, refresh, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="adp-card">
      <div className="adp-ch"><h3>Room Types &amp; Pricing</h3></div>

      <div className="adp-tw">
        <table className="adp-table">
          <thead><tr><th>Room Type</th><th>Price/Person</th><th>Max Adults</th><th>Max Infants</th><th>Min Adults</th><th></th></tr></thead>
          <tbody>
            {roomTypes.length === 0 && (
              <tr><td colSpan={6} className="etd" style={{ textAlign: "center" }}>No room types yet — add one below.</td></tr>
            )}
            {roomTypes.map((rt) => (
              <tr key={rt.id}>
                <td><strong>{rt.roomType}</strong></td>
                <td>Rs. {rt.pricePerPersonPkr.toLocaleString()}</td>
                <td>{rt.maxAdults}</td>
                <td>{rt.maxInfants}</td>
                <td>{rt.minAdultsRequired ?? "—"}</td>
                <td style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => startEdit(rt)} className="adp-btn adp-btn-s">Edit</button>
                  <button onClick={() => handleDelete(rt.id)} className="adp-btn adp-btn-r">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px", borderTop: "1px solid var(--a-border)" }}>
        <div><label>Room Type Name</label><input placeholder="e.g. Triple Room" value={form.roomType} onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))} /></div>
        <div><label>Price / Person (PKR)</label><input type="number" value={form.pricePerPersonPkr} onChange={(e) => setForm((f) => ({ ...f, pricePerPersonPkr: e.target.value }))} /></div>
        <div><label>Max Adults</label><input type="number" value={form.maxAdults} onChange={(e) => setForm((f) => ({ ...f, maxAdults: e.target.value }))} /></div>
        <div><label>Max Infants</label><input type="number" value={form.maxInfants} onChange={(e) => setForm((f) => ({ ...f, maxInfants: e.target.value }))} /></div>
        <div><label>Min Adults Required (optional)</label><input type="number" placeholder="e.g. 3 for shared rooms" value={form.minAdultsRequired} onChange={(e) => setForm((f) => ({ ...f, minAdultsRequired: e.target.value }))} /></div>

        {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
          <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">
            {submitting ? "Saving…" : editingId ? "Update Room Type" : "Add Room Type"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel</button>}
        </div>
      </form>
    </div>
  );
}
