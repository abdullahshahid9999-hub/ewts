import { waLink } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-text2">
        <div>
          <div className="font-display text-xl font-semibold mb-2">
            East <span className="text-gold italic">&amp;</span> West Travel
          </div>
          <p className="text-muted">
            IATA/DTS certified travel agency in Faisalabad, Pakistan — serving
            travellers since 2003.
          </p>
        </div>
        <div>
          <div className="font-semibold text-text mb-2">Contact</div>
          <p className="text-muted">G-07, Chaudhry Arcade, New Civil Lines, Faisalabad</p>
          <a href={waLink("Assalam o Alaikum!")} className="text-gold hover:underline">
            +92 333 651 5349
          </a>
        </div>
        <div>
          <div className="font-semibold text-text mb-2">Services</div>
          <ul className="space-y-1 text-muted">
            <li>Umrah Packages</li>
            <li>Tour Packages</li>
            <li>Group Air Tickets</li>
            <li>Visa Services</li>
            <li>Travel Insurance</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-muted py-6 border-t border-border">
        © {new Date().getFullYear()} East & West Travel Services. All rights reserved.
      </div>
    </footer>
  );
}
