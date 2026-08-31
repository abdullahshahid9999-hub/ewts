"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/adminAuthClient";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  pricePerInfantPkr: number;
  pricePerChildPkr: number;
  pricePerChildWithBedPkr: number;
  pricePerChildWithoutBedPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
  availableSlots: number | null;
};

// The 4 canonical room types — matched by label prefix (case-insensitive)
const CANONICAL = [
  { key: "quad",    label: "Quad Room (4 pax)",   maxAdults: 4, maxInfants: 1 },
  { key: "triple",  label: "Triple Room (3 pax)",  maxAdults: 3, maxInfants: 1 },
  { key: "double",  label: "Double Room (2 pax)",  maxAdults: 2, maxInfants: 1 },
  { key: "sharing", label: "Sharing (6+ pax)",     maxAdults: 6, maxInfants: 0 },
] as const;

type CanonicalKey = typeof CANONICAL[number]["key"];

function matchCanonical(rt: RoomType): CanonicalKey | null {
  const n = rt.roomType.toLowerCase();
  if (n.includes("quad"))    return "quad";
  if (n.includes("triple"))  return "triple";
  if (n.includes("double"))  return "double";
  if (n.includes("sharing")) return "sharing";
  return null;
}

type RowState = {
  id: string | null;       // null = not yet saved
  perPerson: string;
  perChildWithBed: string;
  perChildWithoutBed: string;
  perInfant: string;
  slots: string;
  dirty: boolean;
  saving: boolean;
};

function emptyRow(): RowState {
  return { id: null, perPerson: "", perChildWithBed: "0", perChildWithoutBed: "0", perInfant: "0", slots: "", dirty: false, saving: false };
}

function rowFromRt(rt: RoomType): RowState {
  return {
    id: rt.id,
    perPerson: String(rt.pricePerPersonPkr),
    perChildWithBed: String(rt.pricePerChildWithBedPkr ?? rt.pricePerChildPkr ?? 0),
    perChildWithoutBed: String(rt.pricePerChildWithoutBedPkr ?? 0),
    perInfant: String(rt.pricePerInfantPkr ?? 0),
    slots: rt.availableSlots != null ? String(rt.availableSlots) : "",
    dirty: false, saving: false,
  };
}

