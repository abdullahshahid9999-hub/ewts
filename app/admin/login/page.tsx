"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuthClient";
import "../portal.css";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(email, password);
    setSubmitting(false);
    if (err) { setError(err); return; }
    router.push("/admin/dashboard");
  }

  return (
    <div className="adp-body flex items-center justify-center min-h-screen px-4">
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div className="mb-5">
          <p style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--a-gold)", marginBottom: "8px" }}>
            🛡️ Admin Access Only
          </p>
          <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--a-text)" }}>Admin Sign In</h2>
          <p style={{ fontSize: "12.5px", color: "var(--a-muted)", marginTop: "5px" }}>East &amp; West Travel Services</p>
        </div>

        <div className="adp-card" style={{ padding: "26px", boxShadow: "0 4px 28px rgba(10,22,38,0.07)" }}>
          <form onSubmit={handleSubmit} className="adp-fg space-y-4">
            <div>
              <label>Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            {error && (
              <p style={{ background: "var(--a-red-bg)", color: "var(--a-red)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g w-full justify-center" style={{ padding: "10px", fontSize: "14px" }}>
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
