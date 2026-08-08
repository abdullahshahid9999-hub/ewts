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
  const [totpCode, setTotpCode] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [step, setStep]         = useState<"creds" | "totp">("creds");
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSub]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSub(true);
    const err = await login(email, password, step === "totp" ? totpCode : undefined);
    setSub(false);
    if (err === "__2FA_REQUIRED__") { setStep("totp"); return; }
    if (err) { setError(err); return; }
    router.push("/agent/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr", background: "var(--bg)" }}
      className="md:grid-cols-[1.1fr_1fr]">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden" style={{ padding: "44px 48px" }}>
        <Image src="/images/makarem_1.jpeg" alt="" fill className="object-cover"
          style={{ objectPosition: "center 30%", opacity: 0.5 }} />
        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg,rgba(7,17,32,.6) 0%,rgba(7,17,32,.3) 40%,rgba(7,17,32,.95) 100%),linear-gradient(105deg,rgba(7,17,32,.92) 0%,rgba(7,17,32,.1) 55%)"
        }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/images/logo.jpg" alt="East & West" width={38} height={38}
            style={{ borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }} />
          <span className="font-display text-white text-base font-semibold">
            East &amp; <span className="italic" style={{ color: "var(--gold)" }}>West</span>
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <p className="flex items-center gap-2 mb-5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold-l)" }}>
            <span style={{ width: 18, height: 1, background: "var(--gold-l)", display: "inline-block" }} />
            Agent Network Portal
          </p>

          <h1 className="font-display text-white font-medium leading-tight mb-5"
            style={{ fontSize: "clamp(26px,3.2vw,40px)", maxWidth: 420 }}>
            Every booking you issue carries{" "}
            <span className="italic" style={{ color: "var(--gold)" }}>our name</span>{" "}
            across the counter.
          </h1>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7, maxWidth: 360, marginBottom: 32 }}>
            Manage group tickets, Umrah packages, insurance and visa services for your clients —
            with live credit tracking and real-time booking status.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 24 }}>
            {[
              { value: "5+",   label: "Services" },
              { value: "24/7", label: "Availability" },
              { value: "OTP",  label: "Secured" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-display text-white font-semibold" style={{ fontSize: 22 }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "var(--bg)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9C7E3A", marginBottom: 10 }}>
              🔒 Authorized Access Only
            </p>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
              {step === "totp" ? "Two-Factor Auth" : "Agent Sign In"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              {step === "totp"
                ? "Enter the 6-digit code from your authenticator app."
                : "Sign in to access your bookings and commission dashboard."}
            </p>
          </div>

          {/* Card */}
          <div className="ap-login-card" style={{ padding: 24 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {step === "creds" ? (<>
                <div className="ap-field">
                  <label>Email Address</label>
                  <input type="email" required placeholder="agent@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>

                <div className="ap-field">
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} required placeholder="Enter password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      style={{ paddingRight: 42, width: "100%", boxSizing: "border-box" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--muted)" }}>
                      {showPw ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <Link href="/agent/forgot-password" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
                    Forgot password?
                  </Link>
                </div>
              </>) : (
                <div className="ap-field">
                  <label>Authenticator Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} autoFocus required
                    placeholder="000000" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                    style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.35em", textAlign: "center" }} />
                  <button type="button" onClick={() => { setStep("creds"); setTotpCode(""); setError(null); }}
                    style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>
                    ← Different account
                  </button>
                </div>
              )}

              {error && (
                <p style={{ background: "#FEF2F2", color: "var(--red)", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12, fontWeight: 500 }}>
                  ⚠️ {error}
                </p>
              )}

              <button type="submit" disabled={submitting}
                className="w-full rounded-lg py-3 text-sm font-bold text-white transition disabled:opacity-70"
                style={{ background: "var(--navy)", marginTop: 4, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting
                  ? (step === "totp" ? "Verifying…" : "Signing in…")
                  : step === "totp" ? "Verify Code" : "Sign In →"}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 20 }}>
            Not an agent yet?{" "}
            <a href="https://wa.me/923336515349?text=Assalam+o+Alaikum!+I+want+to+become+an+agent."
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>
              Contact us on WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
