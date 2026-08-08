"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TIPS = [
  "Try our Umrah packages →",
  "Explore Dubai tours →",
  "Check visa services →",
  "Browse group tickets →",
];

export default function NotFound() {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTip((p) => (p + 1) % TIPS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0E2A26 0%,#1a4a42 60%,#0E2A26 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", fontFamily: "Georgia,serif" }}>
      
      {/* Animated compass */}
      <div style={{ fontSize: 72, marginBottom: 8, animation: "spin 8s linear infinite", display: "inline-block" }}>🧭</div>
      
      <p style={{ color: "#B8862E", fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 12px" }}>Lost in Transit</p>
      
      <h1 style={{ color: "#fff", fontSize: "clamp(56px,10vw,96px)", fontWeight: 800, margin: "0 0 4px", lineHeight: 1, letterSpacing: "-2px" }}>404</h1>
      
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(18px,3vw,24px)", margin: "0 0 8px", fontStyle: "italic" }}>
        This page seems to have missed its flight.
      </p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 40px", maxWidth: 420 }}>
        Don&apos;t worry — our travel experts never lose their way. Let us guide you back.
      </p>

      {/* Rotating suggestion */}
      <div style={{ background: "rgba(184,134,46,0.15)", border: "1px solid rgba(184,134,46,0.35)", borderRadius: 40, padding: "10px 24px", marginBottom: 36, minWidth: 220, transition: "all 0.4s" }}>
        <Link href={tip === 0 ? "/umrah" : tip === 1 ? "/tours" : tip === 2 ? "/visa" : "/group-tickets"}
          style={{ color: "#B8862E", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          {TIPS[tip]}
        </Link>
      </div>

      {/* Main CTAs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
        <Link href="/" style={{ background: "#B8862E", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 28px", borderRadius: 12, textDecoration: "none", letterSpacing: 0.3 }}>
          ← Back to Home
        </Link>
        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer"
          style={{ background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 28px", borderRadius: 12, textDecoration: "none" }}>
          💬 WhatsApp Us
        </a>
      </div>

      {/* Quick nav */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { href: "/umrah", label: "🕌 Umrah" },
          { href: "/tours", label: "✈️ Tours" },
          { href: "/visa", label: "📋 Visa" },
          { href: "/about", label: "ℹ️ About" },
          { href: "/blog", label: "📰 Blog" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none", fontFamily: "system-ui,sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#B8862E")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
            {l.label}
          </Link>
        ))}
      </div>

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 48, fontFamily: "system-ui,sans-serif" }}>
        East &amp; West Travel Services · Faisalabad, Pakistan
      </p>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
