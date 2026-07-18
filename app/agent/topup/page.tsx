"use client";

import { useEffect, useState, useCallback } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type BankAccount = {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string | null;
  branchCode: string | null;
  logoUrl: string | null;
};

type Slip = {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  slipImageUrl: string | null;
  createdAt: string;
};

function TopupInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingSlips, setLoadingSlips] = useState(true);

  // Form state
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    const res = await agentFetch("/api/agent/bank-accounts", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAccounts(data.accounts ?? []);
    setLoadingAccounts(false);
  }, [accessToken, refresh]);

  const loadSlips = useCallback(async () => {
    setLoadingSlips(true);
    const res = await agentFetch("/api/agent/topup", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSlips(data.slips ?? []);
    setLoadingSlips(false);
  }, [accessToken, refresh]);

  useEffect(() => {
    loadAccounts();
    loadSlips();
  }, [loadAccounts, loadSlips]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 100) {
      setError("Enter a valid amount (minimum PKR 100).");
      return;
    }
    if (!file) {
      setError("Please attach a photo of your payment receipt / bank slip.");
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.append("amount", String(amt));
    form.append("slip", file);
    if (note.trim()) form.append("note", note.trim());

    const res = await agentFetch("/api/agent/topup", accessToken, refresh, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Submission failed. Please try again.");
      return;
    }

    setSuccess(true);
    setAmount("");
    setNote("");
    setFile(null);
    loadSlips();
  }

  function statusColor(s: string) {
    if (s === "approved") return "var(--green)";
    if (s === "rejected") return "var(--red)";
    return "#B45309";
  }
  function statusBg(s: string) {
    if (s === "approved") return "var(--green-bg)";
    if (s === "rejected") return "var(--red-bg)";
    return "#FFFBEB";
  }
  function statusBorder(s: string) {
    if (s === "approved") return "var(--green-bd)";
    if (s === "rejected") return "var(--red-bd)";
    return "#FDE68A";
  }

  return (
    <div>
      <div className="ap-ph">
        <div>
          <h2>💳 Account <span>Topup</span></h2>
          <p>Transfer funds to one of our bank accounts, then submit your slip below</p>
        </div>
      </div>

      {/* Two-column layout: bank details left, form right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* ── Bank Accounts Panel ── */}
        <div className="ap-card" style={{ height: "fit-content" }}>
          <div className="ap-ch">
            <div><h3>🏦 Payment Destinations</h3><p>Transfer to any of these accounts</p></div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {loadingAccounts ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>
            ) : accounts.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                No bank accounts configured yet. Please contact East &amp; West directly.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {accounts.map((acc) => (
                  <div key={acc.id} style={{
                    background: "var(--surface)",
                    border: "1.5px solid var(--bdr)",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      {acc.logoUrl
                        ? <img src={acc.logoUrl} alt={acc.bankName} style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6, border: "1px solid var(--bdr)", background: "#fff", padding: 2 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid var(--bdr)", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
                      }
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{acc.bankName}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <Row label="Account Title" value={acc.accountTitle} />
                      <Row label="Account Number" value={acc.accountNumber} mono />
                      {acc.iban && <Row label="IBAN" value={acc.iban} mono />}
                      {acc.branchCode && <Row label="Branch Code" value={acc.branchCode} mono />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Submit Slip Form ── */}
        <div className="ap-card" style={{ height: "fit-content" }}>
          <div className="ap-ch">
            <div><h3>📤 Submit Payment Slip</h3><p>After transferring, upload your receipt here</p></div>
          </div>
          <div style={{ padding: "20px 18px" }}>
            {success && (
              <div style={{
                background: "var(--green-bg)", border: "1px solid var(--green-bd)",
                borderRadius: 8, padding: "12px 16px", marginBottom: 16,
                fontSize: 13, color: "var(--green)", fontWeight: 600,
              }}>
                ✅ Slip submitted! East &amp; West will review and credit your account shortly.
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="ap-field">
                <label>Amount Transferred (PKR)</label>
                <input
                  type="number"
                  min={100}
                  step={1}
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="ap-field">
                <label>Payment Slip / Receipt Photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  style={{ padding: "7px 10px", fontSize: 12 }}
                />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  JPEG, PNG, or WebP · max 8 MB
                </div>
              </div>

              {file && (
                <div style={{
                  background: "var(--surface)", border: "1px solid var(--bdr)",
                  borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text2)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </div>
              )}

              <div className="ap-field">
                <label>Note (optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Transferred via Easypaisa on 11 July"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{
                  background: "var(--red-bg)", border: "1px solid var(--red-bd)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)",
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="ap-btn ap-btn-gold"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {submitting ? "Submitting…" : "Submit Slip for Review"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Submission History ── */}
      <div className="ap-card">
        <div className="ap-ch">
          <div><h3>📋 Submission History</h3><p>All your topup requests and their status</p></div>
        </div>
        <div className="ap-tw">
          {loadingSlips ? (
            <p className="etd">Loading…</p>
          ) : slips.length === 0 ? (
            <p className="etd">No topup requests yet.</p>
          ) : (
            <table className="ap-table">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Status</th><th>Note</th><th>Slip</th></tr>
              </thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td style={{ fontWeight: 700 }}>PKR {s.amount.toLocaleString()}</td>
                    <td>
                      <span className="ap-pill" style={{
                        background: statusBg(s.status),
                        color: statusColor(s.status),
                        border: `1px solid ${statusBorder(s.status)}`,
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 11 }}>{s.note ?? "—"}</td>
                    <td>
                      {s.slipImageUrl
                        ? <a href={s.slipImageUrl} target="_blank" rel="noreferrer" style={{ color: "var(--gold)", fontSize: 12, fontWeight: 600 }}>View</a>
                        : <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", fontFamily: mono ? "var(--font-mono, monospace)" : undefined, textAlign: "right" }}>
          {value}
        </span>
        <button onClick={copy} style={{ background: copied ? "var(--green-bg)" : "var(--surface)", border: `1px solid ${copied ? "var(--green-bd)" : "var(--bdr)"}`, borderRadius: 5, padding: "1px 7px", fontSize: 9, fontWeight: 700, cursor: "pointer", color: copied ? "var(--green)" : "var(--muted)", whiteSpace: "nowrap", transition: "all .15s" }}>
          {copied ? "✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function AgentTopupPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <TopupInner />
      </AgentShell>
    </AgentGuard>
  );
}
