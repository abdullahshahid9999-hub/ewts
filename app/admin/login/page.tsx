"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    <div style={{ minHeight: "100vh", display: "flex", background: "#f4f3ef" }}>

      {/* ── LEFT PANEL ── */}
      <div className="admin-login-left" style={{
        width: 440, flexShrink: 0, position: "relative", overflow: "hidden",
        background: "#0d1220", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "44px 44px",
      }}>
        {/* Background image */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/makarem_1.jpeg" alt="" fill
            style={{ objectFit: "cover", objectPosition: "center 30%", opacity: 0.35 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(10,18,32,.85) 0%,rgba(10,18,32,.4) 50%,rgba(10,18,32,.97) 100%)" }} />
        </div>

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/images/logo.jpg" alt="East & West" width={44} height={44}
            style={{ borderRadius: 10, objectFit: "cover" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>East &amp; West Travel</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Management System</div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, lineHeight: 1.25, margin: "0 0 14px", letterSpacing: -0.5 }}>
            One panel.<br />
            <span style={{ color: "#B8923A" }}>Complete control.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.7, margin: "0 0 28px" }}>
            Agents, bookings, payments, visa, insurance and content — all managed from here.
          </p>
          <div style={{ display: "flex", gap: 28, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
            {[["5+", "Services"], ["Multi", "Agents"], ["2FA", "Secured"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: "#B8923A", fontWeight: 800, fontSize: 18 }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px", color: "#1a1a2e" }}>
              {step === "totp" ? "Two-Factor Auth" : "Admin Sign In"}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {step === "totp" ? "Enter the 6-digit code from your authenticator app" : "Sign in with your admin credentials to continue"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {step === "credentials" ? (<>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="admin@eastwestpk.com"
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                  onFocus={e => e.target.style.borderColor = "#B8923A"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "11px 44px 11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                    onFocus={e => e.target.style.borderColor = "#B8923A"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#9ca3af", lineHeight: 1 }}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                <div style={{ textAlign: "right", marginTop: 6 }}>
                  <Link href="/admin/forgot-password" style={{ fontSize: 12, color: "#B8923A", textDecoration: "none", fontWeight: 600 }}>Forgot password?</Link>
                </div>
              </div>

            </>) : (
              /* TOTP */
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Authenticator Code</label>
                <input type="text" inputMode="numeric" maxLength={6} autoFocus value={totpCode}
                  onChange={e => setTotp(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="000000"
                  style={{ width: "100%", padding: "14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 28, fontWeight: 700, letterSpacing: "0.4em", textAlign: "center", outline: "none", boxSizing: "border-box", background: "#fff" }}
                  onFocus={e => e.target.style.borderColor = "#B8923A"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                <button type="button" onClick={() => { setStep("credentials"); setTotp(""); setError(null); }}
                  style={{ marginTop: 8, fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  ← Use different account
                </button>
              </div>
            )}

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ background: loading ? "#c9a85c" : "linear-gradient(135deg,#B8923A,#D4AF5A)", color: "#fff", fontWeight: 800, padding: "13px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 15, boxShadow: "0 4px 12px rgba(184,146,58,0.35)", opacity: loading ? 0.75 : 1 }}>
              {loading ? (step === "totp" ? "Verifying…" : "Signing in…") : step === "totp" ? "Verify Code" : "Sign In"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 28 }}>
            East &amp; West Travel Services &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <style>{`@media(max-width:700px){.admin-login-left{display:none!important}}`}</style>
    </div>
  );
}
