"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agentAuthClient";
import "../portal.css";

export default function ChangePasswordPage() {
  const { accessToken } = useAgentAuth();
  const router = useRouter();
  const [newPw, setNewPw]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);

  async function handleChange() {
    setError(null);
    if (newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPw !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    const res = await fetch("/api/agent/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      credentials: "include",
      body: JSON.stringify({ newPassword: newPw }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Failed."); return; }
    router.push("/agent/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔑</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: "var(--text)" }}>Set Your Password</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Your account was created with a temporary password. Set a new one to continue.
          </p>
        </div>

        <div className="ap-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>New Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 6 characters" className="ap-input"
                style={{ width: "100%", boxSizing: "border-box", paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "var(--muted)" }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password" className="ap-input"
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>

          {error && <p style={{ color: "var(--red)", fontSize: 13, margin: 0 }}>⚠️ {error}</p>}

          <button onClick={handleChange} disabled={saving} className="ap-btn ap-btn-gold" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Set Password & Continue"}
          </button>

          <button onClick={() => router.push("/agent/dashboard")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", padding: "4px 0" }}>
            Skip for now (not recommended)
          </button>
        </div>
      </div>
    </div>
  );
}
