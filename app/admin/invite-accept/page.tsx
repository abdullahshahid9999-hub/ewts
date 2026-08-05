"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Stage = "loading" | "form" | "done" | "error";

export default function InviteAcceptPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [stage, setStage]       = useState<Stage>("loading");
  const [email, setEmail]       = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [errMsg, setErrMsg]     = useState("");
  const [submitting, setSub]    = useState(false);

  useEffect(() => {
    if (!token) { setErrMsg("No invitation token found."); setStage("error"); return; }
    fetch(`/api/admin/invite-accept?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErrMsg(d.error); setStage("error"); return; }
        setEmail(d.email);
        setFullName(d.fullName ?? "");
        setStage("form");
      })
      .catch(() => { setErrMsg("Network error. Try again."); setStage("error"); });
  }, [token]);

  async function handleSubmit() {
    setErrMsg("");
    if (password.length < 8) { setErrMsg("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErrMsg("Passwords do not match."); return; }
    setSub(true);
    const res = await fetch("/api/admin/invite-accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, fullName }),
    });
    const d = await res.json().catch(() => ({}));
    setSub(false);
    if (!res.ok) { setErrMsg(d.error ?? "Something went wrong."); return; }
    setStage("done");
    setTimeout(() => router.push("/admin/login"), 2500);
  }

  return (
    <div className="adp-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--a-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>✈</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--a-text)" }}>East &amp; West Travel</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
            {stage === "done" ? "Account Activated" : "Accept Invitation"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--a-muted)", margin: 0 }}>
            {stage === "loading" ? "Verifying your invitation…"
              : stage === "error" ? "There was a problem with your invitation"
              : stage === "done"  ? "Redirecting you to login…"
              : `Set your password for ${email}`}
          </p>
        </div>

        {stage === "loading" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 36, height: 36, border: "3px solid var(--a-border)", borderTopColor: "var(--a-gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {stage === "error" && (
          <div className="adp-card" style={{ padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <p style={{ color: "var(--a-red)", fontWeight: 600, marginBottom: 16 }}>{errMsg}</p>
            <a href="/admin/login" style={{ fontSize: 13, color: "var(--a-gold)" }}>Go to Login →</a>
          </div>
        )}

        {stage === "form" && (
          <div className="adp-card" style={{ padding: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Email</label>
                <input value={email} disabled
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, background: "var(--a-raised)", color: "var(--a-muted)", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name"
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                    style={{ width: "100%", padding: "9px 38px 9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--a-muted)" }}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              {errMsg && <p style={{ fontSize: 12, color: "var(--a-red)", margin: 0 }}>{errMsg}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                style={{ background: "var(--a-gold)", color: "#fff", fontWeight: 800, padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Activating account…" : "Activate Account"}
              </button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="adp-card" style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--a-text)", marginBottom: 6 }}>Account activated!</p>
            <p style={{ fontSize: 13, color: "var(--a-muted)" }}>Taking you to login…</p>
          </div>
        )}
      </div>
    </div>
  );
}
