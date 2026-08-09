"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#FAFAF8",
      padding: "40px 24px",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
    }}>
      {/* Logo */}
      <img src="/assets/logo.png" alt="East & West Travel" width={56} height={56}
        style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />

      {/* 404 */}
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B8862E", margin: "0 0 8px" }}>
        404 — Page Not Found
      </p>
      <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, color: "#0E2A26", margin: "0 0 12px", lineHeight: 1.2 }}>
        This page doesn't exist.
      </h1>
      <p style={{ fontSize: 15, color: "#64748b", maxWidth: 380, margin: "0 0 36px", lineHeight: 1.6 }}>
        The link may be broken or the page may have moved. Let's get you back on track.
      </p>

      {/* Primary CTA */}
      <Link href="/" style={{
        display: "inline-block",
        background: "#0E2A26",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        padding: "12px 28px",
        borderRadius: 10,
        textDecoration: "none",
        marginBottom: 32,
        letterSpacing: 0.3,
      }}>
        ← Back to Home
      </Link>

      {/* Quick links */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
        {[
          { href: "/umrah", label: "Umrah & Hajj" },
          { href: "/tours", label: "Tours" },
          { href: "/visa", label: "Visa Services" },
          { href: "/group-tickets", label: "Group Tickets" },
          { href: "/about", label: "About Us" },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#475569",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            textDecoration: "none",
          }}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* WhatsApp */}
      <a href="https://wa.me/923336515349" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 13, color: "#25D366", fontWeight: 700, textDecoration: "none" }}>
        💬 Need help? WhatsApp us
      </a>

      <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 40 }}>
        East &amp; West Travel Services · eastwestpk.com
      </p>
    </div>
  );
}
