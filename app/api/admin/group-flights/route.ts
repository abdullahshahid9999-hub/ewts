import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

export async function GET() {
  const groupFlights = await prisma.groupFlight.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ groupFlights });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();
  const airline = form.get("airline");
  const route = form.get("route");
  const price = form.get("price");
  if (typeof airline !== "string" || !airline || typeof route !== "string" || !route || typeof price !== "string" || !price) {
    return NextResponse.json({ error: "airline, route, and price are required." }, { status: 400 });
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let airlineLogoUrl: string | undefined;
  const file = form.get("airlineLogo");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    airlineLogoUrl = await uploadToR2({ buffer, contentType: file.type, folder: "flights" });
  }

  const seatsRaw = form.get("seats");
  const seats = typeof seatsRaw === "string" && seatsRaw ? Number(seatsRaw) : 0;

  // `legs` is the JSON array of { flightNo, from, to, depTime, arrTime },
  // one entry per leg. When present, the top-level flightNo/depTime/arrTime
  // are derived from the first/last leg so older code paths (admin list
  // table, public site cards) that only read those single fields keep
  // working without changes.
  let legs: { flightNo: string; from: string; to: string; depTime: string; arrTime: string }[] | undefined;
  const legsRaw = form.get("legs");
  if (typeof legsRaw === "string" && legsRaw) {
    try {
      const parsed = JSON.parse(legsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) legs = parsed;
    } catch {
      // ignore malformed legs payload, fall back to manual fields below
    }
  }

  const groupFlight = await prisma.groupFlight.create({
    data: {
      flightNo: legs ? legs[0].flightNo || undefined : str("flightNo"),
      airline,
      airlineCode: str("airlineCode"),
      route,
      depDate: str("depDate"),
      arrDate: str("arrDate"),
      depTime: legs ? legs[0].depTime || undefined : str("depTime"),
      arrTime: legs ? legs[legs.length - 1].arrTime || undefined : str("arrTime"),
      region: str("region"),
      tripType: str("tripType"),
      baggage: str("baggage"),
      meal: str("meal"),
      price,
      airlineLogoUrl,
      seats: Number.isFinite(seats) ? seats : 0,
      status: str("status") ?? "active",
      legs,
    },
  });

  return NextResponse.json({ groupFlight }, { status: 201 });
}
