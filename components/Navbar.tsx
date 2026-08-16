"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/blog", label: "Blog" },
];

const serviceLinks = [
  { href: "/umrah", label: "Umrah Packages", icon: "🕌" },
  { href: "/visa", label: "Visa Services", icon: "📋" },
  { href: "/tours", label: "Tour Packages", icon: "✈️" },
  { href: "/group-tickets", label: "Group Tickets", icon: "🎫" },
  { href: "/insurance", label: "Insurance", icon: "🛡️" },
];

const WA_MSG = "Assalam o Alaikum! I am interested in your travel services. Please share details.";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <Image src="/images/logo.png" alt="East & West Travel Services" width={44} height={44} className="rounded-md" />
            <span className="hidden sm:inline">East <span className="text-amber-700 italic">&amp;</span> West <span className="font-normal">Travel Services</span></span>
            <span className="sm:hidden text-sm font-semibold">eastwestpk</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-amber-700 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-amber-700 transition-colors">About Us</Link>
            <div className="relative group">
              <button className="hover:text-amber-700 transition-colors flex items-center gap-1">Services ▾</button>
              <div className="absolute top-full left-0 pt-2 w-52 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                <div className="bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                  {serviceLinks.map((s) => (
                    <Link key={s.href} href={s.href} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-amber-700 transition-colors">
                      <span>{s.icon}</span>{s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/blog" className="hover:text-amber-700 transition-colors">Blog</Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* WA button — desktop only */}
            <a href={waLink(WA_MSG)} target="_blank" rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Us
            </a>

            {/* Hamburger — mobile only */}
            <button onClick={() => setOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white"
              aria-label="Open menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — outside header, conditionally rendered */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 bg-[#0e2a26]">
              <span className="text-white font-semibold text-sm">East &amp; West Travel Services</span>
              <button onClick={() => setOpen(false)} className="text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto px-5 py-4">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="flex items-center py-3 text-sm font-semibold text-gray-800 border-b border-gray-100 hover:text-amber-700">
                  {l.label}
                </Link>
              ))}
              <p className="pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-amber-700">Services</p>
              {serviceLinks.map((s) => (
                <Link key={s.href} href={s.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm text-gray-800 border-b border-gray-100 hover:text-amber-700">
                  <span>{s.icon}</span>{s.label}
                </Link>
              ))}
            </nav>

            {/* Footer WA */}
            <div className="p-5 border-t border-gray-100">
              <a href={waLink(WA_MSG)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm">
                WhatsApp Us
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
