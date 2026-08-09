"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type BankAccount = {
  id: string; bankName: string; accountTitle: string;
  accountNumber: string; iban: string | null;
  branchCode: string | null; logoUrl: string | null;
};

function copyText(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => copyText(text, setCopied)} title={`Copy ${label}`}
      style={{ background: copied ? "#f0fdf4" : "#f8fafc", border: `1px solid ${copied ? "#86efac" : "#e2e8f0"}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: copied ? "#16a34a" : "#64748b", transition: "all .15s", whiteSpace: "nowrap" }}>
      {copied ? "✓ Copied" : `Copy ${label}`}
    </button>
  );
}

function BankCard({ acc }: { acc: BankAccount }) {
  const [allCopied, setAllCopied] = useState(false);

  const allText = [
    `Bank: ${acc.bankName}`,
    `Account Title: ${acc.accountTitle}`,
    `Account Number: ${acc.accountNumber}`,
    acc.iban ? `IBAN: ${acc.iban}` : null,
    acc.branchCode ? `Branch Code: ${acc.branchCode}` : null,
  ].filter(Boolean).join("\n");

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#f8fafc,#fff)" }}>
        {acc.logoUrl
          ? <img src={acc.logoUrl} alt={acc.bankName} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", padding: 4 }} />
          : <div style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏦</div>
        }
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0, color: "#0f172a" }}>{acc.bankName}</p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{acc.accountTitle}</p>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Account Number", value: acc.accountNumber, mono: true },
          acc.iban ? { label: "IBAN", value: acc.iban, mono: true } : null,
          acc.branchCode ? { label: "Branch Code", value: acc.branchCode, mono: true } : null,
        ].filter(Boolean).map((f) => f && (
          <div key={f.label}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{f.label}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0, fontFamily: "monospace", letterSpacing: "0.04em" }}>{f.value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {acc.iban && <CopyBtn text={acc.iban} label="IBAN" />}
        <button onClick={() => copyText(allText, setAllCopied)} title="Copy all details"
          style={{ background: allCopied ? "#0f172a" : "#0f172a", border: "none", borderRadius: 6, padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#fff", transition: "all .15s" }}>
          {allCopied ? "✓ All Copied!" : "📋 Copy All Details"}
        </button>
      </div>
    </div>
  );
}

function BankAccountsInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await agentFetch("/api/agent/bank-accounts", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAccounts(data.accounts ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="ap-ph">
        <div>
          <h2>🏦 Bank <span>Accounts</span></h2>
          <p>Transfer funds to any of these accounts, then submit a topup request</p>
        </div>
        <Link href="/agent/topup" className="ap-btn ap-btn-gold">💳 Submit a Topup</Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="ap-card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          No bank accounts configured yet. Contact East &amp; West directly.
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
            💡 Use <strong>Copy IBAN</strong> for online transfers, or <strong>Copy All Details</strong> to share with your accountant.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {accounts.map(acc => <BankCard key={acc.id} acc={acc} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function AgentBankAccountsPage() {
  return <AgentGuard><AgentShell><BankAccountsInner /></AgentShell></AgentGuard>;
}
