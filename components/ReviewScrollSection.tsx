"use client";
import { useEffect, useRef, useState } from "react";

const REVIEWS = [
  { name: "Muhammad Asif", location: "Faisalabad", trip: "Umrah 2024", rating: 5, quote: "The Umrah package was exceptional. Hotel right next to Haram, meals great, and the team available 24/7. Will book again InshAllah." },
  { name: "Fatima Khalid", location: "Lahore", trip: "Dubai Tour 2024", rating: 5, quote: "Booked Dubai tour for family — visa, flights, hotel, all handled. Not a single problem throughout. Genuine professionals." },
  { name: "Haji Zubair Ahmed", location: "Faisalabad", trip: "Umrah 2023", rating: 5, quote: "14-night Umrah was the most peaceful experience of my life. Abdullah bhai personally ensured everything was perfect. Jazakallah khair." },
  { name: "Sadia Mehmood", location: "Sargodha", trip: "Thailand 2024", rating: 5, quote: "Thailand trip with family was seamless. Halal food, great hotels, timely transfers. Will definitely come back." },
  { name: "Imran Butt", location: "Lahore", trip: "Visa Service 2024", rating: 4, quote: "Very professional. Visa processing fast, package reasonably priced. Recommended to all my colleagues already." },
  { name: "Rabia Noor", location: "Faisalabad", trip: "Bali 2023", rating: 5, quote: "Best travel agency in Faisalabad. Honest pricing, no hidden charges. Our Bali trip was truly unforgettable." },
];

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: 1 }}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

export default function ReviewScrollSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const [paused, setPaused] = useState(false);
  const doubled = [...REVIEWS, ...REVIEWS];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf: number;
    function tick() {
      if (!paused && el) {
        pos.current += 0.55;
        const half = el.scrollWidth / 2;
        if (pos.current >= half) pos.current = 0;
        el.style.transform = `translateX(-${pos.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return (
    <section style={{ padding: "56px 0 48px", overflow: "hidden" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lp-brass,#B8862E)", marginBottom: 8 }}>Real Reviews</p>
        <h2 style={{ fontFamily: "var(--font-display,Georgia,serif)", fontSize: 28, fontWeight: 600, margin: 0 }}>
          Words from Our <em style={{ color: "var(--lp-brass,#B8862E)" }}>Travelers</em>
        </h2>
      </div>

      <div
        style={{ overflow: "hidden", position: "relative" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Left fade */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to right, var(--lp-bg,#fff), transparent)", zIndex: 2, pointerEvents: "none" }} />
        {/* Right fade */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, var(--lp-bg,#fff), transparent)", zIndex: 2, pointerEvents: "none" }} />

        <div ref={trackRef} style={{ display: "flex", gap: 20, padding: "12px 40px", willChange: "transform" }}>
          {doubled.map((r, i) => (
            <div
              key={i}
              style={{
                minWidth: 280, maxWidth: 300, flexShrink: 0,
                background: "#fff",
                border: "1px solid rgba(14,42,38,0.1)",
                borderRadius: 16,
                padding: "20px 22px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-4px) scale(1.02)";
                el.style.boxShadow = "0 8px 28px rgba(14,42,38,0.13)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "none";
                el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
              }}
            >
              <Stars n={r.rating} />
              <p style={{ fontSize: 13, color: "#4b5563", marginTop: 10, marginBottom: 14, lineHeight: 1.55, fontStyle: "italic" }}>
                &ldquo;{r.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--lp-brass,#B8862E)", color: "#fff", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {r.name[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: "#111" }}>{r.name}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{r.location} · {r.trip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
