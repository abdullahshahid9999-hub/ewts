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

  const groupFlight = await prisma.groupFlight.create({
    data: {
      flightNo: str("flightNo"),
      airline,
      airlineCode: str("airlineCode"),
      route,
      depDate: str("depDate"),
      arrDate: str("arrDate"),
      depTime: str("depTime"),
      baggage: str("baggage"),
      meal: str("meal"),
      price,
      airlineLogoUrl,
      seats: Number.isFinite(seats) ? seats : 0,
      status: str("status") ?? "active",
    },
  });

  return NextResponse.json({ groupFlight }, { status: 201 });
}
