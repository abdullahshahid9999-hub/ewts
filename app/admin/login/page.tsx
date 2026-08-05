"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../portal.css";

type Step = "credentials" | "totp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotp]     = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [step, setStep]         = useState<Step>("credentials");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...(step === "totp" && { totpCode }) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Login failed."); return; }
    if (data.requires2FA) { setStep("totp"); return; }
    if (data.accessToken) {
      localStorage.setItem("admin_access_token", data.accessToken);
      localStorage.setItem("admin_user", JSON.stringify(data.admin));
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="adp-body" style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── LEFT PANEL — branding ── */}
      <div style={{
        flex: "0 0 420px",
        background: "linear-gradient(155deg, #1C1E26 0%, #2a2d3a 60%, #1a1c24 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 44px", position: "relative", overflow: "hidden",
      }}
        className="admin-login-left"
      >
        {/* decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", border: "1.5px solid rgba(184,146,58,0.15)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: "1.5px solid rgba(184,146,58,0.1)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", border: "1.5px solid rgba(184,146,58,0.1)", pointerEvents: "none" }} />

        {/* Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "linear-gradient(135deg, #B8923A, #D4AF5A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 12px rgba(184,146,58,0.4)",
            }}>✈</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: -0.2 }}>East &amp; West Travel</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Management System</div>
            </div>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: -0.5 }}>
            Manage your<br />
            <span style={{ color: "#B8923A" }}>travel business</span>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
            Bookings, agents, packages, visas and finance — all in one secure panel.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Services", value: "5+" },
            { label: "Agents", value: "Multi" },
            { label: "Secured", value: "2FA" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#B8923A" }}>{value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", background: "var(--a-bg)",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px", color: "var(--a-text)" }}>
              {step === "totp" ? "Two-Factor Auth" : "Admin Sign In"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--a-muted)", margin: 0 }}>
              {step === "totp"
                ? "Enter the 6-digit code from your authenticator app"
                : "Sign in with your admin credentials to continue"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {step === "credentials" ? (<>
              {/* Email */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="admin@eastwestpk.com"
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid var(--a-border)", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", transition: "border-color .15s" }}
                  onFocus={e => (e.target.style.borderColor = "var(--a-gold)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--a-border)")}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "11px 44px 11px 14px", border: "1.5px solid var(--a-border)", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", transition: "border-color .15s" }}
                    onFocus={e => (e.target.style.borderColor = "var(--a-gold)")}
                    onBlur={e  => (e.target.style.borderColor = "var(--a-border)")}
                  />
                  <button
                    type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--a-muted)", padding: 0 }}
                  >
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link href="/admin/forgot-password" style={{ fontSize: 12, color: "var(--a-gold)", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>

            </>) : (
              /* TOTP step */
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  Authenticator Code
                </label>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  required autoFocus value={totpCode}
                  onChange={e => setTotp(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="000000"
                  style={{ width: "100%", padding: "14px", border: "1.5px solid var(--a-border)", borderRadius: 10, fontSize: 28, fontWeight: 700, letterSpacing: "0.4em", textAlign: "center", outline: "none", boxSizing: "border-box", background: "#fff" }}
                  onFocus={e => (e.target.style.borderColor = "var(--a-gold)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--a-border)")}
                />
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setTotp(""); setError(null); }}
                  style={{ marginTop: 10, fontSize: 12, color: "var(--a-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  ← Use different account
                </button>
              </div>
            )}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--a-red-bg)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 13, color: "var(--a-red)", fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={loading}
              style={{
                background: loading ? "var(--a-gold-hi)" : "linear-gradient(135deg, #B8923A, #D4AF5A)",
                color: "#fff", fontWeight: 800, padding: "13px",
                borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15, letterSpacing: 0.2,
                boxShadow: loading ? "none" : "0 4px 12px rgba(184,146,58,0.35)",
                transition: "opacity .15s", opacity: loading ? 0.75 : 1,
              }}
            >
              {loading
                ? (step === "totp" ? "Verifying…" : "Signing in…")
                : (step === "totp" ? "Verify Code" : "Sign In")}
            </button>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--a-dim)", marginTop: 32 }}>
            East &amp; West Travel Services &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Responsive — collapse left panel on small screens */}
      <style>{`
        @media (max-width: 700px) {
          .admin-login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
