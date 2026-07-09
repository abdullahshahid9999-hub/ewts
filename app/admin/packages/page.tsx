"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import PackageRoomTypesManager from "@/components/PackageRoomTypesManager";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
};

type ItineraryStep = { title: string; details: string; images: string };

type Package = {
  id: string;
  category: string;
  name: string;
  slug: string | null;
  duration: string | null;
  price: string | null;
  destination: string | null;
  departureCity: string | null;
  tier: string | null;
  includes: string | null;
  excludes: string | null;
  itinerary: unknown;
  imageUrl: string | null;
  featured: boolean;
  status: string;
  roomTypes: RoomType[];
};

const emptyForm = {
  category: "umrah", name: "", slug: "", duration: "", price: "", destination: "",
  departureCity: "", tier: "", includes: "", excludes: "", featured: false, status: "active",
};

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function itineraryFromPackage(pkg: Package): ItineraryStep[] {
  if (!Array.isArray(pkg.itinerary)) return [];
  return (pkg.itinerary as { title?: string; details?: string[]; images?: string[] }[]).map((s) => ({
    title: s.title ?? "",
    details: (s.details ?? []).join("\n"),
    images: (s.images ?? []).join(", "),
  }));
}

function PackagesInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/packages");
    const data = await res.json().catch(() => ({}));
    setPackages(data.packages ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    setForm({
      category: pkg.category, name: pkg.name, slug: pkg.slug ?? "", duration: pkg.duration ?? "",
      price: pkg.price ?? "", destination: pkg.destination ?? "", departureCity: pkg.departureCity ?? "",
      tier: pkg.tier ?? "", includes: pkg.includes ?? "", excludes: pkg.excludes ?? "",
      featured: pkg.featured, status: pkg.status,
    });
    setItinerary(itineraryFromPackage(pkg));
    setFile(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setItinerary([]);
    setFile(null);
    setError(null);
  }

  function addItineraryStep() {
    setItinerary((s) => [...s, { title: "", details: "", images: "" }]);
  }

  function updateItineraryStep(i: number, patch: Partial<ItineraryStep>) {
    setItinerary((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)));
  }

  function removeItineraryStep(i: number) {
    setItinerary((s) => s.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);

    const body = new FormData();
    body.set("category", form.category);
    body.set("name", form.name);
    if (form.slug) body.set("slug", form.slug);
    body.set("duration", form.duration);
    body.set("price", form.price);
    body.set("destination", form.destination);
    body.set("departureCity", form.departureCity);
    body.set("tier", form.tier);
    body.set("includes", form.includes);
    body.set("excludes", form.excludes);
    body.set("featured", String(form.featured));
    body.set("status", form.status);
    if (file) body.set("image", await compressImage(file));

    const itineraryPayload = itinerary
      .filter((s) => s.title.trim())
      .map((s) => ({
        title: s.title.trim(),
        details: s.details.split("\n").map((d) => d.trim()).filter(Boolean),
        images: s.images.split(",").map((u) => u.trim()).filter(Boolean),
      }));
    if (itineraryPayload.length > 0) body.set("itinerary", JSON.stringify(itineraryPayload));

    const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save package."); return; }
    if (!editingId) {
      // Jump straight into editing the new package so room types can be
      // added immediately — they need a real packageId to attach to.
      setEditingId(data.package.id);
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package? This also deletes its room types.")) return;
    await adminFetch(`/api/admin/packages/${id}`, accessToken, refresh, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  const editingPackage = packages.find((p) => p.id === editingId) ?? null;

  return (
    <>
      <div className="adp-ph">
        <div><h2>Package <em>Management</em></h2><p>Umrah &amp; tour packages, room pricing, and itineraries</p></div>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Package" : "New Package"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="umrah">Umrah</option>
              <option value="tours">Tours</option>
            </select>
          </div>
          <div>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Slug (URL — /{form.category}/…)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                placeholder="auto-generated-from-name"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="adp-btn adp-btn-t"
                onClick={() => setForm((f) => ({ ...f, slug: slugify(f.name) }))}
                disabled={!form.name.trim()}
              >
                Generate from name
              </button>
            </div>
          </div>
          <div>
            <label>Duration</label>
            <input placeholder="e.g. 10 Days" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div>
            <label>Price (listing display)</label>
            <input placeholder="e.g. PKR 250,000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <label>Destination</label>
            <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
          </div>
          <div>
            <label>Departure City</label>
            <input placeholder="e.g. Lahore" value={form.departureCity} onChange={(e) => setForm((f) => ({ ...f, departureCity: e.target.value }))} />
          </div>
          <div>
            <label>Tier</label>
            <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
              <option value="">— None —</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PLATINUM">Platinum</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>What&apos;s Included (one per line)</label>
            <textarea rows={3} value={form.includes} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Not Included (one per line)</label>
            <textarea rows={3} value={form.excludes} onChange={(e) => setForm((f) => ({ ...f, excludes: e.target.value }))} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} style={{ width: "auto" }} />
            Featured on homepage
          </div>
          <div>
            <label>Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* ITINERARY EDITOR */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Itinerary Steps</label>
            <div style={{ display: "grid", gap: "10px" }}>
              {itinerary.map((step, i) => (
                <div key={i} style={{ border: "1px solid var(--a-border2)", borderRadius: "8px", padding: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      placeholder={`Step ${i + 1} title (e.g. Outbound Flight)`}
                      value={step.title}
                      onChange={(e) => updateItineraryStep(i, { title: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={() => removeItineraryStep(i)} className="adp-btn adp-btn-r">Remove</button>
                  </div>
                  <textarea
                    placeholder="Details, one bullet per line"
                    rows={3}
                    value={step.details}
                    onChange={(e) => updateItineraryStep(i, { details: e.target.value })}
                    style={{ marginBottom: "6px" }}
                  />
                  <input
                    placeholder="Image URLs, comma-separated (optional)"
                    value={step.images}
                    onChange={(e) => updateItineraryStep(i, { images: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addItineraryStep} className="adp-btn adp-btn-t" style={{ marginTop: "8px" }}>
              + Add Itinerary Step
            </button>
          </div>

          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">
              {submitting ? "Saving…" : editingId ? "Update Package" : "Create Package"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel / New Package</button>}
          </div>
        </form>
      </div>

      {/* ROOM TYPES — only once a package exists to attach them to */}
      {editingPackage && (
        <PackageRoomTypesManager
          packageId={editingPackage.id}
          roomTypes={editingPackage.roomTypes}
          accessToken={accessToken}
          refresh={refresh}
          onChange={load}
        />
      )}

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : packages.length === 0 ? (
            <p className="etd">No packages yet.</p>
          ) : (
            <table className="adp-table">
              <thead><tr><th>Name</th><th>Category</th><th>Slug</th><th>Room Types</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}{p.featured ? " ★" : ""}</strong></td>
                    <td className="capitalize">{p.category}</td>
                    <td>{p.slug ?? <span style={{ color: "var(--a-dim)" }}>none</span>}</td>
                    <td>{p.roomTypes.length}</td>
                    <td><span className={`adp-pill adp-p-${p.status}`}>{p.status}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEdit(p)} className="adp-btn adp-btn-s">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="adp-btn adp-btn-r">Delete</button>
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

export default function AdminPackagesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <PackagesInner />
      </AdminShell>
    </AdminGuard>
  );
}
