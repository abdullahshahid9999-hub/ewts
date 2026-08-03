import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { notifyAgent } from "@/lib/notifyAgent";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "status must be 'approved' or 'rejected'." }, { status: 400 });
  }

  const slip = await prisma.paymentSlip.findUnique({ where: { id } });
  if (!slip) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (slip.status !== "pending") {
    return NextResponse.json({ error: "This slip has already been reviewed." }, { status: 400 });
  }

  if (status === "approved") {
    // Credit the agent's balance and record the transaction atomically —
    // if either write fails, neither should apply.
    await prisma.$transaction([
      prisma.paymentSlip.update({ where: { id }, data: { status, note: body?.note } }),
      prisma.agent.update({ where: { id: slip.agentId }, data: { balance: { increment: slip.amount } } }),
      prisma.agentTransaction.create({
        data: {
          agentId: slip.agentId,
          amount: slip.amount,
          type: "credit",
          note: `Payment slip approved (slip ${slip.id})`,
        },
      }),
    ]);
  } else {
    await prisma.paymentSlip.update({ where: { id }, data: { status, note: body?.note } });
  }

  await notifyAgent(
    slip.agentId,
    status === "approved" ? "Top-up Approved 🎉" : "Top-up Rejected",
    status === "approved" ? `PKR ${slip.amount.toLocaleString()} has been credited to your balance.` : (body?.note || "Your top-up request was rejected."),
    "/agent/topup"
  );

  const updated = await prisma.paymentSlip.findUnique({ where: { id } });
  return NextResponse.json({ paymentSlip: updated });
}
