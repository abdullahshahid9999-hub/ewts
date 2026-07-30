"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Tier = { id: string; minTravellers: number; discountPercent: number };

function TiersInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [minTravellers, setMinTravellers] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/visa-discount-tiers", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setTiers(data.tiers ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function addTier(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await adminFetch("/api/admin/visa-discount-tiers", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minTravellers, discountPercent }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add tier."); return; }
    setMinTravellers("");
    setDiscountPercent("");
    load();
  }

  async function removeTier(id: string) {
    await adminFetch(`/api/admin/visa-discount-tiers/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="adp-ph">
        <div><h2>Visa <span>Group Discounts</span></h2><p>Applied automatically at submission based on total traveller count on a single application</p></div>
      </div>

      <div className="adp-card" style={{ maxWidth: 520, padding: 20, marginBottom: 20 }}>
        <form onSubmit={addTier} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Min. Travellers</label>
            <input type="number" min={1} required value={minTravellers} onChange={(e) => setMinTravellers(e.target.value)} style={{ width: 100 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Discount %</label>
            <input type="number" min={1} max={100} required value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} style={{ width: 100 }} />
          </div>
          <button type="submit" className="adp-btn adp-btn-g">+ Add Tier</button>
        </form>
        {error && <p style={{ color: "var(--a-red)", fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>

      <div className="adp-card" style={{ maxWidth: 520 }}>
        {loading ? (
          <p style={{ padding: 16 }}>Loading…</p>
        ) : tiers.length === 0 ? (
          <p style={{ padding: 16, color: "var(--a-muted)" }}>No discount tiers yet — every application is billed at full price.</p>
        ) : (
          <table className="adp-table">
            <thead><tr><th>Min. Travellers</th><th>Discount</th><th></th></tr></thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id}>
                  <td>{t.minTravellers}+</td>
                  <td>{t.discountPercent}%</td>
                  <td><button onClick={() => removeTier(t.id)} className="adp-btn adp-btn-r">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function VisaDiscountTiersPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <TiersInner />
      </AdminShell>
    </AdminGuard>
  );
}
