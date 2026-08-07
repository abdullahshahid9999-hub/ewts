"use client";
import { useEffect, useRef } from "react";

// Only 5-star reviews shown
const REVIEWS = [
  { name: "Muhammad Asif",     initials: "MA", location: "Faisalabad", trip: "Umrah 2024",       source: "google",     text: "The Umrah package was exceptional. Hotel right next to Haram, meals great, team available 24/7. Will book again InshAllah." },
  { name: "Fatima Khalid",     initials: "FK", location: "Lahore",     trip: "Dubai Tour 2024",  source: "google",     text: "Booked Dubai tour for family — visa, flights, hotel, all handled. Not a single problem. Genuine professionals." },
  { name: "Haji Zubair Ahmed", initials: "HZ", location: "Faisalabad", trip: "Umrah 2023",       source: "google",     text: "14-night Umrah was the most peaceful experience of my life. Abdullah bhai personally made sure everything was perfect. Jazakallah khair." },
  { name: "Sadia Mehmood",     initials: "SM", location: "Sargodha",   trip: "Thailand 2024",    source: "trustpilot", text: "Thailand trip with family was absolutely seamless. Halal food guaranteed, great hotels, timely transfers. Truly unforgettable!" },
  { name: "Rabia Noor",        initials: "RN", location: "Faisalabad", trip: "Bali 2023",        source: "google",     text: "Best travel agency in Faisalabad. Honest pricing, no hidden charges. Our Bali trip was unforgettable. Booking again soon!" },
  { name: "Ahmed Raza",        initials: "AR", location: "Lahore",     trip: "Group Umrah 2024", source: "trustpilot", text: "Handled our group Umrah of 12 people flawlessly. Communication excellent throughout. Rooms close to Masjid al-Haram. 10/10 service." },
  { name: "Nadia Perveen",     initials: "NP", location: "Faisalabad", trip: "Visa Service 2024",source: "google",     text: "Booked visa services for the whole family. Faster than expected. Staff knowledgeable and very patient. Absolutely trustworthy." },
  { name: "Usman Tariq",       initials: "UT", location: "Lahore",     trip: "Umrah 2024",       source: "trustpilot", text: "Excellent service from booking to return. Every detail handled perfectly. The team was always reachable. Highly recommended!" },
];

const BRASS = "#B8862E";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-label="Google Review">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.2 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.2z" fill="#FF3D00"/>
      <path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.5 36.1 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-8.5l-7 5.4C8.7 41 15.9 45 24 45z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.6 2.3-1.9 4.3-3.7 5.8l6.6 5.6C42.3 36.4 45 30.7 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  );
}

function TrustpilotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 126 117" aria-label="Trustpilot Review">
      <path d="M63 0l19.6 60.3H126L80.2 97.6 99.8 157.9 54 120.6 8.2 157.9l19.6-60.3L0 60.3h43.4z" fill="#00B67A" transform="scale(1 0.74)"/>
    </svg>
  );
}

function Stars() {
  return (
    <span aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: "#FBBC04", fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
  return (
    <div style={{
      minWidth: 300, maxWidth: 320, flexShrink: 0,
      background: "#fff", borderRadius: 18,
      border: "1px solid rgba(14,42,38,0.09)",
      padding: "22px 24px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 10px 32px rgba(184,134,46,0.14)`; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
    >
      {/* Source badge + stars */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Stars />
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, fontWeight: 700,
          color: r.source === "google" ? "#4285F4" : "#00B67A",
          background: r.source === "google" ? "#EBF3FF" : "#E6F9F3",
          padding: "3px 9px", borderRadius: 20,
        }}>
          {r.source === "google" ? <GoogleIcon /> : <TrustpilotIcon />}
          {r.source === "google" ? "Google" : "Trustpilot"}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, fontStyle: "italic", margin: "0 0 16px" }}>
        &ldquo;{r.text}&rdquo;
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${BRASS}, #7a5210)`, color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {r.initials}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: "#111" }}>{r.name}</p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{r.location} · {r.trip}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewScrollSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const paused = useRef(false);
  const touchX = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf: number;
    function tick() {
      if (!paused.current && el) {
        pos.current += 0.55;
        if (pos.current >= el.scrollWidth / 2) pos.current = 0;
        el.style.transform = `translateX(-${pos.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section style={{ padding: "64px 0 56px", overflow: "hidden", background: "var(--lp-sand,#F5F0E8)" }}>
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: BRASS, margin: "0 0 10px" }}>
          Real Reviews
        </p>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 30, fontWeight: 700, color: "#0E2A26", margin: "0 0 12px" }}>
          Words from Our <em style={{ color: BRASS }}>Travelers</em>
        </h2>
        {/* Platform badges */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid rgba(14,42,38,0.1)", borderRadius: 40, padding: "8px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#4285F4" }}>
            <GoogleIcon /> Google <span style={{ color: "#FBBC04" }}>★</span> 4.8
          </span>
          <span style={{ width: 1, height: 16, background: "#e5e7eb" }} />
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#00B67A" }}>
            <TrustpilotIcon /> Trustpilot <span style={{ color: "#FBBC04" }}>★</span> 4.9
          </span>
          <span style={{ width: 1, height: 16, background: "#e5e7eb" }} />
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>5★ only</span>
        </div>
      </div>

      {/* Scroll track */}
      <div style={{ position: "relative" }}
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
        onTouchStart={(e) => { paused.current = true; touchX.current = e.touches[0].clientX; }}
        onTouchMove={(e) => {
          const el = trackRef.current;
          if (!el) return;
          const dx = touchX.current - e.touches[0].clientX;
          pos.current = Math.max(0, pos.current + dx * 0.4);
          el.style.transform = `translateX(-${pos.current}px)`;
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={() => { paused.current = false; }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, var(--lp-sand,#F5F0E8), transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, var(--lp-sand,#F5F0E8), transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div ref={trackRef} style={{ display: "flex", gap: 20, padding: "8px 60px 16px", willChange: "transform" }}>
          {doubled.map((r, i) => <ReviewCard key={i} r={r} />)}
        </div>
      </div>

      {/* CTA row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, flexWrap: "wrap", padding: "0 24px" }}>
        <a href="https://www.google.com/search?q=east+and+west+travel+services#lrd=0x3922681fbfba76cf:0x170ae59c50dbd903,1"
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e5e7eb", color: "#111", fontWeight: 700, fontSize: 13, padding: "11px 22px", borderRadius: 12, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <GoogleIcon /> View Google Reviews
        </a>
        <a href="https://www.trustpilot.com/review/eastwestpk.com"
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00B67A", color: "#fff", fontWeight: 700, fontSize: 13, padding: "11px 22px", borderRadius: 12, textDecoration: "none" }}>
          <TrustpilotIcon /> View Trustpilot
        </a>
        <a href="https://reviewthis.biz/eastwestpk"
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0E2A26", color: "#fff", fontWeight: 700, fontSize: 13, padding: "11px 22px", borderRadius: 12, textDecoration: "none" }}>
          ✍️ Write a Review
        </a>
      </div>
    </section>
  );
}
