import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-10">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-text2">
        <div>
          <div className="font-display text-xl font-semibold mb-2">
            East <span className="text-gold italic">&amp;</span> West
          </div>
          <p className="text-muted mb-4">
            Faisalabad&apos;s trusted travel partner since 2003 — serving
            Pakistan with Umrah, Hajj, visas &amp; tours.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <a
              href="https://www.facebook.com/p/East-West-Travel-Services-100063816463202/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-gold"
            >
              Facebook
            </a>
            <a
              href={waLink("Assalam o Alaikum!")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-gold"
            >
              WhatsApp
            </a>
            <a href="mailto:eastwestpk@hotmail.com" className="text-muted hover:text-gold">
              Email
            </a>
          </div>
          <div className="flex gap-2">
            <span className="text-xs border border-border rounded-full px-3 py-1 text-muted">IATA Member</span>
            <span className="text-xs border border-border rounded-full px-3 py-1 text-muted">Est. 2003</span>
          </div>
        </div>

        <div>
          <div className="font-semibold text-text mb-3">Our Services</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/umrah" className="hover:text-gold">Umrah &amp; Hajj</Link></li>
            <li><Link href="/visa" className="hover:text-gold">Visa Services</Link></li>
            <li><Link href="/tours" className="hover:text-gold">Tour Packages</Link></li>
            <li><Link href="/group-tickets" className="hover:text-gold">Group Tickets</Link></li>
            <li><Link href="/insurance" className="hover:text-gold">Travel Insurance</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-text mb-3">Quick Links</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/" className="hover:text-gold">Home</Link></li>
            <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link href="/blog" className="hover:text-gold">Travel Blog</Link></li>
            <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            <li><Link href="/insurance" className="hover:text-gold">Insurance Quote</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-text mb-3">Get In Touch</div>
          <ul className="space-y-2 text-muted">
            <li>G-07, Chaudhry Arcade, New Civil Lines, Faisalabad</li>
            <li>
              <a href={waLink("Assalam o Alaikum!")} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                +92 333 651 5349
              </a>
            </li>
            <li>
              <a href="mailto:eastwestpk@hotmail.com" className="hover:text-gold">eastwestpk@hotmail.com</a>
            </li>
            <li>Mon – Sat: 9:00 AM – 8:00 PM</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span>© {new Date().getFullYear()} East &amp; West Travel Services. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-gold">About</Link>
            <Link href="/contact" className="hover:text-gold">Contact</Link>
            <Link href="/insurance" className="hover:text-gold">Insurance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
