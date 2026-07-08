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
    router.push("/agent/dashboard");
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[1.05fr_1fr]" style={{ background: "var(--navy)" }}>
      {/* LEFT: ATMOSPHERE PANEL */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden p-11">
        <Image src="/images/makarem_1.jpeg" alt="" fill className="object-cover opacity-55" style={{ objectPosition: "center 30%" }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,22,38,.55) 0%, rgba(10,22,38,.35) 38%, rgba(10,22,38,.92) 100%), linear-gradient(100deg, rgba(10,22,38,.9) 0%, rgba(10,22,38,.15) 55%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="text-white font-display text-lg font-semibold">East &amp; <span className="italic text-gold">West</span></div>
        </div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-widest uppercase text-gold-light mb-4">
            <span className="w-4 h-px bg-[var(--gold-l)]" /> Agent Network Portal
          </p>
          <h1 className="font-display text-white text-3xl md:text-4xl font-medium leading-tight max-w-md mb-4">
            Every booking you issue carries <span className="italic text-gold">our name</span> across the counter.
          </h1>
          <p className="text-white/60 text-sm max-w-sm mb-7">
            Sign in to manage group tickets, Umrah packages and insurance for your clients — with
            live credit tracking and instant OTP-confirmed issuance.
          </p>
          <div className="flex gap-7 border-t border-white/15 pt-5">
            <div><strong className="block font-display text-xl font-semibold text-white">3</strong><span className="text-[10px] text-white/50 uppercase tracking-wide font-semibold">Agent Tiers</span></div>
            <div><strong className="block font-display text-xl font-semibold text-white">24/7</strong><span className="text-[10px] text-white/50 uppercase tracking-wide font-semibold">Issue Window</span></div>
            <div><strong className="block font-display text-xl font-semibold text-white">OTP</strong><span className="text-[10px] text-white/50 uppercase tracking-wide font-semibold">Secured</span></div>
          </div>
        </div>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="flex items-center justify-center p-9" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold-dim, #9C7E3A)" }}>
              🔒 Authorized Access Only
            </p>
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">Agent Sign In</h2>
            <p className="text-[12.5px] text-[var(--muted)] mt-1">Enter your credentials to access your dashboard.</p>
          </div>

          <div className="ap-login-card p-6">
            <div className="flex gap-1 rounded-lg p-1 mb-5" style={{ background: "#F0EDE8" }}>
              <button type="button" className="flex-1 rounded-md py-2 text-xs font-semibold" style={{ background: "var(--white)", color: "var(--text)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                Sign In
              </button>
              <Link href="/agent/forgot-password" className="flex-1 rounded-md py-2 text-xs font-semibold text-center text-[var(--muted)]">
                Reset Password
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="ap-field">
                <label>Email Address</label>
                <input type="email" required placeholder="agent@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="ap-field">
                <label>Password</label>
                <input type="password" required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>

              {error && (
                <p className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "#FEF2F2", color: "var(--red)", border: "1px solid #FECACA" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg py-3 text-sm font-bold text-white transition disabled:opacity-70"
                style={{ background: "var(--navy)" }}
              >
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
