"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

const serviceLinks = [
  { href: "/umrah", label: "Umrah Packages", icon: "🕌" },
  { href: "/visa", label: "Visa Services", icon: "📋" },
  { href: "/tours", label: "Tour Packages", icon: "✈️" },
  { href: "/group-tickets", label: "Group Tickets", icon: "🎫" },
  { href: "/insurance", label: "Insurance", icon: "🛡️" },
];

export default function Navbar() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Image src="/images/logo.png" alt="East & West Travel Services" width={44} height={44} className="rounded-md" />
          <span className="hidden sm:inline">East <span className="text-[var(--lp-brass)] italic">&amp;</span> West <span className="font-normal">Travel Services</span></span>
          <span className="sm:hidden text-sm">eastwestpk</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text2">
          <Link href="/" className="hover:text-[var(--lp-brass)] transition-colors">Home</Link>
          <Link href="/about" className="hover:text-[var(--lp-brass)] transition-colors">About Us</Link>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="hover:text-[var(--lp-brass)] transition-colors flex items-center gap-1">
              Services
              <span
                className="text-xs transition-transform duration-200"
                style={{ display: "inline-block", transform: servicesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >▾</span>
            </button>
            <div
              className="absolute top-full left-0 pt-2 w-52 transition-all duration-200"
              style={{
                opacity: servicesOpen ? 1 : 0,
                pointerEvents: servicesOpen ? "auto" : "none",
                transform: servicesOpen ? "translateY(0)" : "translateY(-6px)",
              }}
            >
              <div className="bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                {serviceLinks.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface hover:text-[var(--lp-brass)] transition-colors"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/blog" className="hover:text-[var(--lp-brass)] transition-colors">Blog</Link>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-3 py-2 rounded-lg shadow-sm transition-colors text-sm"
            aria-label="WhatsApp Us"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="hidden sm:inline">WhatsApp Us</span>
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-white transition-colors hover:bg-surface shrink-0"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span className="sr-only">Toggle menu</span>
            {/* Animated hamburger icon */}
            <div className="w-5 h-4 flex flex-col justify-between relative">
              <span
                className="block h-0.5 bg-current rounded-full transition-all duration-300 origin-center"
                style={{
                  transform: mobileOpen ? "rotate(45deg) translateY(7px)" : "none",
                }}
              />
              <span
                className="block h-0.5 bg-current rounded-full transition-all duration-300"
                style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "scaleX(1)" }}
              />
              <span
                className="block h-0.5 bg-current rounded-full transition-all duration-300 origin-center"
                style={{
                  transform: mobileOpen ? "rotate(-45deg) translateY(-7px)" : "none",
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile slide-in drawer */}
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border bg-[var(--lp-ink)]">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="East & West Travel Services" width={36} height={36} className="rounded-md" />
            <span className="font-display text-base font-semibold text-white">East &amp; West Travel Services</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors text-xl leading-none"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Sidebar body */}
        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--lp-text)] hover:text-[var(--lp-brass)] border-b border-border/50 transition-colors"
          >
            🏠 Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--lp-text)] hover:text-[var(--lp-brass)] border-b border-border/50 transition-colors"
          >
            ℹ️ About Us
          </Link>

          <p className="pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-[var(--lp-brass)]">Our Services</p>
          {serviceLinks.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 pl-2 text-sm font-medium text-[var(--lp-text)] hover:text-[var(--lp-brass)] border-b border-border/30 transition-colors"
            >
              <span className="text-base">{s.icon}</span>
              {s.label}
            </Link>
          ))}

          <Link
            href="/blog"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 py-3 mt-1 text-sm font-semibold text-[var(--lp-text)] hover:text-[var(--lp-brass)] transition-colors"
          >
            📰 Blog
          </Link>
        </nav>

        {/* Sidebar footer — WhatsApp CTA */}
        <div className="p-5 border-t border-border">
          <a
            href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold px-4 py-3.5 rounded-xl shadow transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Us
          </a>
          <p className="text-center text-xs text-muted mt-3">We reply within minutes</p>
        </div>
      </div>
    </header>
  );
}
