"use client";

import { useState } from "react";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

type Flight = {
  id: string;
  flightNo: string | null;
  airline: string;
  airlineLogoUrl: string | null;
  route: string;
  depDate: string | null;
  depTime: string | null;
  arrTime: string | null;
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

  // Group into one table per airline + route, matching the reference
  // layout (one ticket-style table per flight/route combination).
  const groups = new Map<string, Flight[]>();
  for (const f of flights) {
    const key = `${f.airline}|${f.route}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-10">
        {flights.length === 0 ? (
          <p className="text-muted text-center">
            No group flights are listed right now — WhatsApp us for current availability.
          </p>
        ) : (
          Array.from(groups.entries()).map(([key, group]) => {
            const first = group[0];
            return (
              <div key={key} className="rounded-2xl overflow-hidden border border-border shadow-sm">
                {/* Airline + route header */}
                <div className="bg-white flex items-center justify-center gap-4 py-4 px-4 border-b border-border">
                  {first.airlineLogoUrl && (
                    <div className="relative w-10 h-10 shrink-0">
                      <Image src={first.airlineLogoUrl} alt={first.airline} fill className="object-contain" />
                    </div>
                  )}
                  <span className="font-display font-semibold text-lg">{first.airline}</span>
                  <span className="text-muted">✈</span>
                  <span className="font-display font-semibold text-lg tracking-wide">{first.route}</span>
                </div>

                {/* Ticket table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="bg-[var(--navy)] text-white text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Flight</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-left">Destination</th>
                        <th className="px-4 py-3 text-left">Bag</th>
                        <th className="px-4 py-3 text-left">Meal</th>
                        <th className="px-4 py-3 text-left">Fare</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((f, i) => (
                        <tr
                          key={f.id}
                          className={`text-white ${i % 2 === 0 ? "bg-[#0d2136]" : "bg-[#0a1a2b]"}`}
                        >
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">{f.flightNo ?? "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">✈ {f.depDate ?? "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {f.depTime ?? "—"}{f.arrTime ? ` - ${f.arrTime}` : ""}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{f.route.replace("-", "→").replace(" to ", "→")}</td>
                          <td className="px-4 py-3 whitespace-nowrap">🧳 {f.baggage ?? "—"}</td>
                          <td className={`px-4 py-3 font-semibold ${f.meal === "No" ? "text-red-400" : "text-green-400"}`}>
                            {f.meal ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">{f.price}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setBookingFlight(f)}
                              disabled={f.seats <= 0}
                              className="border border-gold text-gold hover:bg-gold hover:text-black font-semibold text-xs px-4 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {f.seats > 0 ? "Book Now" : "Sold Out"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
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
