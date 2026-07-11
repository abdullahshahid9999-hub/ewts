"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
};

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
          <p>East &amp; West payment details — transfer funds to any of these accounts</p>
        </div>
        <Link href="/agent/topup" className="ap-btn ap-btn-gold">💳 Submit a Topup</Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="ap-card">
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No bank accounts have been configured yet.
            <br /><br />
            Please contact East &amp; West directly for payment details.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {accounts.map((acc) => (
            <div key={acc.id} className="ap-card">
              <div className="ap-ch">
                <div><h3>🏦 {acc.bankName}</h3></div>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label="Account Title" value={acc.accountTitle} />
                <Field label="Account Number" value={acc.accountNumber} mono />
                {acc.iban && <Field label="IBAN" value={acc.iban} mono />}
                {acc.branchCode && <Field label="Branch Code" value={acc.branchCode} mono />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600, color: "var(--text)",
        fontFamily: mono ? "var(--font-mono, monospace)" : undefined,
        letterSpacing: mono ? "0.04em" : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function AgentBankAccountsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <BankAccountsInner />
      </AgentShell>
    </AgentGuard>
  );
}
