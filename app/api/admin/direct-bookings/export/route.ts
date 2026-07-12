import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_CATEGORIES = ["umrah", "tours", "group_ticket"] as const;
const VALID_STATUSES = ["pending", "confirmed", "cancelled"] as const;

// Exports the same filtered set the Direct Bookings admin list shows, as
// a real downloadable .xlsx file — same category/status query params as
// GET /api/admin/direct-bookings, so "Export to Excel" always matches
// whatever's currently on screen.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "all" && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    where.status = status;
  }
  if (category && category !== "all" && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    if (category === "group_ticket") {
      where.groupFlightId = { not: null };
    } else {
      where.package = { category };
    }
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      package: { select: { name: true, category: true } },
      groupFlight: { select: { airline: true, route: true, flightNo: true, depDate: true } },
    },
  });

  const rows = bookings.map((b) => ({
    "Booking Ref": b.bookingRef,
    "Type": b.groupFlightId ? "Group Ticket" : b.package?.category === "tours" ? "World Tour" : "Umrah",
    "Package / Flight": b.groupFlightId
      ? `${b.groupFlight?.airline ?? ""} — ${b.groupFlight?.route ?? ""} (${b.groupFlight?.flightNo ?? "—"})`
      : b.package?.name ?? "",
    "Customer Name": b.customerName ?? "",
    "Phone": b.phone ?? "",
    "Email": b.email ?? "",
    "Passport/CNIC": b.passport ?? "",
    "Room Type / Class": b.roomTypeLabel ?? b.travelClass ?? "",
    "Adults": b.adults ?? "",
    "Children": b.children ?? "",
    "Infants": b.infants ?? "",
    "Seats Requested": b.seatsRequested ?? "",
    "Total Price (PKR)": b.totalPricePkr ?? "",
    "Special Requests": b.specialRequests ?? "",
    "Status": b.status,
    "Booked At": b.createdAt.toISOString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const filename = `direct-bookings-${category || "all"}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
