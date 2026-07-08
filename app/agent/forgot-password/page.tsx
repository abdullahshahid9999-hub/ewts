"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../portal.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"identify" | "reset">("identify");
  const [agentCode, setAgentCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/agent/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentCode, email, phone }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    // Always move forward regardless of match — the API never reveals
    // whether the details matched an account.
    setMessage(data.message ?? "If those details match an account, a code has been sent.");
    setStep("reset");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/agent/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentCode, email, phone, code, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }
    router.push("/agent/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm ap-login-card p-8">
        <h1 className="font-display text-2xl text-[var(--navy)]">Reset Password</h1>

        {step === "identify" ? (
          <form onSubmit={handleIdentify} className="mt-6 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Enter your agent code, registered email, and phone number.
            </p>
            <input
              required
              placeholder="Agent code"
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value)}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[var(--navy)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send verification code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
            <input
              required
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm tracking-widest"
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
            />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[var(--navy)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
