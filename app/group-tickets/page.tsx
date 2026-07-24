import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GroupTicketsClient from "@/components/GroupTicketsClient";
import SearchResultsNotice from "@/components/SearchResultsNotice";
import { getGroupTicketFacets, parseMulti } from "@/lib/filterFacets";
import FilterSidebar from "@/components/FilterSidebar";

export const revalidate = 120;

async function getFlights(q?: string, airline?: string, direct?: string) {
  const airlines = parseMulti(airline);
  try {
    const flights = await prisma.groupFlight.findMany({
      where: {
        status: "active",
        ...(airlines.length ? { airline: { in: airlines } } : {}),
        ...(q ? { OR: [
          { airline: { contains: q, mode: "insensitive" } },
          { route: { contains: q, mode: "insensitive" } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    // "Direct only" can't be a Prisma where-clause since legs is JSON —
    // filtered in-memory instead (list sizes here are small).
    if (direct === "1") {
      return flights.filter((f) => !Array.isArray(f.legs) || (f.legs as unknown[]).length <= 1);
    }
    return flights;
  } catch {
    return [];
  }
}

export default async function GroupTicketsPage({ searchParams }: { searchParams: Promise<{ q?: string; airline?: string; direct?: string }> }) {
  const { q, airline, direct } = await searchParams;
  const [flights, facets] = await Promise.all([getFlights(q, airline, direct), getGroupTicketFacets()]);

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
        <div className="text-left mb-6"><SearchResultsNotice q={q} basePath="/group-tickets" /></div>
        <h3 className="font-display text-xl font-semibold mb-6">
          Available <span className="italic text-gold">Departures</span>
        </h3>
      </section>

      <section className="max-w-6xl mx-auto px-6">
        <div className="flex gap-8 items-start">
          <Suspense fallback={null}>
            <FilterSidebar
              groups={[{ key: "airline", label: "Airline", options: facets.airlines }]}
              showDirectToggle
            />
          </Suspense>
          <div className="flex-1 min-w-0">
            <GroupTicketsClient flights={flights} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
