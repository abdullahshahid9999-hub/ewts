import Link from "next/link";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

const links = [
  { href: "/umrah", label: "Umrah" },
  { href: "/tours", label: "Tours" },
  { href: "/group-tickets", label: "Group Tickets" },
  { href: "/visa", label: "Visa" },
  { href: "/insurance", label: "Insurance" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <Image src="/images/logo.jpg" alt="East & West Travel" width={36} height={36} className="rounded-md" />
          East <span className="text-gold italic">&amp;</span> West
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-gold transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-black text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          WhatsApp Us
        </a>
      </div>
    </header>
  );
}
