import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          Contact
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
          Get in <span className="italic text-gold">touch.</span>
        </h1>
        <p className="text-muted text-lg mb-10">
          The fastest way to reach us is WhatsApp — most enquiries get a
          reply within minutes during business hours.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-2">Visit Us</h3>
            <p className="text-muted text-sm">
              G-07, Chaudhry Arcade, New Civil Lines, Faisalabad, Pakistan
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-2">Call / WhatsApp</h3>
            <a
              href={waLink("Assalam o Alaikum!")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline text-sm font-semibold"
            >
              +92 333 651 5349
            </a>
          </div>
        </div>

        <a
          href={waLink("Assalam o Alaikum! I'd like to get in touch about your travel services.")}
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
