import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { notifyAgent } from "@/lib/notifyAgent";
import { sendEmail } from "@/lib/email";

const VALID_STATUSES = ["pending", "under_review", "applied", "approved", "rejected", "more_info_needed"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  const { status, adminNote } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const existing = await prisma.visaApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  // Same convention as AgentBooking issuance: debit the agent's balance
  // and log an AgentTransaction the moment a decision moves an
  // agent-submitted application into "approved" — never on direct/B2C
  // applications (agentId null, commission null, nothing to charge).
  // Known edge case (documented for bookings too, applies here as well):
  // if a booking somehow goes approved → rejected → approved again this
  // would fire a second time. Not currently guarded against.
  const isBeingApproved = status === "approved" && existing.status !== "approved" && existing.agentId && existing.commission !== null;

  const application = await prisma.$transaction(async (tx) => {
    if (isBeingApproved) {
      const netOwed = existing.totalPricePkr - (existing.commission ?? 0);
      await tx.agent.update({ where: { id: existing.agentId! }, data: { balance: { decrement: netOwed } } });
      await tx.agentTransaction.create({
        data: { agentId: existing.agentId!, amount: -netOwed, type: "debit", note: `Visa application approved: ${existing.batchRef}` },
      });
    }
    return tx.visaApplication.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote: adminNote?.trim() || null }),
      },
    });
  });

  if (existing.agentId && status && (status === "approved" || status === "rejected") && existing.status !== status) {
    await notifyAgent(
      existing.agentId,
      status === "approved" ? "Visa Approved 🎉" : "Visa Rejected",
      `Application ${existing.batchRef} (${existing.fullName}) was ${status}.`,
      "/agent/bookings?service=visa"
    );
  }

  // Email applicant when status moves to "applied" (embassy submitted)
  if (status === "applied" && existing.status !== "applied" && existing.email) {
    const visa = await prisma.visaService.findUnique({ where: { id: existing.visaId }, select: { country: true, title: true, type: true } });
    const label = visa ? `${visa.country} – ${visa.title}` : "Visa";
    try {
      await sendEmail({
        to: existing.email,
        subject: `Your visa application has been submitted – ${label}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#1C1E26">Application Submitted ✅</h2>
            <p style="color:#374151">Dear <strong>${existing.fullName}</strong>,</p>
            <p style="color:#374151">We are pleased to inform you that your <strong>${label}</strong> application has been formally submitted to the concerned embassy/consulate on your behalf.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
              <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6">Reference</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid #F3F4F6">${existing.batchRef}</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280">Travelers</td><td style="padding:8px 0;font-weight:700">${existing.adults}A${existing.children > 0 ? ` ${existing.children}C` : ""}${existing.infants > 0 ? ` ${existing.infants}I` : ""}</td></tr>
            </table>
            <p style="color:#374151">Processing time varies by embassy. We will keep you updated at every stage. For queries, contact us on WhatsApp.</p>
            <p style="color:#9CA3AF;font-size:12px;margin-top:32px">East &amp; West Travel Services · eastwestpk.com<br>Chaudhry Arcade, Regency Road, New Civil Lines, Faisalabad</p>
          </div>`,
      });
    } catch (e) { console.error("Applied email failed:", e); }
  }

  return NextResponse.json({ application });
}

// DELETE — hard delete a visa application (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  // Require typed confirmation to prevent accidental deletes
  if (body.confirm !== "delete this visa") {
    return NextResponse.json({ error: "Type 'delete this visa' to confirm." }, { status: 400 });
  }

  const existing = await prisma.visaApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.visaApplication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
