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
  pricePerInfantPkr: number;
  pricePerChildPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
};

type ItineraryStep = { title: string; details: string; images: string };
type FlightSector = { type: "Departure" | "Arrival" | "Sector"; city: string; date: string; time: string };
type DraftRoomType = {
  roomType: string;
  pricePerPersonPkr: string;
  pricePerInfantPkr: string;
  pricePerChildPkr: string;
  maxAdults: string;
  maxInfants: string;
  minAdultsRequired: string;
};

const emptyDraftRoomType: DraftRoomType = {
  roomType: "", pricePerPersonPkr: "", pricePerInfantPkr: "0", pricePerChildPkr: "0",
  maxAdults: "2", maxInfants: "0", minAdultsRequired: "",
};

// Common basis names offered as one-click presets — Quadruple is normally
// the cheapest per-head, which is why it ends up the display price.
const ROOM_BASIS_PRESETS = ["Quadruple Room", "Triple Room", "Double Room", "Single Room"];

function formatPkr(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

// Mirrors lib/packagePrice.ts's computeDisplayPrice on the server — the
// listing-card price is always the lowest per-person room price, shown
// live here as the admin fills in the room basis rows so there's no
// surprise about what will actually be saved.
function computeDisplayPriceFromDrafts(rows: DraftRoomType[]): string | null {
  const prices = rows
    .map((r) => Number(r.pricePerPersonPkr))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) return null;
  return formatPkr(Math.min(...prices));
}

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
  flightSectors: unknown;
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

const defaultSectors: FlightSector[] = [
  { type: "Departure", city: "", date: "", time: "" },
  { type: "Arrival", city: "", date: "", time: "" },
];

