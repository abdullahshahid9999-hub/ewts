import { prisma } from "@/lib/prisma";

function uniq(arr: (string | null | undefined)[]): string[] {
  return Array.from(new Set(arr.filter((v): v is string => !!v))).sort();
}

export async function getUmrahFacets() {
  try {
    const rows = await prisma.package.findMany({
      where: { category: "umrah", status: "active" },
      select: { destination: true, tier: true, airline: true, duration: true },
    });
    return {
      destinations: uniq(rows.map((r) => r.destination)),
      tiers: uniq(rows.map((r) => r.tier)),
      airlines: uniq(rows.map((r) => r.airline)),
      durations: uniq(rows.map((r) => r.duration)),
    };
  } catch {
    return { destinations: [], tiers: [], airlines: [], durations: [] };
  }
}

export async function getToursFacets() {
  try {
    const rows = await prisma.package.findMany({
      where: { category: "tours", status: "active" },
      select: { destination: true, tier: true, airline: true, duration: true },
    });
    return {
      destinations: uniq(rows.map((r) => r.destination)),
      tiers: uniq(rows.map((r) => r.tier)),
      airlines: uniq(rows.map((r) => r.airline)),
      durations: uniq(rows.map((r) => r.duration)),
    };
  } catch {
    return { destinations: [], tiers: [], airlines: [], durations: [] };
  }
}

export async function getGroupTicketFacets() {
  try {
    const rows = await prisma.groupFlight.findMany({
      where: { status: "active" },
      select: { route: true, airline: true, region: true },
    });
    return {
      routes: uniq(rows.map((r) => r.route)),
      airlines: uniq(rows.map((r) => r.airline)),
      regions: uniq(rows.map((r) => r.region)),
    };
  } catch {
    return { routes: [], airlines: [], regions: [] };
  }
}

export async function getVisaFacets() {
  try {
    const rows = await prisma.visaService.findMany({
      where: { status: "active" },
      select: { country: true, type: true },
    });
    return {
      countries: uniq(rows.map((r) => r.country)),
      types: uniq(rows.map((r) => r.type)),
    };
  } catch {
    return { countries: [], types: [] };
  }
}

export async function getAllFacets() {
  const [umrah, tours, groupTickets, visa] = await Promise.all([
    getUmrahFacets(), getToursFacets(), getGroupTicketFacets(), getVisaFacets(),
  ]);
  return { umrah, tours, groupTickets, visa };
}

// Parses a comma-separated query param into a clean string array — the
// convention used for all multi-select sidebar checkboxes (?tier=Gold,Platinum).
export function parseMulti(v?: string): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}
