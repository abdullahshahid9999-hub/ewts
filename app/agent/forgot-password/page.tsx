"use client";
import { useState } from "react";
import Link from "next/link";
import "../portal.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/agent/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Something went wrong."); return; }
    setSent(true);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div className="ap-card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Forgot Password</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Enter your email and we'll send a reset link</p>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Check your email</p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              If <strong>{email}</strong> is registered, you'll receive a reset link within a minute.
            </p>
            <Link href="/agent/login" style={{ color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>← Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="ap-field">
              <label>Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            {error && <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} className="ap-btn ap-btn-gold" style={{ justifyContent: "center" }}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <Link href="/agent/login" style={{ textAlign: "center", color: "var(--muted)", fontSize: 12 }}>← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
