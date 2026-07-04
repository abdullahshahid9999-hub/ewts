import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          About Us
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
          East &amp; West Travel Services
        </h1>
        <p className="text-muted text-lg mb-6">
          Based in Faisalabad, Pakistan, East &amp; West Travel Services has
          been arranging Umrah trips, tours, group air tickets, visas and
          travel insurance for families and agents across the country for
          over two decades.
        </p>
        <p className="text-muted mb-6">
          We are IATA / DTS certified and work directly with airlines,
          hotels, and insurance partners to keep our pricing transparent and
          our service reliable — from the first enquiry to the day you fly.
        </p>
        <p className="text-muted mb-10">
          Whether you&apos;re booking Umrah for your family, arranging a group of
          fifty for a wholesale fare, or need a same-week visa turnaround,
          our team handles the details so you don&apos;t have to.
        </p>
        <a
          href={waLink("Assalam o Alaikum! I'd like to know more about East & West Travel Services.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
        >
          WhatsApp Us
        </a>
      </section>
      <Footer />
    </>
  );
}
