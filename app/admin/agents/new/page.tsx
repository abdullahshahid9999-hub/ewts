"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { TIER_CREDIT } from "@/lib/agentId";

const SERVICE_TYPES = [
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Ticket" },
  { value: "insurance", label: "Insurance" },
  { value: "world_tour", label: "World Tour" },
  { value: "visa_services", label: "Visa Services" },
];

type RateRow = { serviceType: string; rateType: string; value: string; enabled: boolean };
const defaultRates = (): RateRow[] =>
  SERVICE_TYPES.map(s => ({ serviceType: s.value, rateType: "percentage", value: "", enabled: false }));

const INP: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid var(--a-border)", borderRadius: 8, fontSize: 14, background: "var(--a-surface, #fff)", color: "var(--a-text)", boxSizing: "border-box" };
const L: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--a-muted)", marginBottom: 4, display: "block" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="adp-card" style={{ marginBottom: 16 }}>
      <div className="adp-ch"><h3>{title}</h3></div>
      <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, span, children }: { label: string; span?: boolean; children: React.ReactNode }) {
  return (
    <div style={span ? { gridColumn: "1 / -1" } : {}}>
      <label style={L}>{label}</label>
      {children}
    </div>
  );
}

function NewAgentInner() {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();

  const [basic, setBasic] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [agency, setAgency] = useState({ agencyName: "", agencyCity: "", agencyAddress: "" });
  const [dtsLicense, setDtsLicense] = useState(false);
  const [dtsNumber, setDtsNumber] = useState("");
  const [tier, setTier] = useState("bronze");
  const [isOwner, setIsOwner] = useState(true);
  const [creditLimit, setCreditLimit] = useState(String(TIER_CREDIT.bronze));
  const [rates, setRates] = useState<RateRow[]>(defaultRates());
  const [preview, setPreview] = useState<string>("—");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Live preview of agent code
  const fetchPreview = useCallback(async () => {
    if (!accessToken || !agency.agencyName || !agency.agencyCity) { setPreview("—"); return; }
    try {
      const params = new URLSearchParams({ agencyName: agency.agencyName, agencyCity: agency.agencyCity, tier, isOwner: String(isOwner) });
      const res = await adminFetch(`/api/admin/agents/next-code?${params}`, accessToken, refresh);
      const d = await res.json();
      if (d.agentCode) setPreview(d.agentCode);
    } catch { setPreview("—"); }
  }, [accessToken, refresh, agency.agencyName, agency.agencyCity, tier, isOwner]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  // Auto-set credit limit when tier changes
  useEffect(() => {
    setCreditLimit(String(TIER_CREDIT[tier] ?? 0));
  }, [tier]);

  function setRate(idx: number, field: keyof RateRow, val: string | boolean) {
    setRates(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSaving(true);
    const commissionRates = rates.filter(r => r.enabled && r.value !== "")
      .map(r => ({ serviceType: r.serviceType, rateType: r.rateType, value: Number(r.value) }));

    const res = await adminFetch("/api/admin/agents", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...basic,
        agencyName: agency.agencyName, agencyCity: agency.agencyCity, agencyAddress: agency.agencyAddress || undefined,
        dtsLicense, dtsLicenseNumber: dtsLicense ? dtsNumber : undefined,
        tier, isOwner, creditLimit: Number(creditLimit), commissionRates,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not create agent."); return; }
    router.push("/admin/agents");
  }

  return (
    <>
      <div className="adp-ph">
        <div><h2>New <em>Agent</em></h2><p>Create a new agent account</p></div>
        <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>← Back</Link>
      </div>
      {error && <p style={{ color: "var(--a-red)", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <form onSubmit={createAgent}>
        {/* Agent ID Preview */}
        <div className="adp-card" style={{ marginBottom: 16 }}>
          <div className="adp-ch"><h3>Agent ID <span style={{ fontSize: 11, fontWeight: 400, color: "var(--a-muted)" }}>(auto-generated from agency name + city + tier)</span></h3></div>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 24, letterSpacing: "0.1em", color: "var(--a-gold)" }}>{preview}</span>
            <span style={{ fontSize: 12, color: "var(--a-muted)" }}>fills in as you type agency name &amp; city below</span>
          </div>
        </div>

        {/* Basic Info */}
        <Section title="Basic Information">
          <Field label="Full Name *">
            <input style={INP} value={basic.fullName} onChange={e => setBasic(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Muhammad Ali" required />
          </Field>
          <Field label="Email *">
            <input style={INP} type="email" value={basic.email} onChange={e => setBasic(f => ({ ...f, email: e.target.value }))} placeholder="agent@example.com" required />
          </Field>
          <Field label="Phone">
            <input style={INP} value={basic.phone} onChange={e => setBasic(f => ({ ...f, phone: e.target.value }))} placeholder="03001234567" />
          </Field>
          <Field label="Temporary Password * (min 8 chars)">
            <input style={INP} type="password" value={basic.password} onChange={e => setBasic(f => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="Agent's first login password" />
          </Field>
        </Section>

        {/* Agency Info */}
        <Section title="Agency Information">
          <Field label="Agency / Company Name *">
            <input style={INP} value={agency.agencyName} onChange={e => setAgency(f => ({ ...f, agencyName: e.target.value }))} placeholder="e.g. Aslam Travels" required />
          </Field>
          <Field label="City *">
            <input style={INP} value={agency.agencyCity} onChange={e => setAgency(f => ({ ...f, agencyCity: e.target.value }))} placeholder="e.g. Quetta, Lahore, Karachi" required />
          </Field>
          <Field label="Agency Address" span>
            <textarea style={{ ...INP, resize: "vertical", minHeight: 64 }} value={agency.agencyAddress} onChange={e => setAgency(f => ({ ...f, agencyAddress: e.target.value }))} placeholder="Full address — shop no., street, city" />
          </Field>

          {/* DTS License */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={L}>DTS (Pakistan Tourism) License</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => { setDtsLicense(v); if (!v) setDtsNumber(""); }}
                  style={{ padding: "8px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "2px solid", borderColor: dtsLicense === v ? "var(--a-gold)" : "var(--a-border)", background: dtsLicense === v ? "var(--a-gold)" : "transparent", color: dtsLicense === v ? "#fff" : "var(--a-text)" }}>
                  {v ? "✓ Yes, Licensed" : "✗ No License"}
                </button>
              ))}
            </div>
          </div>
          {dtsLicense && (
            <Field label="DTS License Number" span>
              <input style={INP} value={dtsNumber} onChange={e => setDtsNumber(e.target.value)} placeholder="e.g. DTS-2024-00123" />
            </Field>
          )}
        </Section>

        {/* Account Settings */}
        <Section title="Account Settings">
          <Field label="Role">
            <select style={INP} value={isOwner ? "owner" : "staff"} onChange={e => setIsOwner(e.target.value === "owner")}>
              <option value="owner">Agency Owner / Admin</option>
              <option value="staff">Staff Member</option>
            </select>
          </Field>
          <Field label="Tier">
            <select style={INP} value={tier} onChange={e => setTier(e.target.value)}>
              <option value="bronze">Bronze — PKR 0 credit</option>
              <option value="silver">Silver — PKR 500,000 credit</option>
              <option value="gold">Gold — PKR 1,000,000 credit</option>
              <option value="platinum">Platinum — PKR 2,000,000 credit</option>
            </select>
          </Field>
          <Field label="Credit Limit (PKR) — Admin Override">
            <input style={INP} type="number" min={0} value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
          </Field>
          <div style={{ fontSize: 12, color: "var(--a-muted)", alignSelf: "end", paddingBottom: 4 }}>
            Default for {tier}: PKR {(TIER_CREDIT[tier] ?? 0).toLocaleString()}
          </div>
        </Section>

        {/* Commission Rates */}
        <div className="adp-card" style={{ marginBottom: 16 }}>
          <div className="adp-ch"><h3>Commission Rates <span style={{ fontSize: 11, fontWeight: 400, color: "var(--a-muted)" }}>(effective from today — can be changed later)</span></h3></div>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 100px", gap: "8px 12px", alignItems: "center", fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--a-border)" }}>
              <span>On</span><span>Service</span><span>Type</span><span>Rate</span>
            </div>
            {rates.map((r, i) => (
              <div key={r.serviceType} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 100px", gap: "8px 12px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--a-border)" }}>
                <button type="button" onClick={() => setRate(i, "enabled", !r.enabled)}
                  style={{ width: 32, height: 18, borderRadius: 9, border: "none", cursor: "pointer", background: r.enabled ? "var(--a-gold)" : "var(--a-border)", position: "relative", transition: "background 0.2s" }}>
                  <span style={{ position: "absolute", top: 2, left: r.enabled ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: r.enabled ? 600 : 400, color: r.enabled ? "var(--a-text)" : "var(--a-muted)" }}>
                  {SERVICE_TYPES.find(s => s.value === r.serviceType)?.label}
                </span>
                <select disabled={!r.enabled} value={r.rateType} onChange={e => setRate(i, "rateType", e.target.value)}
                  style={{ ...INP, width: "auto", fontSize: 12, padding: "6px 8px", opacity: r.enabled ? 1 : 0.4 }}>
                  <option value="percentage">%</option>
                  <option value="fixed">PKR</option>
                </select>
                <input type="number" min={0} disabled={!r.enabled} value={r.value} onChange={e => setRate(i, "value", e.target.value)}
                  placeholder={r.rateType === "percentage" ? "e.g. 5" : "e.g. 2000"}
                  style={{ ...INP, fontSize: 13, padding: "6px 10px", opacity: r.enabled ? 1 : 0.4 }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="submit" className="adp-btn adp-btn-g" disabled={saving} style={{ minWidth: 130 }}>
            {saving ? "Creating…" : "✓ Create Agent"}
          </button>
          <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function NewAgentPage() {
  return <AdminGuard><AdminShell><NewAgentInner /></AdminShell></AdminGuard>;
}
