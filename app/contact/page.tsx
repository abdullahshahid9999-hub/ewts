"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WHATSAPP_NUMBER, waLink } from "@/lib/whatsapp";

const TRUST_STRIP = [
  { title: "Fast Response", desc: "Reply within 2–4 hrs" },
  { title: "WhatsApp First", desc: "4 numbers available" },
  { title: "IATA Certified", desc: "Trusted & accredited" },
  { title: "5,000+ Travelers", desc: "Happy customers served" },
];

const OFFICE_HOURS = [
  ["Monday", "09:00 AM – 07:00 PM"],
  ["Tuesday", "09:00 AM – 07:00 PM"],
  ["Wednesday", "09:00 AM – 07:00 PM"],
  ["Thursday", "09:00 AM – 07:00 PM"],
  ["Friday", "09:00 AM – 07:00 PM (Break 1–2 PM)"],
  ["Saturday", "10:00 AM – 06:00 PM"],
  ["Sunday", "Online Only / By Appointment"],
];

const WHATSAPP_NUMBERS = [
  { number: "923336515349", display: "+92 333 651 5349", label: "Primary WhatsApp" },
  { number: "923136515349", display: "+92 313 651 5349", label: "WhatsApp" },
  { number: "923217634035", display: "+92 321 763 4035", label: "WhatsApp" },
  { number: "923017977548", display: "+92 301 797 7548", label: "WhatsApp" },
];

const SERVICES = [
  { group: "Umrah & Hajj", items: ["Umrah Package — Economy (7 Nights)", "Umrah Package — Premium (14 Nights)"] },
  { group: "Holiday Tours", items: ["Dubai Premium Tour", "Thailand Adventure", "Bali Honeymoon Package", "Family Holiday Package"] },
  { group: "Other Services", items: ["Visa Assistance", "Air Ticket Booking", "Hotel Booking", "General Inquiry"] },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
  "Flexible / Not Sure",
];

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [travelers, setTravelers] = useState("");
  const [month, setMonth] = useState("");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState("WhatsApp (Fastest)");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No contact-form backend/inbox exists in this rebuild — the site is
    // WhatsApp-first by design, so the inquiry is composed into a WhatsApp
    // message instead of stored server-side. Everything the live site's
    // form field asks for is preserved in the message text.
    const lines = [
      "Assalam o Alaikum! New inquiry from the website:",
      `Name: ${fullName}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      `Service: ${service}`,
      travelers ? `Travelers: ${travelers}` : null,
      month ? `Preferred month: ${month}` : null,
      `Message: ${message}`,
      `Preferred contact method: ${contactMethod}`,
    ].filter(Boolean);

    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-20 pb-16">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">Get In Touch</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6">
          Let&apos;s Plan Your <span className="italic text-gold">Dream Journey</span>
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Our travel experts are ready to craft the perfect journey for you. Reach out via
          WhatsApp, email, or walk into our Faisalabad office — we respond fast.
        </p>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {TRUST_STRIP.map((t) => (
          <div key={t.title}>
            <p className="font-display font-semibold text-gold">{t.title}</p>
            <p className="text-muted text-xs mt-1">{t.desc}</p>
          </div>
        ))}
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* GET IN TOUCH DETAILS */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-1">
            Get In <span className="italic text-gold">Touch</span>
          </h2>
          <p className="text-muted text-sm mb-6">Multiple ways to reach us — we respond quickly!</p>

          <div className="space-y-5 mb-8">
            <div>
              <h3 className="font-semibold text-sm mb-1">Office Address</h3>
              <p className="text-muted text-sm">
                G-07, Chaudhry Arcade, Regency Road,<br />
                New Civil Lines, Faisalabad, Punjab, Pakistan
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Email Address</h3>
              <a href="mailto:eastwestpk@hotmail.com" className="text-gold hover:underline text-sm">
                eastwestpk@hotmail.com
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Office Hours</h3>
              <table className="w-full text-sm text-muted">
                <tbody>
                  {OFFICE_HOURS.map(([day, hours]) => (
                    <tr key={day} className="border-b border-border last:border-0">
                      <td className="py-1 pr-4 font-medium text-[var(--text)]">{day}</td>
                      <td className="py-1">{hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-3">WhatsApp Numbers</h3>
            <div className="grid grid-cols-2 gap-3">
              {WHATSAPP_NUMBERS.map((w) => (
                <a
                  key={w.number}
                  href={`https://wa.me/${w.number}?text=${encodeURIComponent("Assalam o Alaikum! I need help with a travel package.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:border-gold"
                >
                  <span className="block font-semibold">{w.display}</span>
                  <span className="text-muted text-xs">{w.label}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Follow Us</h3>
            <div className="flex gap-4 text-sm">
              <a href="https://www.instagram.com/eastwest_pk/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Instagram</a>
              <a href="https://www.facebook.com/p/East-West-Travel-Services-100063816463202/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Facebook</a>
              <a href={waLink("Assalam o Alaikum!")} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">WhatsApp</a>
            </div>
          </div>
        </section>

        {/* INQUIRY FORM */}
        <section className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold mb-1">
            Send Us an <span className="italic text-gold">Inquiry</span>
          </h2>
          <p className="text-muted text-sm mb-6">
            Fill the form below and we&apos;ll get back to you within 24 hours.
          </p>

          {sent ? (
            <div className="text-center py-8">
              <h3 className="font-display text-xl font-semibold mb-2">Inquiry Sent Successfully!</h3>
              <p className="text-muted text-sm mb-4">
                Thank you for reaching out. Our team will contact you within <strong>24 hours</strong>.
              </p>
              <p className="text-muted text-sm mb-4">For a faster response, WhatsApp us directly:</p>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline">
                +92 333 651 5349
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                placeholder="Full Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Phone / WhatsApp *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">— Select a service —</option>
                {SERVICES.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((i) => <option key={i} value={i}>{i}</option>)}
                  </optgroup>
                ))}
              </select>
              <input
                type="number"
                min={1}
                placeholder="Number of Travelers"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">— Select —</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea
                required
                placeholder="Your Message *"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <div>
                <p className="text-sm font-medium mb-1">Preferred Contact Method</p>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <option>WhatsApp (Fastest)</option>
                  <option>Phone Call</option>
                  <option>Email</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
              >
                Send Inquiry
              </button>
              <p className="text-muted text-xs text-center">
                Your information is completely safe with us. We never share your data.
              </p>
            </form>
          )}
        </section>
      </div>

      {/* MAP */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h3 className="font-display text-xl font-semibold mb-4">East &amp; West Travel Services</h3>
        <p className="text-muted text-sm mb-4">
          G-07, Chaudhry Arcade, Regency Road, New Civil Lines, Faisalabad, Punjab, Pakistan
        </p>
        <a
          href="https://maps.google.com/?q=New+Civil+Lines+Faisalabad"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-4 text-gold text-sm font-semibold hover:underline"
        >
          Get Directions →
        </a>
        <div className="rounded-2xl overflow-hidden border border-border">
          <iframe
            title="East & West Travel Services location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d108907.74632073694!2d72.9523786!3d31.4504407!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3922693f0b5b1b6f%3A0x8b4c0f5e2a4e5b9d!2sFaisalabad%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000"
            width="100%"
            height="350"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
