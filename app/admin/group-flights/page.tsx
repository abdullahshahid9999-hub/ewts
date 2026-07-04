"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type GroupFlight = {
  id: string;
  airline: string;
  route: string;
  price: string;
  seats: number;
  status: string;
};

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

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.airline.trim() || !form.route.trim() || !form.price.trim()) {
      setError("Airline, route, and price are required.");
      return;
    }
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Group Flights</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-[var(--bdr)] bg-white p-6 sm:grid-cols-2">
        <input placeholder="Airline" required value={form.airline} onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Route (e.g. LHE-JED)" required value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Price" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Departure date" value={form.depDate} onChange={(e) => setForm((f) => ({ ...f, depDate: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input type="number" placeholder="Seats" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />

        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" disabled={submitting} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {submitting ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-[var(--bdr)] px-4 py-2 text-sm">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No group flights yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr><th className="px-4 py-3">Airline</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Seats</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{f.airline}</td>
                  <td className="px-4 py-3">{f.route}</td>
                  <td className="px-4 py-3">{f.price}</td>
                  <td className="px-4 py-3">{f.seats}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(f.id);
                        setForm({ airline: f.airline, route: f.route, price: f.price, depDate: "", seats: String(f.seats), status: f.status });
                        setFile(null);
                      }}
                      className="text-[var(--navy)] underline"
                    >Edit</button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-700 underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminGroupFlightsPage() {
  return (
    <AdminGuard>
      <GroupFlightsInner />
    </AdminGuard>
  );
}
