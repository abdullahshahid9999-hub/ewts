"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const REVIEWS = [
  { name: "Muhammad Asif",    initials: "MA", rating: 5, time: "2 months ago",  text: "The Umrah package was exceptional. Hotel right next to Haram, meals were great, and the team was available whenever we needed. Will definitely book again InshAllah." },
  { name: "Fatima Khalid",    initials: "FK", rating: 5, time: "3 months ago",  text: "Booked the Dubai tour for my family — visa, flights, hotel, everything handled. Not a single problem throughout the trip. These people are genuine professionals." },
  { name: "Haji Zubair Ahmed",initials: "HZ", rating: 5, time: "5 months ago",  text: "14-night Umrah was the most peaceful experience of my life. Abdullah bhai personally made sure everything was perfect. Jazakallah khair to the whole team." },
  { name: "Sadia Mehmood",    initials: "SM", rating: 5, time: "6 months ago",  text: "Thailand trip with family was absolutely seamless. Halal food guaranteed, great hotels, timely transfers. Highly recommended to every family!" },
  { name: "Imran Butt",       initials: "IB", rating: 4, time: "7 months ago",  text: "Very professional service throughout. Visa processing was fast and the package was reasonably priced. Will be using them again for our next trip." },
  { name: "Rabia Noor",       initials: "RN", rating: 5, time: "8 months ago",  text: "Best travel agency in Faisalabad, no question. Honest pricing, no hidden charges. Our Bali trip was truly unforgettable. Booking again for Thailand soon!" },
  { name: "Ahmed Raza",       initials: "AR", rating: 5, time: "10 months ago", text: "Handled our group Umrah of 12 people flawlessly. Communication was excellent throughout. Rooms were spacious and close to Masjid al-Haram. 10/10 service." },
  { name: "Nadia Perveen",    initials: "NP", rating: 5, time: "1 year ago",    text: "Booked visa services for the whole family. Process was smooth and faster than expected. Staff is knowledgeable and very patient. Absolutely trustworthy agency." },
];

const TOTAL  = 44;
const RATING = 4.8;

const GMAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5!2d73.0885!3d31.4504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3922681fbfba76cf:0x170ae59c50dbd903!2sEast+%26+West+Travel+Services!5e0!3m2!1sen!2spk!4v1754000000000!5m2!1sen!2spk";
const GMAP_URL   = "https://google.com/maps/place/East+%26+West+Travel+Services/data=!4m2!3m1!1s0x0:0x170ae59c50dbd903";
const GREVIEW_URL= "https://www.google.com/search?q=east+and+west+travel+services#lrd=0x3922681fbfba76cf:0x170ae59c50dbd903,1";
const FEEDBACK_URL="https://reviewthis.biz/eastwestpk";

const BRASS = "#B8862E";
const INK   = "#0E2A26";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.2 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.2z" fill="#FF3D00"/>
      <path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.5 36.1 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-8.5l-7 5.4C8.7 41 15.9 45 24 45z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.6 2.3-1.9 4.3-3.7 5.8l6.6 5.6C42.3 36.4 45 30.7 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? "#FBBC04" : "#d1d5db", fontSize: 15 }}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ r, horizontal }: { r: typeof REVIEWS[0]; horizontal?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${hov ? BRASS+"55" : "#e5e7eb"}`,
        padding: "20px 22px",
        boxShadow: hov ? `0 8px 32px rgba(184,134,46,0.13)` : "0 2px 10px rgba(0,0,0,0.06)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.22s ease",
        cursor: "default",
        flexShrink: 0,
        ...(horizontal ? { minWidth: 300, maxWidth: 320 } : {}),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${BRASS}, #8a6010)`, color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: 0.5 }}>
          {r.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{r.time}</p>
        </div>
        <GoogleIcon />
      </div>
      <Stars n={r.rating} />
      <p style={{ fontSize: 13, color: "#374151", marginTop: 10, lineHeight: 1.6, fontStyle: "italic" }}>
        &ldquo;{r.text}&rdquo;
      </p>
    </div>
  );
}