function sectorsFromPackage(pkg: Package): FlightSector[] {
  if (!Array.isArray(pkg.flightSectors) || pkg.flightSectors.length === 0) return defaultSectors;
  return pkg.flightSectors as FlightSector[];
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
  const [flightSectors, setFlightSectors] = useState<FlightSector[]>(defaultSectors);
  const [draftRoomTypes, setDraftRoomTypes] = useState<DraftRoomType[]>([{ ...emptyDraftRoomType }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/packages");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not load packages.");
      setPackages([]);
      setLoading(false);
      return;
    }
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
    setFlightSectors(sectorsFromPackage(pkg));
    setDraftRoomTypes([{ ...emptyDraftRoomType }]);
    setFile(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setItinerary([]);
    setFlightSectors(defaultSectors);
    setDraftRoomTypes([{ ...emptyDraftRoomType }]);
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

  function addSector() {
    setFlightSectors((s) => [...s, { type: "Sector", city: "", date: "", time: "" }]);
  }

  function addDraftRoomType() {
    setDraftRoomTypes((rows) => [...rows, { ...emptyDraftRoomType }]);
  }

  function updateDraftRoomType(i: number, patch: Partial<DraftRoomType>) {
    setDraftRoomTypes((rows) => rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function removeDraftRoomType(i: number) {
    setDraftRoomTypes((rows) => (rows.length <= 1 ? rows : rows.filter((_, idx) => idx !== i)));
  }

  function updateSector(i: number, patch: Partial<FlightSector>) {
    setFlightSectors((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));
  }

  function removeSector(i: number) {
    // Minimum 1 Departure + 1 Arrival required — "-" is disabled on those
    // two rows (index 0 and 1 in the default layout), only rows added via
    // "+" beyond that can be removed.
    if (flightSectors[i]?.type === "Departure" || flightSectors[i]?.type === "Arrival") return;
    setFlightSectors((s) => s.filter((_, idx) => idx !== i));
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
    // Price is derived from room basis pricing, not typed by hand — see
    // computeDisplayPriceFromDrafts above (create) / lib/packagePrice.ts
    // (server, and what keeps it in sync after every room-type edit).
    const derivedPrice = !editingId ? computeDisplayPriceFromDrafts(draftRoomTypes) : null;
    body.set("price", derivedPrice ?? form.price);
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

    const sectorsPayload = flightSectors.filter((sec) => sec.city.trim() && sec.date);
    if (sectorsPayload.length > 0) body.set("flightSectors", JSON.stringify(sectorsPayload));

    // Room basis division (Quad/Triple/Double/...) submitted inline with
    // package creation, instead of requiring a save-then-add-room-types
    // round trip. Only relevant on create — once a package exists, room
    // types are managed below via Room Types & Pricing (PackageRoomTypesManager).
    if (!editingId) {
      const roomTypesPayload = draftRoomTypes
        .filter((r) => r.roomType.trim() && Number(r.pricePerPersonPkr) > 0 && Number(r.maxAdults) >= 1)
        .map((r) => ({
          roomType: r.roomType.trim(),
          pricePerPersonPkr: Number(r.pricePerPersonPkr),
          pricePerInfantPkr: Number(r.pricePerInfantPkr || 0),
          pricePerChildPkr: Number(r.pricePerChildPkr || 0),
          maxAdults: Number(r.maxAdults),
          maxInfants: Number(r.maxInfants || 0),
          minAdultsRequired: r.minAdultsRequired ? Number(r.minAdultsRequired) : null,
        }));
      if (roomTypesPayload.length > 0) body.set("roomTypes", JSON.stringify(roomTypesPayload));
    }

    const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save package."); return; }
    if (!editingId) {
      // Jump straight into editing the new package so more room types can
      // be added/edited immediately — the ones just submitted are already
      // saved, this just switches to the "existing package" management view.
      setEditingId(data.package.id);
      setDraftRoomTypes([{ ...emptyDraftRoomType }]);
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
            <label>Price (listing display — auto-calculated)</label>
            <input
              readOnly
              disabled
              value={
                editingId
                  ? (form.price || "— set by adding room types below —")
                  : (computeDisplayPriceFromDrafts(draftRoomTypes) ?? "— add a room type below to set this —")
              }
              style={{ color: "var(--a-muted)", background: "rgba(0,0,0,0.03)", cursor: "not-allowed" }}
            />
            <p style={{ fontSize: "10.5px", color: "var(--a-dim)", marginTop: "4px" }}>
              This is always the lowest per-person room price below (usually Quad) — it's what
              shows on the package card. It updates automatically whenever room basis pricing
              changes, so it can't drift out of sync.
            </p>
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

          {/* FLIGHT SECTORS — minimum 1 Departure + 1 Arrival, "-" disabled on those two.
              Hidden for Umrah packages: those use a fixed Makkah/Madinah itinerary rather
              than per-package flight sectors, and the owner asked for this field to not
              appear at all when adding an Umrah package (not just be optional). */}
          {form.category !== "umrah" && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Flight Sectors (city, date &amp; time)</label>
            <div style={{ display: "grid", gap: "8px" }}>
              {flightSectors.map((sec, i) => {
                const locked = sec.type === "Departure" || sec.type === "Arrival";
                return (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ width: "80px", fontSize: "11px", fontWeight: 700, color: "var(--a-muted)" }}>
                      {sec.type}
                    </span>
                    <input
                      placeholder="City (e.g. LYP)"
                      value={sec.city}
                      onChange={(e) => updateSector(i, { city: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="date"
                      value={sec.date}
                      onChange={(e) => updateSector(i, { date: e.target.value })}
                      style={{ width: "150px" }}
                    />
                    <input
                      type="time"
                      value={sec.time}
                      onChange={(e) => updateSector(i, { time: e.target.value })}
                      style={{ width: "110px" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSector(i)}
                      disabled={locked}
                      className="adp-btn adp-btn-r"
                      style={{ opacity: locked ? 0.35 : 1, cursor: locked ? "not-allowed" : "pointer" }}
                    >
                      −
                    </button>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addSector} className="adp-btn adp-btn-t" style={{ marginTop: "8px" }}>
              + Add Sector
            </button>
          </div>
          )}

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

          {/* Room basis division — only shown while creating a new package.
              Once saved, this becomes the Room Types & Pricing manager below
              (which supports edit/delete individually). The lowest price
              entered here becomes the Price field above automatically. */}
          {!editingId && (
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Room Basis Division (Quad / Triple / Double / Single…)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                {draftRoomTypes.map((rt, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.3fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr auto",
                      gap: "8px",
                      alignItems: "end",
                      padding: "10px",
                      border: "1px solid var(--a-border)",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "9px" }}>Room Type</label>
                      <input
                        list="room-basis-presets"
                        placeholder="e.g. Quadruple Room"
                        value={rt.roomType}
                        onChange={(e) => updateDraftRoomType(i, { roomType: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px" }}>Price / Person (PKR)</label>
                      <input type="number" value={rt.pricePerPersonPkr} onChange={(e) => updateDraftRoomType(i, { pricePerPersonPkr: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px" }}>Price / Infant</label>
                      <input type="number" value={rt.pricePerInfantPkr} onChange={(e) => updateDraftRoomType(i, { pricePerInfantPkr: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px" }}>Price / Child</label>
                      <input type="number" value={rt.pricePerChildPkr} onChange={(e) => updateDraftRoomType(i, { pricePerChildPkr: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px" }}>Max Adults</label>
                      <input type="number" value={rt.maxAdults} onChange={(e) => updateDraftRoomType(i, { maxAdults: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px" }}>Max Infants</label>
                      <input type="number" value={rt.maxInfants} onChange={(e) => updateDraftRoomType(i, { maxInfants: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px" }}>Min Adults Req.</label>
                      <input
                        type="number"
                        placeholder="optional"
                        value={rt.minAdultsRequired}
                        onChange={(e) => updateDraftRoomType(i, { minAdultsRequired: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDraftRoomType(i)}
                      disabled={draftRoomTypes.length <= 1}
                      className="adp-btn adp-btn-r"
                      style={{ height: "34px" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <datalist id="room-basis-presets">
                {ROOM_BASIS_PRESETS.map((p) => <option key={p} value={p} />)}
              </datalist>
              <button type="button" onClick={addDraftRoomType} className="adp-btn adp-btn-t" style={{ marginTop: "8px" }}>
                + Add Another Room Basis
              </button>
              <p style={{ fontSize: "10.5px", color: "var(--a-dim)", marginTop: "6px" }}>
                Rows with no room type name or price are ignored on save. The display Price above
                always tracks whichever row here is lowest.
              </p>
            </div>
          )}

          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">
              {submitting ? "Saving…" : editingId ? "Update Package" : "Create Package"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel / New Package</button>}
          </div>
        </form>
      </div>

      {/* ROOM TYPES — always visible so it's never a mystery that pricing
          lives here, not in the "Price (listing display)" field above. */}
      {editingPackage ? (
        <PackageRoomTypesManager
          packageId={editingPackage.id}
          roomTypes={editingPackage.roomTypes}
          accessToken={accessToken}
          refresh={refresh}
          onChange={load}
        />
      ) : (
        <div className="adp-card">
          <div className="adp-ch"><h3>Room Types &amp; Pricing</h3></div>
          <p style={{ padding: "16px 18px", fontSize: "12.5px", color: "var(--a-muted)" }}>
            Add the room basis rows above (Quad/Triple/Double/…) and click <strong>Create Package</strong> —
            they&apos;ll be saved together with the package, and you can keep editing/adding more here afterward.
          </p>
        </div>
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
                      <a href={`/admin/agent-bookings?packageId=${p.id}`} className="adp-btn adp-btn-s">Bookings</a>
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
