"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Rate = { id: string; pricePkr: number; coverageDetails: string | null };
type Plan = { id: string; name: string; description: string | null; rates: Rate[] };
type Company = { id: string; name: string; logoUrl: string | null; description: string | null; plans: Plan[] };

function InsuranceInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyFile, setCompanyFile] = useState<File | null>(null);
  const [planCompanyId, setPlanCompanyId] = useState("");
  const [planName, setPlanName] = useState("");
  const [rateePlanId, setRatePlanId] = useState("");
  const [ratePrice, setRatePrice] = useState("");
  const [rateCoverage, setRateCoverage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/insurance-companies");
    const data = await res.json().catch(() => ({}));
    setCompanies(data.insuranceCompanies ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addCompany(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyName.trim()) { setError("Company name is required."); return; }
    const body = new FormData();
    body.set("name", companyName);
    if (companyFile) body.set("logo", await compressImage(companyFile));
    const res = await adminFetch("/api/admin/insurance-companies", accessToken, refresh, { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add company."); return; }
    setCompanyName(""); setCompanyFile(null); load();
  }

  async function deleteCompany(id: string) {
    if (!confirm("Delete this company and all its plans/rates?")) return;
    await adminFetch(`/api/admin/insurance-companies/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!planCompanyId || !planName.trim()) { setError("Select a company and enter a plan name."); return; }
    const res = await adminFetch("/api/admin/insurance-plans", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: planCompanyId, name: planName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add plan."); return; }
    setPlanName(""); load();
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this plan and its rates?")) return;
    await adminFetch(`/api/admin/insurance-plans/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  async function addRate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(ratePrice);
    if (!rateePlanId || !Number.isFinite(price) || price <= 0) { setError("Select a plan and enter a valid price."); return; }
    const res = await adminFetch("/api/admin/insurance-rates", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: rateePlanId, pricePkr: price, coverageDetails: rateCoverage }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add rate."); return; }
    setRatePrice(""); setRateCoverage(""); load();
  }

  async function deleteRate(id: string) {
    if (!confirm("Delete this rate?")) return;
    await adminFetch(`/api/admin/insurance-rates/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  const allPlans = companies.flatMap((c) => c.plans.map((p) => ({ ...p, companyName: c.name })));

  return (
    <>
      <div className="adp-ph"><div><h2>Insurance <em>Plans</em></h2><p>Companies, plans, and rates shown on the public site</p></div></div>
      {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

      <div className="adp-card">
        <div className="adp-ch"><h3>Companies</h3></div>
        <form onSubmit={addCompany} className="adp-fg" style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <input placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: "auto" }} />
          <input type="file" accept="image/*" onChange={(e) => setCompanyFile(e.target.files?.[0] ?? null)} style={{ width: "auto" }} />
          <button type="submit" className="adp-btn adp-btn-g">Add Company</button>
        </form>
        <div className="adp-tw">
          <table className="adp-table">
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}><td><strong>{c.name}</strong> ({c.plans.length} plans)</td><td style={{ textAlign: "right" }}><button onClick={() => deleteCompany(c.id)} className="adp-btn adp-btn-r">Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>Plans</h3></div>
        <form onSubmit={addPlan} className="adp-fg" style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <select value={planCompanyId} onChange={(e) => setPlanCompanyId(e.target.value)} style={{ width: "auto" }}>
            <option value="">Select company…</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} style={{ width: "auto" }} />
          <button type="submit" className="adp-btn adp-btn-g">Add Plan</button>
        </form>
        <div className="adp-tw">
          <table className="adp-table">
            <tbody>
              {allPlans.map((p) => (
                <tr key={p.id}><td><strong>{p.name}</strong> — {p.companyName} ({p.rates.length} rates)</td><td style={{ textAlign: "right" }}><button onClick={() => deletePlan(p.id)} className="adp-btn adp-btn-r">Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>Rates</h3></div>
        <form onSubmit={addRate} className="adp-fg" style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <select value={rateePlanId} onChange={(e) => setRatePlanId(e.target.value)} style={{ width: "auto" }}>
            <option value="">Select plan…</option>
            {allPlans.map((p) => <option key={p.id} value={p.id}>{p.companyName} — {p.name}</option>)}
          </select>
          <input type="number" placeholder="Price (PKR)" value={ratePrice} onChange={(e) => setRatePrice(e.target.value)} style={{ width: "120px" }} />
          <input placeholder="Coverage details" value={rateCoverage} onChange={(e) => setRateCoverage(e.target.value)} style={{ width: "auto" }} />
          <button type="submit" className="adp-btn adp-btn-g">Add Rate</button>
        </form>
        <div className="adp-tw">
          <table className="adp-table">
            <tbody>
              {allPlans.flatMap((p) => p.rates.map((r) => (
                <tr key={r.id}>
                  <td>{p.companyName} — {p.name}: <strong>PKR {r.pricePkr.toLocaleString()}</strong> {r.coverageDetails ? `(${r.coverageDetails})` : ""}</td>
                  <td style={{ textAlign: "right" }}><button onClick={() => deleteRate(r.id)} className="adp-btn adp-btn-r">Delete</button></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="etd">Loading…</p>}
    </>
  );
}

export default function AdminInsurancePage() {
  return (
    <AdminGuard>
      <AdminShell>
        <InsuranceInner />
      </AdminShell>
    </AdminGuard>
  );
}