/* ── Vertical auto-scroll (desktop left column) ── */
function VerticalScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const paused = useRef(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function tick() {
      if (!paused.current && el) {
        pos.current += 0.6;
        if (pos.current >= el.scrollHeight / 2) pos.current = 0;
        el.style.transform = `translateY(-${pos.current}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const stop = useCallback(() => { paused.current = true; }, []);
  const go   = useCallback(() => { paused.current = false; }, []);
  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <div style={{ height: 420, overflow: "hidden", position: "relative", borderRadius: 12 }}
      onMouseEnter={stop} onMouseLeave={go}
      onTouchStart={stop} onTouchEnd={go}
    >
      <div ref={trackRef} style={{ display: "flex", flexDirection: "column", gap: 14, willChange: "transform" }}>
        {doubled.map((r, i) => <ReviewCard key={i} r={r} />)}
      </div>
      <div style={{ position: "absolute", top: 0, insetInline: 0, height: 40, background: "linear-gradient(to bottom, #f8f6f2, transparent)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, insetInline: 0, height: 40, background: "linear-gradient(to top, #f8f6f2, transparent)", pointerEvents: "none" }} />
    </div>
  );
}

/* ── Horizontal auto-scroll (mobile) ── */
function HorizontalScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const paused = useRef(false);
  const raf = useRef<number>(0);
  const touchStart = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function tick() {
      if (!paused.current && el) {
        pos.current += 0.55;
        if (pos.current >= el.scrollWidth / 2) pos.current = 0;
        el.style.transform = `translateX(-${pos.current}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <div style={{ overflow: "hidden", position: "relative" }}
      onTouchStart={(e) => { paused.current = true; touchStart.current = e.touches[0].clientX; }}
      onTouchMove={(e) => {
        const el = trackRef.current;
        if (!el) return;
        const dx = touchStart.current - e.touches[0].clientX;
        pos.current = Math.max(0, pos.current + dx * 0.3);
        el.style.transform = `translateX(-${pos.current}px)`;
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={() => { paused.current = false; }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 32, background: "linear-gradient(to right,#f8f6f2,transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 32, background: "linear-gradient(to left,#f8f6f2,transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div ref={trackRef} style={{ display: "flex", gap: 16, padding: "4px 24px 16px", willChange: "transform" }}>
        {doubled.map((r, i) => <ReviewCard key={i} r={r} horizontal />)}
      </div>
    </div>
  );
}

export default function GoogleReviewsSection() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  return (
    <section style={{ background: "#f8f6f2", padding: isMobile ? "48px 0 40px" : "72px 0 64px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 20px" }}>

        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: BRASS, margin: "0 0 10px" }}>What Our Clients Say</p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 26 : 34, fontWeight: 700, color: INK, margin: 0 }}>
            Trusted by <em style={{ color: BRASS, fontStyle: "italic" }}>5,000+</em> Travelers
          </h2>
        </div>

        {isMobile ? (
          /* ── MOBILE layout ── */
          <div>
            {/* Rating pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, justifyContent: "center" }}>
              <GoogleIcon />
              <div style={{ lineHeight: 1.2 }}>
                <span style={{ fontWeight: 800, fontSize: 22, color: "#111" }}>{RATING}</span>
                <span style={{ color: "#FBBC04", fontSize: 18 }}> ★</span>
                <span style={{ fontSize: 12, color: "#6b7280", display: "block" }}>{TOTAL} verified reviews</span>
              </div>
              <a href={GREVIEW_URL} target="_blank" rel="noopener noreferrer"
                style={{ marginLeft: 8, fontSize: 12, color: BRASS, fontWeight: 700, textDecoration: "none", border: `1px solid ${BRASS}`, padding: "4px 10px", borderRadius: 20 }}>
                See all →
              </a>
            </div>
            <HorizontalScroll />
            {/* Map */}
            <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginTop: 24 }}>
              <iframe src={GMAP_EMBED} width="100%" height="220" style={{ border: 0, display: "block" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="East & West Travel Services" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INK, color: "#fff", fontWeight: 700, fontSize: 13, padding: "11px 22px", borderRadius: 12, textDecoration: "none", letterSpacing: 0.3 }}>
                ✍️ Write a Review
              </a>
              <a href={GMAP_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: INK, fontWeight: 600, fontSize: 13, padding: "11px 18px", borderRadius: 12, textDecoration: "none", border: "1px solid #e5e7eb" }}>
                🗺️ Get Directions
              </a>
            </div>
          </div>
        ) : (
          /* ── DESKTOP layout ── */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>

            {/* LEFT — reviews */}
            <div>
              {/* Rating summary */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <GoogleIcon />
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 28, color: "#111", lineHeight: 1 }}>{RATING}</span>
                    <Stars n={5} />
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{TOTAL} verified Google Reviews</p>
                </div>
                <a href={GREVIEW_URL} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: "auto", fontSize: 12, color: BRASS, fontWeight: 700, textDecoration: "none", border: `1.5px solid ${BRASS}`, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  See all →
                </a>
              </div>

              <VerticalScroll />

              {/* Feedback CTA */}
              <div style={{ marginTop: 22 }}>
                <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: INK, color: "#fff",
                    fontWeight: 700, fontSize: 14, padding: "13px 28px",
                    borderRadius: 14, textDecoration: "none",
                    letterSpacing: 0.3, boxShadow: `0 4px 16px rgba(14,42,38,0.18)`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px rgba(14,42,38,0.22)`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 16px rgba(14,42,38,0.18)`; }}
                >
                  ✍️ Give Us Your Feedback
                </a>
              </div>
            </div>

            {/* RIGHT — Map */}
            <div>
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.10)" }}>
                {/* Map header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: INK }}>East &amp; West Travel Services</p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Chaudhry Arcade, Regency Road, New Civil Lines, Faisalabad</p>
                  </div>
                </div>
                {/* Large map */}
                <iframe
                  src={GMAP_EMBED}
                  width="100%" height="380"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="East & West Travel Services Location"
                />
                {/* Map footer */}
                <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Office #07, Ground Floor</span>
                  <a href={GMAP_URL} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: BRASS, textDecoration: "none" }}>
                    Open in Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
