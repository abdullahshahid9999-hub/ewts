"use client";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function TrackInner() {
  const sp = useSearchParams();
  const [ref, setRef] = useState(sp.get("ref") ?? "");
  const token = sp.get("token") ?? ""; // secret from email link — never shown in UI
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<"form" | "uploading" | "done" | "error">("form");
  const [msg, setMsg] = useState("");
  const [appInfo, setAppInfo] = useState<{ fullName: string; visaLabel: string } | null>(null);

  useEffect(() => { if (ref && token) lookup(); }, []); // eslint-disable-line

  async function lookup() {
    if (!ref.trim()) return;
    const res = await fetch(`/api/visa/track?ref=${encodeURIComponent(ref.trim())}&token=${encodeURIComponent(token)}`);
    const d = await res.json();
    if (res.ok) { setAppInfo(d); setStep("form"); }
    else setMsg(d.error ?? "Invalid link. Please use the exact link from your email.");
  }

  async function submit() {
    if (!files.length) return;
    setStep("uploading");
    const form = new FormData();
    form.set("ref", ref.trim());
    form.set("token", token);
    files.forEach(f => form.append("files", f));
    const res = await fetch("/api/visa/track", { method: "POST", body: form });
    const d = await res.json();
    if (res.ok) { setStep("done"); }
    else { setStep("error"); setMsg(d.error ?? "Upload failed. Please try WhatsApp."); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F4F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "40px 36px", maxWidth: 480, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#B8923A", marginBottom: 4 }}>East &amp; West Travel Services</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1C1E26" }}>Upload Documents</div>
          <p style={{ color: "#6B7280", fontSize: 14, margin: "8px 0 0" }}>Enter your reference number to upload additional documents for your visa application.</p>
        </div>

        {step === "done" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ color: "#15803D", marginBottom: 8 }}>Documents Uploaded!</h3>
            <p style={{ color: "#6B7280", fontSize: 14 }}>We have received your documents and will review them shortly. You will be notified by email.</p>
            <a href="/" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", background: "#B8923A", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Back to Home</a>
          </div>
        ) : step === "error" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: "#DC2626", fontSize: 14, marginBottom: 16 }}>{msg}</p>
            <a href={`https://wa.me/923336515349?text=${encodeURIComponent(`Hi, I need help uploading documents. Reference: ${ref}`)}`}
              style={{ display: "inline-block", padding: "10px 24px", background: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
              💬 Contact on WhatsApp
            </a>
          </div>
        ) : (
          <>
            {/* Ref lookup */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Reference Number</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={ref} onChange={e => setRef(e.target.value.toUpperCase())}
                  placeholder="VA-XXXXXXX"
                  style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "monospace", letterSpacing: "0.05em", outline: "none" }}
                  onKeyDown={e => e.key === "Enter" && lookup()} />
                <button onClick={lookup}
                  style={{ padding: "10px 18px", background: "#1C1E26", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Find
                </button>
              </div>
              {msg && !appInfo && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 6 }}>{msg}</p>}
              {!token && <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}>ℹ️ This page should be opened from the link in your email.</p>}
            </div>

            {appInfo && (
              <>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: "#15803D", marginBottom: 2 }}>Application Found ✅</div>
                  <div style={{ color: "#374151" }}>{appInfo.fullName} — {appInfo.visaLabel}</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Select Documents</label>
                  <label style={{ display: "block", border: "2px dashed #D1D5DB", borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", background: files.length ? "#F0FDF4" : "#FAFAFA" }}>
                    <input type="file" multiple accept="image/*,application/pdf" style={{ display: "none" }}
                      onChange={e => setFiles(Array.from(e.target.files ?? []))} />
                    {files.length > 0 ? (
                      <div>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                        <div style={{ fontWeight: 600, color: "#15803D" }}>{files.length} file{files.length > 1 ? "s" : ""} selected</div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{files.map(f => f.name).join(", ")}</div>
                        <div style={{ fontSize: 12, color: "#B8923A", marginTop: 6 }}>Click to change</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
                        <div style={{ fontWeight: 600, color: "#374151" }}>Click to select files</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>PDF, JPG, PNG — multiple files allowed</div>
                      </div>
                    )}
                  </label>
                </div>

                <button onClick={submit} disabled={!files.length || step === "uploading"}
                  style={{ width: "100%", padding: "13px", background: files.length ? "#B8923A" : "#D1D5DB", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: files.length ? "pointer" : "not-allowed" }}>
                  {step === "uploading" ? "Uploading…" : "📤 Upload Documents"}
                </button>
              </>
            )}

            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 8px" }}>Need help? Contact us directly</p>
              <a href="https://wa.me/923336515349"
                style={{ display: "inline-block", padding: "8px 20px", background: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
                💬 WhatsApp Support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VisaTrackPage() {
  return <Suspense><TrackInner /></Suspense>;
}
