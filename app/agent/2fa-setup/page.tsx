"use client";
import { useEffect, useState } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import Image from "next/image";

function AgentTwoFAInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [data, setData] = useState<{ secret: string; qrDataUrl: string; alreadyEnabled: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    agentFetch("/api/agent/2fa-setup", accessToken, refresh)
      .then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false));
  }, [accessToken, refresh]);

  async function enable(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await agentFetch("/api/agent/2fa-setup", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: data?.secret, code }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Invalid code."); return; }
    setSuccess("2FA enabled! You'll need your authenticator app on next login.");
    setData(prev => prev ? { ...prev, alreadyEnabled: true } : null);
    setCode("");
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await agentFetch("/api/agent/2fa-setup", accessToken, refresh, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Invalid code."); return; }
    setSuccess("2FA disabled.");
    setData(prev => prev ? { ...prev, alreadyEnabled: false } : null);
    setDisableCode("");
  }

  if (loading) return <p style={{ padding: 40, color: "var(--a-muted)" }}>Loading…</p>;

  return (
    <>
      <div className="adp-ph">
        <div><h2>Two-Factor <em>Authentication</em></h2><p>Secure your admin account with Google Authenticator</p></div>
        {data?.alreadyEnabled && <span style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ 2FA Active</span>}
      </div>

      {success && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#065F46", marginBottom: 16 }}>{success}</div>}

      {!data?.alreadyEnabled ? (
        <div className="adp-card" style={{ maxWidth: 480 }}>
          <div className="adp-ch"><h3>Setup Google Authenticator</h3></div>
          <div style={{ padding: "20px 22px" }}>
            <p style={{ fontSize: 13, color: "var(--a-muted)", marginBottom: 16 }}>
              1. Install <strong>Google Authenticator</strong> on your phone<br />
              2. Scan this QR code<br />
              3. Enter the 6-digit code to confirm
            </p>
            {data?.qrDataUrl && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Image src={data.qrDataUrl} alt="QR Code" width={200} height={200} style={{ border: "8px solid white", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.08)" }} />
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--a-muted)", marginBottom: 16, textAlign: "center" }}>
              Can't scan? Manual key: <code style={{ fontWeight: 700 }}>{data?.secret}</code>
            </p>
            <form onSubmit={enable} style={{ display: "flex", gap: 10 }}>
              <input type="text" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value)}
                style={{ flex: 1, padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 18, letterSpacing: "0.3em", textAlign: "center" }}
                placeholder="000000" />
              <button type="submit" disabled={saving} className="adp-btn adp-btn-g">
                {saving ? "…" : "Enable 2FA"}
              </button>
            </form>
            {error && <p style={{ fontSize: 12, color: "var(--a-red)", marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      ) : (
        <div className="adp-card" style={{ maxWidth: 480 }}>
          <div className="adp-ch"><h3>Disable 2FA</h3><p>Enter your current authenticator code to disable</p></div>
          <div style={{ padding: "20px 22px" }}>
            <form onSubmit={disable} style={{ display: "flex", gap: 10 }}>
              <input type="text" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required value={disableCode} onChange={e => setDisableCode(e.target.value)}
                style={{ flex: 1, padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 18, letterSpacing: "0.3em", textAlign: "center" }}
                placeholder="000000" />
              <button type="submit" disabled={saving} className="adp-btn adp-btn-r">
                {saving ? "…" : "Disable"}
              </button>
            </form>
            {error && <p style={{ fontSize: 12, color: "var(--a-red)", marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export default function TwoFASetupPage() {
  return <AgentGuard><AgentShell><AgentTwoFAInner /></AgentShell></AgentGuard>;
}
