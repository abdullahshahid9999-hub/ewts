"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import PackageRoomTypesManager from "@/components/PackageRoomTypesManager";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type RoomType = {
  id: string; roomType: string; pricePerPersonPkr: number; pricePerInfantPkr: number;
  pricePerChildPkr: number; pricePerChildWithBedPkr: number; pricePerChildWithoutBedPkr: number;
  maxAdults: number; maxInfants: number; minAdultsRequired: number | null; availableSlots: number | null;
};
type Package = {
  id: string; category: string; name: string; slug: string | null; status: string;
  featured: boolean; price: string | null; roomTypes: RoomType[];
  _count?: { bookings: number };
};

function PackagesInner() {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoomPkgId, setEditingRoomPkgId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/packages", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setPackages(data.packages ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    await adminFetch(`/api/admin/packages/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  async function handleDuplicate(id: string) {
    const res = await adminFetch(`/api/admin/packages/${id}/duplicate`, accessToken, refresh, { method: "POST" });
    if (res?.ok) load();
    else alert("Duplicate failed.");
  }

  const editingPackage = packages.find(p => p.id === editingRoomPkgId) ?? null;

  return (
    <>
      <div className="adp-ph" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2>Package <em>Management</em></h2>
          <p>Umrah &amp; tour packages, room pricing, and itineraries</p>
        </div>
        <button onClick={() => router.push("/admin/packages/new")} className="adp-btn adp-btn-g" style={{ fontSize: 13, padding: "8px 20px" }}>
          + New Package
        </button>
      </div>

      {/* Room Types Manager — shown when Edit is clicked */}
      {editingPackage && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setEditingRoomPkgId(null)} className="adp-btn adp-btn-t" style={{ marginBottom: 10, fontSize: 12 }}>
            ← Back to list
          </button>
          <PackageRoomTypesManager
            packageId={editingPackage.id}
            roomTypes={editingPackage.roomTypes}
            accessToken={accessToken}
            refresh={refresh}
            onChange={load}
          />
        </div>
      )}

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : packages.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--a-dim)" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🌙</p>
              <p style={{ marginBottom: 12 }}>No packages yet. Create your first one.</p>
              <button onClick={() => router.push("/admin/packages/new")} className="adp-btn adp-btn-g">+ New Package</button>
            </div>
          ) : (
            <table className="adp-table">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Slug</th><th>Rooms</th><th>Bookings</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}{p.featured ? " ★" : ""}</strong></td>
                    <td className="capitalize">{p.category}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.slug ?? <span style={{ color: "var(--a-dim)" }}>none</span>}</td>
                    <td>{p.roomTypes.length}</td>
                    <td style={{ fontWeight: 700, color: (p._count?.bookings ?? 0) > 0 ? "var(--a-green)" : "var(--a-dim)" }}>{p._count?.bookings ?? 0}</td>
                    <td><span className={`adp-pill adp-p-${p.status}`}>{p.status}</span></td>
                    <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => router.push(`/admin/packages/${p.id}/edit`)} className="adp-btn adp-btn-s">Edit</button>
                      <button onClick={() => setEditingRoomPkgId(editingRoomPkgId === p.id ? null : p.id)} className="adp-btn adp-btn-s">
                        {editingRoomPkgId === p.id ? "Close Rooms" : "Rooms"}
                      </button>
                      <a href={`/admin/agent-bookings?packageId=${p.id}`} className="adp-btn adp-btn-s">Bookings</a>
                      <button onClick={() => handleDuplicate(p.id)} className="adp-btn" style={{ background: "var(--a-border)" }}>Duplicate</button>
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
