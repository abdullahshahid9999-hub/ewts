"use client";
import { useState } from "react";
import Link from "next/link";
import "../portal.css";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false); setSent(true);
  }

  return (
    <div className="adp-body flex items-center justify-center min-h-screen px-4">
      <div className="adp-card" style={{ width: "100%", maxWidth: 380, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Forgot Password</h2>
        {sent ? (
          <>
            <p style={{ fontSize: 13, color: "var(--a-muted)", marginBottom: 16 }}>If that email is registered, a reset link has been sent.</p>
            <Link href="/admin/login" style={{ color: "var(--a-gold)", fontSize: 13, fontWeight: 600 }}>← Back to login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13 }}
              placeholder="admin@eastwestpk.com" />
            <button type="submit" disabled={loading}
              style={{ background: "var(--a-gold)", color: "#000", fontWeight: 800, padding: 11, borderRadius: 8, border: "none", cursor: "pointer" }}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <Link href="/admin/login" style={{ fontSize: 12, color: "var(--a-muted)" }}>← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
