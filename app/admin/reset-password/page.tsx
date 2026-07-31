"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../portal.css";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed."); return; }
    setDone(true);
    setTimeout(() => router.push("/admin/login"), 2500);
  }

  if (done) return <div className="adp-body flex items-center justify-center min-h-screen"><div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>✅</div><p style={{ fontWeight: 700, marginTop: 12 }}>Password updated! Redirecting…</p></div></div>;

  return (
    <div className="adp-body flex items-center justify-center min-h-screen px-4">
      <div className="adp-card" style={{ width: "100%", maxWidth: 380, padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🔒 Set New Password</h2>
        {!token ? <p style={{ color: "var(--a-red)" }}>Invalid link. <Link href="/admin/forgot-password" style={{ color: "var(--a-gold)" }}>Request new one.</Link></p> : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>New Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13 }} placeholder="Min 8 chars, include a number" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Confirm Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13 }} placeholder="Repeat password" />
            </div>
            {error && <p style={{ fontSize: 12, color: "var(--a-red)", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ background: "var(--a-gold)", color: "#000", fontWeight: 800, padding: 11, borderRadius: 8, border: "none", cursor: "pointer" }}>
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return <Suspense fallback={null}><ResetInner /></Suspense>;
}
