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
    const res = await fetch("/api/agent/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed. Link may have expired."); return; }
    setDone(true);
    setTimeout(() => router.push("/agent/login"), 2500);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div className="ap-card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Set New Password</h2>
        </div>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700 }}>Password updated!</p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Redirecting to login…</p>
          </div>
        ) : !token ? (
          <p style={{ color: "var(--red)", textAlign: "center" }}>Invalid or missing reset link. <Link href="/agent/forgot-password" style={{ color: "var(--gold)" }}>Request a new one.</Link></p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="ap-field">
              <label>New Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, include a number" />
            </div>
            <div className="ap-field">
              <label>Confirm Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" />
            </div>
            {error && <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} className="ap-btn ap-btn-gold" style={{ justifyContent: "center" }}>
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetInner /></Suspense>;
}
