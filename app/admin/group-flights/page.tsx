"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type GroupFlight = { id: string; airline: string; route: string; price: string; seats: number; status: string };

const emptyForm = { airline: "", route: "", price: "", depDate: "", seats: "0", status: "active" };

function GroupFlightsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems] = useState<GroupFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
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

  function resetForm() { setEditingId(null); setForm(emptyForm); setFile(null); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.airline.trim() || !form.route.trim() || !form.price.trim()) { setError("Airline, route, and price are required."); return; }
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.set(k, v));
    if (file) body.set("airlineLogo", await compressImage(file));

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
      <div className="adp-ph"><div><h2>Group <em>Flights</em></h2><p>Group ticket listings shown on the public site</p></div></div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Flight" : "New Flight"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div><label>Airline</label><input required value={form.airline} onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value }))} /></div>
          <div><label>Route</label><input required placeholder="e.g. LHE-JED" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} /></div>
          <div><label>Price</label><input required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
          <div><label>Departure Date</label><input value={form.depDate} onChange={(e) => setForm((f) => ({ ...f, depDate: e.target.value }))} /></div>
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
              <thead><tr><th>Airline</th><th>Route</th><th>Price</th><th>Seats</th><th></th></tr></thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.airline}</strong></td>
                    <td>{f.route}</td>
                    <td>{f.price}</td>
                    <td>{f.seats}</td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => { setEditingId(f.id); setForm({ airline: f.airline, route: f.route, price: f.price, depDate: "", seats: String(f.seats), status: f.status }); setFile(null); }}
                        className="adp-btn adp-btn-s"
                      >Edit</button>
                      <button onClick={() => handleDelete(f.id)} className="adp-btn adp-btn-r">Delete</button>
                    </td>
                  </tr>
                ))}
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
