"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "credentials" | "totp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [password, setPw]     = useState("");
  const [totpCode, setTotp]   = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [step, setStep]       = useState<Step>("credentials");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null); setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, ...(step === "totp" && { totpCode }) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Login failed."); return; }
    if (data.requires2FA) { setStep("totp"); return; }
    router.push("/admin/dashboard");
  }

  const I: React.CSSProperties = { width:"100%", padding:"12px 16px", border:"1px solid #E2E8F0", borderRadius:10, fontSize:15, outline:"none", background:"#F8FAFC", color:"#1a202c", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#F1F5F9" }}>
      <div style={{ width:420, background:"linear-gradient(160deg,#0E2A26 0%,#1a4a42 100%)", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"48px 40px", flexShrink:0 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:60 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:"#B8862E", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#fff", fontSize:14 }}>EW</div>
            <div>
              <p style={{ color:"#fff", fontWeight:800, fontSize:16, margin:0 }}>East &amp; West Travel</p>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:11, margin:0, letterSpacing:1.5, textTransform:"uppercase" }}>Management System</p>
            </div>
          </div>
          <h1 style={{ color:"#fff", fontSize:36, fontWeight:800, margin:"0 0 12px", lineHeight:1.2, fontFamily:"Georgia,serif" }}>One panel.<br/><span style={{ color:"#B8862E", fontStyle:"italic" }}>Complete control.</span></h1>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:14, lineHeight:1.7, margin:"0 0 40px" }}>Agents, bookings, payments, visa, insurance and content — all managed from here.</p>
          <div style={{ display:"flex", gap:24 }}>
            {[["5+","Services"],["Multi","Agents"],["2FA","Secured"]].map(([v,l])=>(
              <div key={l}>
                <p style={{ color:"#B8862E", fontWeight:800, fontSize:18, margin:"0 0 2px" }}>{v}</p>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, margin:0, textTransform:"uppercase", letterSpacing:1 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color:"rgba(255,255,255,0.2)", fontSize:12, margin:0 }}>East &amp; West Travel Services © 2026</p>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#0E2A26,#1a4a42)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 24px rgba(14,42,38,0.25)" }}><span style={{ fontSize:24 }}>🔐</span></div>
            <h2 style={{ fontWeight:800, fontSize:26, margin:"0 0 6px", color:"#1a202c" }}>{step==="totp"?"2FA Verification":"Admin Sign In"}</h2>
            <p style={{ color:"#64748b", fontSize:14, margin:0 }}>{step==="totp"?"Enter your authenticator code":"Sign in with your admin credentials"}</p>
          </div>

          <div style={{ background:"#fff", borderRadius:20, padding:"32px 36px", boxShadow:"0 4px 32px rgba(0,0,0,0.08)", border:"1px solid #E2E8F0" }}>
            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:8, alignItems:"center" }}>
                <span>⚠️</span><p style={{ color:"#DC2626", fontSize:13, margin:0, fontWeight:600 }}>{error}</p>
              </div>
            )}

            {step==="credentials" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Email Address</label>
                  <input style={I} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@eastwestpk.com" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoComplete="email" />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Password</label>
                  <div style={{ position:"relative" }}>
                    <input style={{ ...I, paddingRight:48 }} type={showPw?"text":"password"} value={password} onChange={e=>setPw(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoComplete="current-password" />
                    <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0, lineHeight:1 }}>
                      {showPw?"🙈":"👁️"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Authenticator Code</label>
                <input style={{ ...I, textAlign:"center", fontSize:24, letterSpacing:8, fontWeight:700 }} type="text" value={totpCode} onChange={e=>setTotp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoFocus />
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginTop:24, padding:"14px", background:loading?"#94a3b8":"linear-gradient(135deg,#0E2A26,#1a4a42)", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:loading?"not-allowed":"pointer", boxShadow:loading?"none":"0 4px 16px rgba(14,42,38,0.3)" }}>
              {loading?"Signing in…":step==="totp"?"Verify & Sign In →":"Sign In →"}
            </button>
            {step==="totp" && (
              <button onClick={()=>{setStep("credentials");setError(null);setTotp("");}} style={{ width:"100%", marginTop:10, padding:"10px", background:"transparent", color:"#64748b", border:"1px solid #E2E8F0", borderRadius:10, fontSize:13, cursor:"pointer", fontWeight:600 }}>← Back</button>
            )}
          </div>
          <p style={{ textAlign:"center", color:"#94a3b8", fontSize:12, marginTop:24 }}>East &amp; West Travel Services © 2026 · Admin Portal</p>
        </div>
      </div>
    </div>
  );
}
