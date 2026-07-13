"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Application = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  travellers: number;
  totalPricePkr: number;
  status: string;
  createdAt: string;
  rate: { plan: { name: string; company: { name: string } } };
};

function InsuranceApplicationsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/insurance-applications", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setApps(data.applications ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    await adminFetch(`/api/admin/insurance-applications/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Insurance <em>Applications</em></h2><p>B2C insurance bookings from the public calculator</p></div></div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : apps.length === 0 ? (
            <p className="etd">No insurance applications yet.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr><th>Name</th><th>Contact</th><th>Plan</th><th>Travellers</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.fullName}</strong></td>
                    <td style={{ fontSize: 11 }}>{a.phone}<br />{a.email}</td>
                    <td>{a.rate.plan.company.name} — {a.rate.plan.name}</td>
                    <td>{a.travellers}</td>
                    <td>PKR {a.totalPricePkr.toLocaleString()}</td>
                    <td><span className={`adp-pill adp-p-${a.status}`}>{a.status}</span></td>
                    <td style={{ display: "flex", gap: 6 }}>
                      {a.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(a.id, "confirmed")} className="adp-btn adp-btn-s" style={{ color: "var(--a-green)" }}>Confirm</button>
                          <button onClick={() => updateStatus(a.id, "cancelled")} className="adp-btn adp-btn-r">Cancel</button>
                        </>
                      )}
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

export default function AdminInsuranceApplicationsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <InsuranceApplicationsInner />
      </AdminShell>
    </AdminGuard>
  );
}
