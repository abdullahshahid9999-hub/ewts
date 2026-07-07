import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GroupTicketsClient from "@/components/GroupTicketsClient";

export const revalidate = 120;

async function getFlights() {
  try {
    return await prisma.groupFlight.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function GroupTicketsPage() {
  const flights = await getFlights();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-14">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          Group Ticketing
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Group Air <span className="italic text-gold">Tickets</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-4">
          Fixed departures — special group fares for 10+ passengers
        </p>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <span>Group Tickets</span>
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pt-10 text-center">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">Select Destination</p>
        <h2 className="font-display text-2xl font-semibold mb-2">
          Choose Your <span className="italic text-gold">Category</span>
        </h2>
        <p className="text-muted text-sm mb-10">Click a category to see available group flights</p>
        <h3 className="font-display text-xl font-semibold mb-6">
          Available <span className="italic text-gold">Departures</span>
        </h3>
      </section>

      <GroupTicketsClient flights={flights} />

      <Footer />
    </>
  );
}
