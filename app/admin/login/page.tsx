"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../portal.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);

    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...(step === "totp" && { totpCode }) }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) { setError(data.error ?? "Login failed."); return; }

    if (data.requires2FA) {
      setStep("totp");
      return;
    }

    // Store token
    if (data.accessToken) {
      localStorage.setItem("admin_access_token", data.accessToken);
      localStorage.setItem("admin_user", JSON.stringify(data.admin));
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="adp-body flex items-center justify-center min-h-screen px-4">
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--a-gold)", marginBottom: 8 }}>
            East &amp; West Travel
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {step === "totp" ? "Two-Factor Auth" : "Admin Panel"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--a-muted)" }}>
            {step === "totp" ? "Enter the 6-digit code from your authenticator app" : "Sign in to continue"}
          </p>
        </div>

        <div className="adp-card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {step === "credentials" ? (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none" }}
                    placeholder="admin@eastwestpk.com" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none" }}
                    placeholder="••••••••" />
                </div>
              </>
            ) : (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
                  Authenticator Code
                </label>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  required autoFocus value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 22, fontWeight: 700, letterSpacing: "0.3em", textAlign: "center", outline: "none" }}
                  placeholder="000000" />
                <button type="button" onClick={() => { setStep("credentials"); setTotpCode(""); setError(null); }}
                  style={{ marginTop: 8, fontSize: 12, color: "var(--a-muted)", background: "none", border: "none", cursor: "pointer" }}>
                  ← Back
                </button>
              </div>
            )}

            {error && <p style={{ fontSize: 12, color: "var(--a-red)", margin: 0 }}>{error}</p>}

            <button type="submit" disabled={submitting}
              style={{ background: "var(--a-gold)", color: "#000", fontWeight: 800, padding: "11px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Please wait…" : step === "totp" ? "Verify" : "Sign In"}
            </button>

            {step === "credentials" && (
              <Link href="/admin/forgot-password" style={{ textAlign: "center", fontSize: 12, color: "var(--a-muted)" }}>
                Forgot password?
              </Link>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
