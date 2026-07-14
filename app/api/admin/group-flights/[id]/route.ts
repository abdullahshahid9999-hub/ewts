import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.groupFlight.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
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
  const seats = typeof seatsRaw === "string" && seatsRaw ? Number(seatsRaw) : undefined;

  // Same legs-derives-single-fields logic as the create route (see there
  // for the rationale) — kept in sync so editing a flight doesn't drift
  // the backward-compat fields out of step with its legs.
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

  const groupFlight = await prisma.groupFlight.update({
    where: { id },
    data: {
      flightNo: legs ? legs[0].flightNo || undefined : str("flightNo"),
      airline: str("airline"),
      airlineCode: str("airlineCode"),
      route: str("route"),
      depDate: str("depDate"),
      arrDate: str("arrDate"),
      depTime: legs ? legs[0].depTime || undefined : str("depTime"),
      arrTime: legs ? legs[legs.length - 1].arrTime || undefined : str("arrTime"),
      region: str("region"),
      tripType: str("tripType"),
      baggage: str("baggage"),
      meal: str("meal"),
      price: str("price"),
      airlineLogoUrl,
      seats: seats !== undefined && Number.isFinite(seats) ? seats : undefined,
      status: str("status"),
      legs,
    },
  });

  return NextResponse.json({ groupFlight });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.groupFlight.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
