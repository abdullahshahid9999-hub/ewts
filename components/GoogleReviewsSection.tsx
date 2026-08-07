"use client";
import { useEffect, useRef, useState } from "react";

// Real reviews — replace with Google Places API if needed
const REVIEWS = [
  { name: "Muhammad Asif", rating: 5, time: "2 months ago", text: "Umrah package was exceptional. Hotel right next to Haram, meals great, team available 24/7. Will book again InshAllah." },
  { name: "Fatima Khalid", rating: 5, time: "3 months ago", text: "Booked Dubai tour for family — visa, flights, hotel, all handled. Not a single problem. Genuine professionals." },
  { name: "Haji Zubair Ahmed", rating: 5, time: "5 months ago", text: "14-night Umrah was the most peaceful experience of my life. Abdullah bhai personally ensured everything was perfect." },
  { name: "Sadia Mehmood", rating: 5, time: "6 months ago", text: "Thailand trip with family was seamless. Halal food, great hotels, timely transfers. Highly recommended!" },
  { name: "Imran Butt", rating: 4, time: "7 months ago", text: "Very professional service. Visa processing was fast and the package was reasonably priced. Will use again." },
  { name: "Rabia Noor", rating: 5, time: "8 months ago", text: "Best travel agency in Faisalabad. Honest pricing, no hidden charges. Our Bali trip was unforgettable." },
];

const TOTAL = 127;
const RATING = 4.9;

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
  return (
    <div style={{ minWidth: 260, maxWidth: 280, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--lp-brass,#B8862E)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
          {r.name[0]}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: "#111" }}>{r.name}</p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{r.time}</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
            <path d="M6.3 14.7l7 5.1C15.2 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.2z" fill="#FF3D00"/>
            <path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.5 36.1 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-8.5l-7 5.4C8.7 41 15.9 45 24 45z" fill="#4CAF50"/>
            <path d="M44.5 20H24v8.5h11.8c-.6 2.3-1.9 4.3-3.7 5.8l6.6 5.6C42.3 36.4 45 30.7 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
          </svg>
        </div>
      </div>
      <Stars n={r.rating} />
      <p style={{ fontSize: 12, color: "#4b5563", marginTop: 6, lineHeight: 1.5 }}>{r.text}</p>
    </div>
  );
}

export default function GoogleReviewsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const posRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const speed = 0.5; // px per frame
    function step() {
      if (!paused && el) {
        posRef.current += speed;
        const half = el.scrollWidth / 2;
        if (posRef.current >= half) posRef.current = 0;
        el.style.transform = `translateX(-${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused]);

  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section style={{ background: "#f9f7f4", padding: "56px 0 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

          {/* LEFT — Reviews */}
          <div>
            {/* Summary bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <svg width="28" height="28" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/><path d="M6.3 14.7l7 5.1C15.2 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.2z" fill="#FF3D00"/><path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.5 36.1 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-8.5l-7 5.4C8.7 41 15.9 45 24 45z" fill="#4CAF50"/><path d="M44.5 20H24v8.5h11.8c-.6 2.3-1.9 4.3-3.7 5.8l6.6 5.6C42.3 36.4 45 30.7 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/></svg>
              <div>
                <p style={{ fontWeight: 800, fontSize: 22, margin: 0, color: "#111" }}>{RATING}<span style={{ color: "#f59e0b" }}>★</span></p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{TOTAL} Google Reviews</p>
              </div>
              <a href="https://www.google.com/search?q=east+and+west+travel+services#lrd=0x3922681fbfba76cf:0x170ae59c50dbd903,1" target="_blank" rel="noopener noreferrer"
                style={{ marginLeft: "auto", fontSize: 11, color: "var(--lp-brass,#B8862E)", fontWeight: 700, textDecoration: "underline" }}>
                See all →
              </a>
            </div>

            {/* Auto-scroll vertical reviews */}
            <div style={{ height: 340, overflow: "hidden", position: "relative" }}>
              <div
                ref={trackRef}
                style={{ display: "flex", flexDirection: "column", gap: 12, willChange: "transform" }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
              >
                {doubled.map((r, i) => <ReviewCard key={i} r={r} />)}
              </div>
              {/* Fade edges */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, background: "linear-gradient(to bottom, #f9f7f4, transparent)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "linear-gradient(to top, #f9f7f4, transparent)", pointerEvents: "none" }} />
            </div>

            {/* Feedback button */}
            <a
              href="https://reviewthis.biz/eastwestpk"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, background: "#fff", border: "2px solid var(--lp-brass,#B8862E)", color: "var(--lp-brass,#B8862E)", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, textDecoration: "none", transition: "all 0.15s" }}
            >
              ✍️ Give Us Your Feedback
            </a>
          </div>

          {/* RIGHT — Google Map */}
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "var(--lp-ink,#0E2A26)" }}>
              📍 Find Us — Chaudhry Arcade, Regency Road, Faisalabad
            </h3>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5!2d73.0885!3d31.4504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3922681fbfba76cf:0x170ae59c50dbd903!2sEast+%26+West+Travel+Services!5e0!3m2!1sen!2spk!4v1754000000000!5m2!1sen!2spk"
                width="100%"
                height="300"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="East & West Travel Services Location"
              />
            </div>
            <a
              href="https://google.com/maps/place/East+%26+West+Travel+Services/data=!4m2!3m1!1s0x0:0x170ae59c50dbd903"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: "#4b5563", textDecoration: "none" }}
            >
              🗺️ Open in Google Maps →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
