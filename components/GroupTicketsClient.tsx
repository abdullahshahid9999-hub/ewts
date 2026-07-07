"use client";

import { useState } from "react";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

type Flight = {
  id: string;
  airline: string;
  airlineLogoUrl: string | null;
  route: string;
  depDate: string | null;
  depTime: string | null;
  arrDate: string | null;
  baggage: string | null;
  meal: string | null;
  price: string;
  seats: number;
};

const FEATURES = [
  { title: "Min 10 Seats", desc: "Special negotiated group fares starting from 10 passengers" },
  { title: "Best Group Rates", desc: "Up to 30% cheaper than individual tickets" },
  { title: "Group Check-In", desc: "Coordinated check-in and seat blocking for your group" },
];

function BookingModal({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [passport, setPassport] = useState("");
  const [seats, setSeats] = useState("1");
  const [travelClass, setTravelClass] = useState("Economy");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = [
      "Assalam o Alaikum! I'd like to book a group ticket:",
      `Flight: ${flight.airline} — ${flight.route}`,
      `Name: ${firstName} ${lastName}`,
      `WhatsApp: ${whatsapp}`,
      email ? `Email: ${email}` : null,
      `Passport No: ${passport}`,
      `Seats: ${seats}`,
      `Class: ${travelClass}`,
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl font-semibold mb-1">Book Your Seat</h2>
        <p className="text-muted text-xs mb-4">
          Your booking details will be sent to our WhatsApp team for confirmation
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input required placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <input required placeholder="WhatsApp Number *" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input required placeholder="Passport No *" value={passport} onChange={(e) => setPassport(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input required type="number" min={1} placeholder="No. of Seats *" value={seats} onChange={(e) => setSeats(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option>Economy</option>
            <option>Business</option>
            <option>First Class</option>
          </select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-gold hover:bg-gold-light text-black font-bold px-3 py-2 text-sm">
              Confirm via WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupTicketsClient({ flights }: { flights: Flight[] }) {
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pb-16">
        {flights.length === 0 ? (
          <p className="text-muted text-center">
            No group flights are listed right now — WhatsApp us for current availability.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flights.map((f) => (
              <div key={f.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-5 flex gap-4">
                <div className="relative w-16 h-16 shrink-0 bg-surface rounded-lg overflow-hidden">
                  {f.airlineLogoUrl && <Image src={f.airlineLogoUrl} alt={f.airline} fill className="object-contain" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">{f.airline}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${f.seats > 0 ? "bg-gold/10 text-gold" : "bg-muted/20 text-muted"}`}>
                      {f.seats > 0 ? `${f.seats} seats left` : "Sold out"}
                    </span>
                  </div>
                  <p className="text-muted text-sm mb-1">{f.route}</p>
                  <p className="text-muted text-sm mb-1">
                    {f.depDate} {f.depTime ? `· ${f.depTime}` : ""} {f.arrDate ? `→ ${f.arrDate}` : ""}
                  </p>
                  {f.baggage && <p className="text-muted text-xs mb-1">Baggage: {f.baggage}</p>}
                  {f.meal && <p className="text-muted text-xs mb-2">Meal: {f.meal}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-display text-xl font-semibold text-gold">{f.price}</span>
                    <button
                      onClick={() => setBookingFlight(f)}
                      disabled={f.seats <= 0}
                      className="text-sm font-semibold text-gold hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      Book This Seat →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[var(--surface)] py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="font-display text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {bookingFlight && <BookingModal flight={bookingFlight} onClose={() => setBookingFlight(null)} />}
    </>
  );
}
