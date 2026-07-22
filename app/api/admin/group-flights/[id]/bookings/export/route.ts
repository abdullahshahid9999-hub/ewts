import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const flight = await prisma.groupFlight.findUnique({ where: { id } });
  if (!flight) return NextResponse.json({ error: "Flight not found." }, { status: 404 });

  const [directBookings, agentBookings] = await Promise.all([
    prisma.booking.findMany({ where: { groupFlightId: id }, orderBy: { createdAt: "desc" } }),
    prisma.agentBooking.findMany({
      where: { groupFlightId: id, serviceType: "group_ticket" },
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { agentCode: true, fullName: true } } },
    }),
  ]);

  // Both booking sources (B2C direct + agent-sold) merged into one sheet,
  // clearly tagged by "Source", since admin wants "all bookings for this
  // flight" in one download, not two separate files to reconcile.
  const rows = [
    ...directBookings.map((b) => ({
      "Source": "Direct (B2C)",
      "Booking Ref / PNR": b.bookingRef,
      "Ticket No.": "",
      "Agent": "",
      "Customer Name": b.customerName ?? "",
      "Phone": b.phone ?? "",
      "Email": b.email ?? "",
      "Passport": b.passport ?? "",
      "Class": b.travelClass ?? "",
      "Adults": b.adults ?? "",
      "Children": b.children ?? "",
      "Infants": b.infants ?? "",
      "Seats": b.seatsRequested ?? "",
      "Sell Price (PKR)": b.totalPricePkr ?? "",
      "Status": b.status,
      "Booked At": b.createdAt.toISOString(),
    })),
    ...agentBookings.map((b) => ({
      "Source": "Agent",
      "Booking Ref / PNR": b.bookingRef,
      "Ticket No.": b.ticketNumber ?? "",
      "Agent": `${b.agent.agentCode} — ${b.agent.fullName}`,
      "Customer Name": b.customerName ?? "",
      "Phone": b.customerPhone ?? "",
      "Email": b.customerEmail ?? "",
      "Passport": "",
      "Class": b.roomTypeLabel ?? "",
      "Adults": b.adults ?? "",
      "Children": b.children ?? "",
      "Infants": b.infants ?? "",
      "Seats": "",
      "Sell Price (PKR)": b.sellPrice ?? "",
      "Status": b.status,
      "Booked At": b.createdAt.toISOString(),
    })),
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const safeRoute = flight.route.replace(/[^a-z0-9]/gi, "-");
  const filename = `flight-${flight.flightNo ?? safeRoute}-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
