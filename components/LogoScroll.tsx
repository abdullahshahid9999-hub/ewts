"use client";
import { useEffect, useRef, useState } from "react";

const PARTNERS = [
  { name: "PIA", logo: "✈️" },
  { name: "Air Arabia", logo: "🛫" },
  { name: "Serene Air", logo: "🌤️" },
  { name: "flydubai", logo: "🏙️" },
  { name: "Air Blue", logo: "🔵" },
  { name: "Emirates", logo: "✨" },
  { name: "Qatar Airways", logo: "🌙" },
  { name: "Saudi Airlines", logo: "🕌" },
];

export default function LogoScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    function tick() {
      if (!hovered && el) {
        pos.current += 0.6;
        const half = el.scrollWidth / 2;
        if (pos.current >= half) pos.current = 0;
        el.style.transform = `translateX(-${pos.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered]);

  const doubled = [...PARTNERS, ...PARTNERS];

  return (
    <div style={{ overflow: "hidden", padding: "20px 0", borderTop: "1px solid var(--lp-border,rgba(14,42,38,.1))", borderBottom: "1px solid var(--lp-border,rgba(14,42,38,.1))", background: "var(--lp-sand,#F5F0E8)" }}>
      <div
        ref={ref}
        style={{ display: "flex", gap: 40, alignItems: "center", whiteSpace: "nowrap", willChange: "transform" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {doubled.map((p, i) => (
          <div
            key={i}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 40,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(14,42,38,0.10)",
              fontSize: 13, fontWeight: 700, color: "var(--lp-ink,#0E2A26)",
              flexShrink: 0,
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1.08)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(14,42,38,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: 18 }}>{p.logo}</span>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
