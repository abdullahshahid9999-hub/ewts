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

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Image src="/images/logo.jpg" alt="East & West Travel" width={36} height={36} className="rounded-md" />
          East <span className="text-gold italic">&amp;</span> West <span className="font-normal">Travels</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text2">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <Link href="/about" className="hover:text-gold transition-colors">About Us</Link>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="hover:text-gold transition-colors flex items-center gap-1">
              Services <span className="text-xs">▾</span>
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 pt-2 w-52">
                <div className="bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                  {serviceLinks.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="block px-4 py-2.5 text-sm hover:bg-surface hover:text-gold transition-colors"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/blog" className="hover:text-gold transition-colors">Blog</Link>
        </nav>

        <a
          href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          WhatsApp Us
        </a>
      </div>
    </header>
  );
}
