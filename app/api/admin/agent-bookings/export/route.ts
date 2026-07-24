import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Downloadable ticket/booking list, including supplier attribution and
// agency margin (sellPrice - supplierCost - commission) per row — this is
// the report the owner asked for to reconcile against suppliers.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const bookings = await prisma.agentBooking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { agentCode: true, fullName: true } },
      groupFlight: { select: { airline: true, route: true, flightNo: true, supplier: { select: { name: true } } } },
      package: { select: { name: true } },
    },
  });

  const rows = bookings.map((b) => {
    const margin = b.status === "issued"
      ? b.sellPrice - b.commission - (b.supplierCostPkr ?? 0)
      : "";
    return {
      "Booking Ref": b.bookingRef,
      "Ticket No.": b.ticketNumber ?? "",
      "Agent": `${b.agent.agentCode} — ${b.agent.fullName}`,
      "Service": b.serviceType,
      "Package / Flight": b.groupFlight
        ? `${b.groupFlight.airline} — ${b.groupFlight.route} (${b.groupFlight.flightNo ?? "—"})`
        : b.package?.name ?? "",
      "Supplier": b.groupFlight?.supplier?.name ?? "Own Inventory",
      "Sell Price (PKR)": b.sellPrice,
      "Agent Commission (PKR)": b.commission,
      "Supplier Cost (PKR)": b.supplierCostPkr ?? "",
      "Agency Margin (PKR)": margin,
      "Customer": b.customerName ?? "",
      "Phone": b.customerPhone ?? "",
      "Status": b.status,
      "Issued On": b.issuedAt ? b.issuedAt.toISOString() : "",
      "Created At": b.createdAt.toISOString(),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Agent Bookings");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="agent-bookings-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