export default function PackageRoomTypesManager({
  packageId, roomTypes, accessToken, refresh, onChange,
}: {
  packageId: string;
  roomTypes: RoomType[];
  accessToken: string | null;
  refresh: () => Promise<string | null>;
  onChange: () => void;
}) {
  // Build initial row state: 4 canonical rows, pre-filled if matching RT exists
  function buildRows(): Record<CanonicalKey, RowState> {
    const result = {} as Record<CanonicalKey, RowState>;
    for (const c of CANONICAL) {
      const existing = roomTypes.find((rt) => matchCanonical(rt) === c.key);
      result[c.key] = existing ? rowFromRt(existing) : emptyRow();
    }
    return result;
  }

  const [rows, setRows] = useState<Record<CanonicalKey, RowState>>(buildRows);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Unrecognized room types (custom, not matching any canonical key)
  const customRts = roomTypes.filter((rt) => !matchCanonical(rt));

  function updateRow(key: CanonicalKey, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [key]: { ...r[key], ...patch, dirty: true } }));
  }

  async function saveRow(key: CanonicalKey) {
    const c = CANONICAL.find((x) => x.key === key)!;
    const row = rows[key];
    const price = Number(row.perPerson);
    if (!price || price <= 0) {
      // No price = delete if exists, else skip
      if (row.id) {
        if (!confirm(`Remove ${c.label} from this package?`)) return;
        setRows((r) => ({ ...r, [key]: { ...r[key], saving: true } }));
        await adminFetch(`/api/admin/packages/${packageId}/room-types/${row.id}`, accessToken, refresh, { method: "DELETE" });
        setRows((r) => ({ ...r, [key]: { ...emptyRow(), dirty: false } }));
        onChange();
      }
      return;
    }

    setRows((r) => ({ ...r, [key]: { ...r[key], saving: true } }));
    const payload = {
      roomType: c.label,
      pricePerPersonPkr: price,
      pricePerChildPkr: Number(row.perChildWithBed || 0),
      pricePerChildWithBedPkr: Number(row.perChildWithBed || 0),
      pricePerChildWithoutBedPkr: Number(row.perChildWithoutBed || 0),
      pricePerInfantPkr: Number(row.perInfant || 0),
      maxAdults: c.maxAdults,
      maxInfants: c.maxInfants,
      minAdultsRequired: null,
      availableSlots: row.slots ? Number(row.slots) : null,
    };

    const url = row.id
      ? `/api/admin/packages/${packageId}/room-types/${row.id}`
      : `/api/admin/packages/${packageId}/room-types`;
    const res = await adminFetch(url, accessToken, refresh, {
      method: row.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRows((r) => ({ ...r, [key]: { ...r[key], saving: false } }));
      setGlobalError(data.error ?? "Could not save room type.");
      return;
    }
    const savedId: string = data.roomType?.id ?? row.id;
    setRows((r) => ({ ...r, [key]: { ...r[key], id: savedId, dirty: false, saving: false } }));
    setGlobalError(null);
    onChange();
  }

  async function handleDeleteCustom(id: string) {
    if (!confirm("Delete this room type?")) return;
    await adminFetch(`/api/admin/packages/${packageId}/room-types/${id}`, accessToken, refresh, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="adp-card">
      <div className="adp-ch"><h3>Room Types &amp; Pricing</h3></div>

      <div style={{ padding: "16px 18px" }}>
        <p style={{ fontSize: 11, color: "var(--a-dim)", marginBottom: 12 }}>
          Leave price blank to remove a room type. Changes save per-row — click <strong>Save</strong> on each row.
        </p>

        {/* Fixed 4 rows */}
        <div style={{ display: "grid", gap: 10 }}>
          {CANONICAL.map((c) => {
            const row = rows[c.key];
            const hasPrice = Number(row.perPerson) > 0;
            return (
              <div key={c.key} style={{
                display: "grid", gridTemplateColumns: "150px 1fr 1fr 1fr 1fr 100px auto",
                gap: 8, alignItems: "end", padding: "10px 12px",
                border: "1px solid var(--a-border)", borderRadius: 8,
                background: hasPrice ? "#fff" : "#f8fafc",
                opacity: hasPrice ? 1 : 0.75,
              }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700 }}>{c.label}</label>
                  {row.id && <span style={{ fontSize: 9, color: "var(--a-green)", display: "block" }}>✓ saved</span>}
                  {!row.id && <span style={{ fontSize: 9, color: "var(--a-dim)", display: "block" }}>not offered</span>}
                </div>
                <div>
                  <label style={{ fontSize: 9 }}>Price / Person *</label>
                  <input type="number" placeholder="e.g. 150000" value={row.perPerson}
                    onChange={(e) => updateRow(c.key, { perPerson: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 9 }}>Child WITH Bed</label>
                  <input type="number" placeholder="0" value={row.perChildWithBed}
                    onChange={(e) => updateRow(c.key, { perChildWithBed: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 9 }}>Child WITHOUT Bed</label>
                  <input type="number" placeholder="0" value={row.perChildWithoutBed}
                    onChange={(e) => updateRow(c.key, { perChildWithoutBed: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 9 }}>Price / Infant</label>
                  <input type="number" placeholder="0" value={row.perInfant}
                    onChange={(e) => updateRow(c.key, { perInfant: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 9 }}>Slots (blank=∞)</label>
                  <input type="number" placeholder="∞" value={row.slots}
                    onChange={(e) => updateRow(c.key, { slots: e.target.value })} />
                </div>
                <button
                  type="button"
                  onClick={() => saveRow(c.key)}
                  disabled={row.saving || !row.dirty}
                  className="adp-btn adp-btn-g"
                  style={{ fontSize: 11, padding: "6px 12px", opacity: (!row.dirty && !row.saving) ? 0.4 : 1 }}
                >
                  {row.saving ? "…" : row.id && !Number(row.perPerson) ? "Remove" : "Save"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom / legacy room types not matching canonical keys */}
        {customRts.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--a-dim)", marginBottom: 8 }}>Custom room types (not in standard set)</p>
            <table className="adp-table" style={{ fontSize: 12 }}>
              <thead><tr><th>Name</th><th>Price/Person</th><th>Child</th><th>Infant</th><th>Max</th><th>Slots</th><th></th></tr></thead>
              <tbody>
                {customRts.map((rt) => (
                  <tr key={rt.id}>
                    <td><strong>{rt.roomType}</strong></td>
                    <td>Rs. {rt.pricePerPersonPkr.toLocaleString()}</td>
                    <td>Rs. {(rt.pricePerChildWithBedPkr ?? rt.pricePerChildPkr ?? 0).toLocaleString()}</td>
                    <td>Rs. {rt.pricePerInfantPkr.toLocaleString()}</td>
                    <td>{rt.maxAdults}</td>
                    <td>{rt.availableSlots ?? "∞"}</td>
                    <td><button onClick={() => handleDeleteCustom(rt.id)} className="adp-btn adp-btn-r" style={{ fontSize: 11 }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {globalError && <p style={{ color: "var(--a-red)", fontSize: 12, marginTop: 10 }}>{globalError}</p>}
      </div>
    </div>
  );
}
