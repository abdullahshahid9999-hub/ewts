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

// Per-room state: only the fields that vary per room
type RowState = {
  id: string | null;
  perPerson: string;
  perChildWithBed: string;
  slots: string;
  dirty: boolean;
  saving: boolean;
};

function emptyRow(): RowState {
  return { id: null, perPerson: "", perChildWithBed: "0", slots: "", dirty: false, saving: false };
}

function rowFromRt(rt: RoomType): RowState {
  return {
    id: rt.id,
    perPerson: String(rt.pricePerPersonPkr),
    perChildWithBed: String(rt.pricePerChildWithBedPkr ?? rt.pricePerChildPkr ?? 0),
    slots: rt.availableSlots != null ? String(rt.availableSlots) : "",
    dirty: false,
    saving: false,
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
  function buildRows(): Record<CanonicalKey, RowState> {
    const result = {} as Record<CanonicalKey, RowState>;
    for (const c of CANONICAL) {
      const existing = roomTypes.find((rt) => matchCanonical(rt) === c.key);
      result[c.key] = existing ? rowFromRt(existing) : emptyRow();
    }
    return result;
  }

  // Derive initial global values from the first saved room type that has them
  function initGlobal(field: "pricePerChildWithoutBedPkr" | "pricePerInfantPkr"): string {
    const first = roomTypes.find((rt) => matchCanonical(rt) !== null);
    return first ? String(first[field] ?? 0) : "0";
  }

  const [rows, setRows] = useState<Record<CanonicalKey, RowState>>(buildRows);
  const [globalChildWithoutBed, setGlobalChildWithoutBed] = useState(() => initGlobal("pricePerChildWithoutBedPkr"));
  const [globalInfant, setGlobalInfant] = useState(() => initGlobal("pricePerInfantPkr"));
  const [globalDirty, setGlobalDirty] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState(false);

  const customRts = roomTypes.filter((rt) => !matchCanonical(rt));

  function updateRow(key: CanonicalKey, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [key]: { ...r[key], ...patch, dirty: true } }));
  }

  async function saveRow(key: CanonicalKey) {
    const c = CANONICAL.find((x) => x.key === key)!;
    const row = rows[key];
    const price = Number(row.perPerson);

    if (!price || price <= 0) {
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
      pricePerChildWithoutBedPkr: Number(globalChildWithoutBed || 0),
      pricePerInfantPkr: Number(globalInfant || 0),
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

  // Save global prices across all existing room types at once
  async function saveGlobalPrices() {
    setGlobalSaving(true);
    setGlobalError(null);
    setGlobalSuccess(false);
    const savedIds = CANONICAL.map((c) => rows[c.key].id).filter(Boolean) as string[];
    if (savedIds.length === 0) {
      setGlobalError("No room types saved yet — add at least one room type first.");
      setGlobalSaving(false);
      return;
    }
    try {
      await Promise.all(
        savedIds.map((id) =>
          adminFetch(`/api/admin/packages/${packageId}/room-types/${id}`, accessToken, refresh, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pricePerChildWithoutBedPkr: Number(globalChildWithoutBed || 0),
              pricePerInfantPkr: Number(globalInfant || 0),
            }),
          })
        )
      );
      setGlobalDirty(false);
      setGlobalSuccess(true);
      setTimeout(() => setGlobalSuccess(false), 3000);
      onChange();
    } catch {
      setGlobalError("Failed to update global prices.");
    }
    setGlobalSaving(false);
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

        {/* ── GLOBAL PRICES ── */}
        <div style={{
          background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 10,
          padding: "14px 16px", marginBottom: 18,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>
            🌐 Global Prices — same for ALL room types
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 4 }}>
                👶 Child WITHOUT Bed
              </label>
              <input
                type="number" placeholder="0"
                value={globalChildWithoutBed}
                onChange={e => { setGlobalChildWithoutBed(e.target.value); setGlobalDirty(true); setGlobalSuccess(false); }}
                style={{ width: "100%" }}
              />
              <span style={{ fontSize: 9, color: "#64748b" }}>Sleeps with parents, no extra bed</span>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 4 }}>
                🍼 Infant (lap child)
              </label>
              <input
                type="number" placeholder="0"
                value={globalInfant}
                onChange={e => { setGlobalInfant(e.target.value); setGlobalDirty(true); setGlobalSuccess(false); }}
                style={{ width: "100%" }}
              />
              <span style={{ fontSize: 9, color: "#64748b" }}>Under 2 years, no seat</span>
            </div>
            <button
              type="button"
              onClick={saveGlobalPrices}
              disabled={globalSaving || !globalDirty}
              className="adp-btn adp-btn-b"
              style={{ fontSize: 11, padding: "8px 16px", opacity: (!globalDirty && !globalSaving) ? 0.4 : 1, whiteSpace: "nowrap" }}
            >
              {globalSaving ? "Saving…" : globalSuccess ? "✓ Saved" : "Save Global"}
            </button>
          </div>
          {globalError && <p style={{ color: "var(--a-red)", fontSize: 11, marginTop: 8 }}>{globalError}</p>}
        </div>

        {/* ── PER-ROOM TABLE ── */}
        <p style={{ fontSize: 11, color: "var(--a-dim)", marginBottom: 10 }}>
          Per-room prices — Adult &amp; Child With Bed vary by room. Leave Adult price blank to remove that room type.
        </p>

        <div style={{ border: "1px solid var(--a-border)", borderRadius: 8, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "160px 1fr 1fr 90px 70px",
            background: "#f8fafc", borderBottom: "1px solid var(--a-border)",
            padding: "8px 14px", gap: 8,
          }}>
            {["Room Type", "Price / Adult ★", "Child WITH Bed", "Slots", ""].map((h) => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--a-dim)" }}>{h}</span>
            ))}
          </div>

          {CANONICAL.map((c, i) => {
            const row = rows[c.key];
            const hasPrice = Number(row.perPerson) > 0;
            const isLast = i === CANONICAL.length - 1;
            return (
              <div key={c.key} style={{
                display: "grid", gridTemplateColumns: "160px 1fr 1fr 90px 70px",
                gap: 8, alignItems: "center",
                padding: "10px 14px",
                borderBottom: isLast ? "none" : "1px solid var(--a-border)",
                background: hasPrice ? "#fff" : "#fafafa",
              }}>
                {/* Label */}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{c.label}</span>
                  <span style={{
                    fontSize: 9, display: "block",
                    color: row.id ? "var(--a-green)" : "#94a3b8",
                  }}>
                    {row.id ? "✓ saved" : "not offered"}
                  </span>
                </div>

                {/* Adult price */}
                <input
                  type="number" placeholder="e.g. 150000"
                  value={row.perPerson}
                  onChange={e => updateRow(c.key, { perPerson: e.target.value })}
                  style={{ width: "100%" }}
                />

                {/* Child with bed */}
                <input
                  type="number" placeholder="0"
                  value={row.perChildWithBed}
                  onChange={e => updateRow(c.key, { perChildWithBed: e.target.value })}
                  disabled={!hasPrice}
                  style={{ width: "100%", opacity: hasPrice ? 1 : 0.35 }}
                />

                {/* Slots */}
                <input
                  type="number" placeholder="∞"
                  value={row.slots}
                  onChange={e => updateRow(c.key, { slots: e.target.value })}
                  disabled={!hasPrice}
                  style={{ width: "100%", opacity: hasPrice ? 1 : 0.35 }}
                />

                {/* Save button */}
                <button
                  type="button"
                  onClick={() => saveRow(c.key)}
                  disabled={row.saving || !row.dirty}
                  className="adp-btn adp-btn-g"
                  style={{ fontSize: 11, padding: "6px 10px", opacity: (!row.dirty && !row.saving) ? 0.35 : 1, whiteSpace: "nowrap" }}
                >
                  {row.saving ? "…" : row.id && !Number(row.perPerson) ? "Remove" : "Save"}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── CUSTOM ROOM TYPES ── */}
        {customRts.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--a-dim)", marginBottom: 8 }}>
              Custom room types (non-standard)
            </p>
            <table className="adp-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Name</th><th>Adult</th><th>Child w/ Bed</th><th>Child w/o Bed</th>
                  <th>Infant</th><th>Max</th><th>Slots</th><th></th>
                </tr>
              </thead>
              <tbody>
                {customRts.map((rt) => (
                  <tr key={rt.id}>
                    <td><strong>{rt.roomType}</strong></td>
                    <td>Rs. {rt.pricePerPersonPkr.toLocaleString()}</td>
                    <td>Rs. {(rt.pricePerChildWithBedPkr ?? rt.pricePerChildPkr ?? 0).toLocaleString()}</td>
                    <td>Rs. {(rt.pricePerChildWithoutBedPkr ?? 0).toLocaleString()}</td>
                    <td>Rs. {rt.pricePerInfantPkr.toLocaleString()}</td>
                    <td>{rt.maxAdults}</td>
                    <td>{rt.availableSlots ?? "∞"}</td>
                    <td>
                      <button onClick={() => handleDeleteCustom(rt.id)} className="adp-btn adp-btn-r" style={{ fontSize: 11 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
