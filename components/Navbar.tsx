"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

const serviceLinks = [
  { href: "/umrah", label: "Umrah Packages" },
  { href: "/visa", label: "Visa Services" },
  { href: "/tours", label: "Tour Packages" },
  { href: "/group-tickets", label: "Group Tickets" },
  { href: "/insurance", label: "Insurance" },
];

export default function Navbar() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Image src="/images/logo.jpg" alt="East & West Travel" width={36} height={36} className="rounded-md" />
          East <span className="text-[var(--lp-brass)] italic">&amp;</span> West <span className="font-normal">Travels</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text2">
          <Link href="/" className="hover:text-[var(--lp-brass)] transition-colors">Home</Link>
          <Link href="/about" className="hover:text-[var(--lp-brass)] transition-colors">About Us</Link>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="hover:text-[var(--lp-brass)] transition-colors flex items-center gap-1">
              Services <span className="text-xs">▾</span>
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 pt-2 w-52">
                <div className="bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                  {serviceLinks.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="block px-4 py-2.5 text-sm hover:bg-surface hover:text-[var(--lp-brass)] transition-colors"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/blog" className="hover:text-[var(--lp-brass)] transition-colors">Blog</Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            WhatsApp Us
          </a>

          {/* Mobile hamburger — the nav above is `hidden` below md, so
              without this, mobile visitors had no way to reach
              Services/About/Blog at all except the homepage's own links. */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-border"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span className="text-xl leading-none">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-white px-6 py-4 flex flex-col gap-1 text-sm font-medium">
          <Link href="/" onClick={() => setMobileOpen(false)} className="py-2.5 hover:text-[var(--lp-brass)]">Home</Link>
          <Link href="/about" onClick={() => setMobileOpen(false)} className="py-2.5 hover:text-[var(--lp-brass)]">About Us</Link>
          <p className="pt-2 pb-1 text-xs font-bold uppercase tracking-wide text-muted">Services</p>
          {serviceLinks.map((s) => (
            <Link key={s.href} href={s.href} onClick={() => setMobileOpen(false)} className="py-2.5 pl-2 hover:text-[var(--lp-brass)]">
              {s.label}
            </Link>
          ))}
          <Link href="/blog" onClick={() => setMobileOpen(false)} className="py-2.5 border-t border-border mt-1 pt-3 hover:text-[var(--lp-brass)]">Blog</Link>
          <a
            href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-3 rounded-lg"
          >
            WhatsApp Us
          </a>
        </nav>
      )}
    </header>
  );
}
