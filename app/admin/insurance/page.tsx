"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
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
    setCompanyName("");
    setCompanyFile(null);
    load();
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: planCompanyId, name: planName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add plan."); return; }
    setPlanName("");
    load();
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: rateePlanId, pricePkr: price, coverageDetails: rateCoverage }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add rate."); return; }
    setRatePrice("");
    setRateCoverage("");
    load();
  }

  async function deleteRate(id: string) {
    if (!confirm("Delete this rate?")) return;
    await adminFetch(`/api/admin/insurance-rates/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  const allPlans = companies.flatMap((c) => c.plans.map((p) => ({ ...p, companyName: c.name })));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Insurance</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Companies */}
      <section className="mt-6 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <h2 className="font-display text-lg text-[var(--navy)]">Companies</h2>
        <form onSubmit={addCompany} className="mt-3 flex flex-wrap gap-2">
          <input placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <input type="file" accept="image/*" onChange={(e) => setCompanyFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <button type="submit" className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white">Add company</button>
        </form>
        <ul className="mt-4 divide-y divide-[var(--bdr)]">
          {companies.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span>{c.name} <span className="text-[var(--muted)]">({c.plans.length} plans)</span></span>
              <button onClick={() => deleteCompany(c.id)} className="text-red-700 underline">Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Plans */}
      <section className="mt-6 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <h2 className="font-display text-lg text-[var(--navy)]">Plans</h2>
        <form onSubmit={addPlan} className="mt-3 flex flex-wrap gap-2">
          <select value={planCompanyId} onChange={(e) => setPlanCompanyId(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
            <option value="">Select company…</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white">Add plan</button>
        </form>
        <ul className="mt-4 divide-y divide-[var(--bdr)]">
          {allPlans.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span>{p.name} <span className="text-[var(--muted)]">— {p.companyName} ({p.rates.length} rates)</span></span>
              <button onClick={() => deletePlan(p.id)} className="text-red-700 underline">Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Rates */}
      <section className="mt-6 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <h2 className="font-display text-lg text-[var(--navy)]">Rates</h2>
        <form onSubmit={addRate} className="mt-3 flex flex-wrap gap-2">
          <select value={rateePlanId} onChange={(e) => setRatePlanId(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
            <option value="">Select plan…</option>
            {allPlans.map((p) => <option key={p.id} value={p.id}>{p.companyName} — {p.name}</option>)}
          </select>
          <input type="number" placeholder="Price (PKR)" value={ratePrice} onChange={(e) => setRatePrice(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <input placeholder="Coverage details" value={rateCoverage} onChange={(e) => setRateCoverage(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white">Add rate</button>
        </form>
        <ul className="mt-4 divide-y divide-[var(--bdr)]">
          {allPlans.flatMap((p) => p.rates.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span>{p.companyName} — {p.name}: PKR {r.pricePkr.toLocaleString()} {r.coverageDetails ? `(${r.coverageDetails})` : ""}</span>
              <button onClick={() => deleteRate(r.id)} className="text-red-700 underline">Delete</button>
            </li>
          )))}
        </ul>
      </section>

      {loading && <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>}
    </div>
  );
}

export default function AdminInsurancePage() {
  return (
    <AdminGuard>
      <InsuranceInner />
    </AdminGuard>
  );
}
