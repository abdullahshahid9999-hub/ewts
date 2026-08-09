"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAgentAuth } from "@/lib/agentAuthClient";
import "../portal.css";

export default function AgentLoginPage() {
  const { login } = useAgentAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotp]     = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [step, setStep]         = useState<"creds" | "totp">("creds");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(email, password, step === "totp" ? totpCode : undefined);
    setLoading(false);
    if (err === "__2FA_REQUIRED__") { setStep("totp"); return; }
    if (err) { setError(err); return; }
    router.push("/agent/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f3ef" }}
      className="agent-login-wrap">

      {/* ── HERO / LEFT (stacked on mobile, side-by-side on desktop) ── */}
      <div className="agent-login-inner">

        {/* LEFT */}
        <div style={{ position: "relative", overflow: "hidden", background: "#0d1220" }}
          className="agent-login-left">
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/images/makarem_1.jpeg')", backgroundSize: "cover", backgroundPosition: "center 30%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(7,17,32,.82) 0%,rgba(7,17,32,.45) 45%,rgba(7,17,32,.97) 100%)" }} />
          </div>

          {/* Brand */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12, padding: "36px 44px 0" }}>
            <Image src="/images/logo.jpg" alt="East & West" width={40} height={40}
              style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>
              East &amp; <em style={{ color: "#D4A843", fontStyle: "italic" }}>West</em>
            </span>
          </div>

          {/* Text */}
          <div style={{ position: "relative", zIndex: 1, padding: "0 44px 44px", marginTop: "auto" }}>
            <p style={{ color: "#D4A843", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 20, height: 1, background: "#D4A843", display: "inline-block" }} />
              Agent Network Portal
            </p>
            <h1 style={{ color: "#fff", fontSize: "clamp(22px,2.8vw,36px)", fontWeight: 700, lineHeight: 1.25, margin: "0 0 14px" }}>
              Every booking you issue carries{" "}
              <em style={{ color: "#D4A843" }}>our name</em>{" "}
              across the counter.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 360 }}>
              Manage group tickets, Umrah packages, insurance and visa for your clients — with live credit tracking and real-time booking status.
            </p>
            <div style={{ display: "flex", gap: 28, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
              {[["5+", "Services"], ["24/7", "Availability"], ["OTP", "Secured"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ color: "#D4A843", fontWeight: 800, fontSize: 20 }}>{v}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "44px 28px", background: "#f4f3ef" }}
          className="agent-login-right">
          <div style={{ width: "100%", maxWidth: 360 }}>

            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9C7E3A", marginBottom: 10 }}>🔒 Authorized Access Only</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#14142B", margin: "0 0 6px" }}>
              {step === "totp" ? "Two-Factor Auth" : "Agent Sign In"}
            </h2>
            <p style={{ fontSize: 13, color: "#7A7A95", margin: "0 0 24px" }}>
              {step === "totp" ? "Enter the 6-digit code from your authenticator app." : "Sign in to access your bookings and commission dashboard."}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {step === "creds" ? (<>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#7A7A95", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="agent@email.com" autoComplete="email"
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E4DFD4", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                    onFocus={e => e.target.style.borderColor = "#D4A843"}
                    onBlur={e => e.target.style.borderColor = "#E4DFD4"} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#7A7A95", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password" autoComplete="current-password"
                      style={{ width: "100%", padding: "11px 44px 11px 14px", border: "1.5px solid #E4DFD4", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                      onFocus={e => e.target.style.borderColor = "#D4A843"}
                      onBlur={e => e.target.style.borderColor = "#E4DFD4"} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#9ca3af", lineHeight: 1 }}>
                      {showPw ? "🙈" : "👁"}
                    </button>
                  </div>
                  <div style={{ textAlign: "right", marginTop: 6 }}>
                    <Link href="/agent/forgot-password" style={{ fontSize: 12, color: "#D4A843", textDecoration: "none", fontWeight: 600 }}>Forgot password?</Link>
                  </div>
                </div>

              </>) : (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#7A7A95", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Authenticator Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} autoFocus value={totpCode}
                    onChange={e => setTotp(e.target.value)}
                    placeholder="000000"
                    style={{ width: "100%", padding: "14px", border: "1.5px solid #E4DFD4", borderRadius: 10, fontSize: 28, fontWeight: 700, letterSpacing: "0.4em", textAlign: "center", outline: "none", boxSizing: "border-box", background: "#fff" }}
                    onFocus={e => e.target.style.borderColor = "#D4A843"}
                    onBlur={e => e.target.style.borderColor = "#E4DFD4"} />
                  <button type="button" onClick={() => { setStep("creds"); setTotp(""); setError(null); }}
                    style={{ marginTop: 8, fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    ← Different account
                  </button>
                </div>
              )}

              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: loading ? "#c9a85c" : "#071120", color: "#fff", fontWeight: 800, padding: "13px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 15, opacity: loading ? 0.75 : 1 }}>
                {loading ? (step === "totp" ? "Verifying…" : "Signing in…") : step === "totp" ? "Verify Code" : "Sign In →"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
              Not an agent?{" "}
              <a href="https://wa.me/923336515349?text=Assalam+o+Alaikum!+I+want+to+become+an+agent."
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#D4A843", fontWeight: 600, textDecoration: "none" }}>
                WhatsApp us
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .agent-login-inner {
          flex: 1;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          min-height: 100vh;
        }
        .agent-login-left {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .agent-login-inner {
            grid-template-columns: 1fr;
          }
          .agent-login-left {
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}
