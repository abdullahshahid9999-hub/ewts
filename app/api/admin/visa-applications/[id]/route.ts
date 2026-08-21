import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { notifyAgent } from "@/lib/notifyAgent";
import { sendEmail } from "@/lib/email";
import { emailWrap, refTable, ctaButton, waButton, uploadButton, travelersStr } from "@/lib/emailTemplates";

const VALID_STATUSES = ["pending", "under_review", "applied", "approved", "rejected", "more_info_needed"];

async function sendStatusEmail(
  app: { email: string; fullName: string; batchRef: string; uploadToken: string; adults: number; children: number; infants: number; adminNote?: string | null },
  visa: { title: string; country: string } | null,
  status: string,
  finalDocUrl?: string | null,
  isEarlyDelivery?: boolean,
) {
  const label = visa ? `${visa.country} – ${visa.title}` : "Visa";
  const travelers = travelersStr(app.adults, app.children, app.infants);
  const table = refTable(app.batchRef, label, travelers);

  let subject = "";
  let body = "";

  if (status === "under_review") {
    subject = `Your visa application is under review – ${app.batchRef}`;
    body = `
      <h2 style="color:#1C1E26;margin:0 0 16px">Application Under Review 🔍</h2>
      <p style="color:#374151;margin:0 0 8px">Dear <strong>${app.fullName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px">Your visa application is now being reviewed by our team. We are verifying your documents and details before proceeding to the next step.</p>
      ${table}
      <p style="color:#6B7280;font-size:13px">We will notify you at each stage. If we need anything additional, we will contact you directly.</p>
      ${waButton(app.batchRef)}`;

  } else if (status === "applied") {
    subject = `Application submitted to embassy – ${app.batchRef}`;
    body = `
      <h2 style="color:#1C1E26;margin:0 0 16px">Submitted to Embassy ✅</h2>
      <p style="color:#374151;margin:0 0 8px">Dear <strong>${app.fullName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px">Your <strong>${label}</strong> application has been formally submitted to the embassy/consulate on your behalf.</p>
      ${table}
      <div style="background:#F0FDF4;border-left:3px solid #22C55E;padding:12px 16px;border-radius:4px;margin:0 0 16px;font-size:13px;color:#166534">
        Processing times vary by embassy. We will keep you updated at every step.
      </div>
      ${waButton(app.batchRef)}`;

  } else if (status === "approved" && !finalDocUrl) {
    subject = `Visa approved! 🎉 – ${app.batchRef}`;
    body = `
      <h2 style="color:#15803D;margin:0 0 16px">Visa Approved! 🎉</h2>
      <p style="color:#374151;margin:0 0 8px">Dear <strong>${app.fullName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px">We are delighted to inform you that your <strong>${label}</strong> has been <strong>approved!</strong> Your visa document will be sent to you shortly.</p>
      ${table}
      ${waButton(app.batchRef)}`;

  } else if (status === "rejected") {
    subject = `Visa application update – ${app.batchRef}`;
    body = `
      <h2 style="color:#DC2626;margin:0 0 16px">Application Update</h2>
      <p style="color:#374151;margin:0 0 8px">Dear <strong>${app.fullName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px">We regret to inform you that your <strong>${label}</strong> application was not approved at this time.</p>
      ${table}
      ${app.adminNote ? `<div style="background:#FEF2F2;border-left:3px solid #DC2626;padding:12px 16px;border-radius:4px;margin:0 0 16px;font-size:13px;color:#991B1B"><strong>Reason:</strong> ${app.adminNote}</div>` : ""}
      <p style="color:#6B7280;font-size:13px">Please contact us on WhatsApp if you have questions or would like to discuss next steps.</p>
      ${waButton(app.batchRef)}`;

  } else if (status === "more_info_needed") {
    subject = `Action required – Additional documents needed – ${app.batchRef}`;
    body = `
      <h2 style="color:#D97706;margin:0 0 16px">Additional Documents Needed 📋</h2>
      <p style="color:#374151;margin:0 0 8px">Dear <strong>${app.fullName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px">We need some additional information or documents to proceed with your <strong>${label}</strong> application.</p>
      ${table}
      ${app.adminNote ? `<div style="background:#FFFBEB;border-left:3px solid #D97706;padding:12px 16px;border-radius:4px;margin:0 0 16px;font-size:13px;color:#92400E"><strong>What we need:</strong> ${app.adminNote}</div>` : ""}
      ${uploadButton(app.batchRef, app.uploadToken)}
      ${waButton(app.batchRef)}`;

  } else if (finalDocUrl) {
    const early = isEarlyDelivery ?? false;
    subject = early ? `🎉 Your visa arrived early! – ${app.batchRef}` : `Your visa is ready – ${app.batchRef}`;
    body = `
      <h2 style="color:#15803D;margin:0 0 16px">${early ? "🎉 Great News — Visa Arrived Early!" : "Your Visa is Ready! ✅"}</h2>
      <p style="color:#374151;margin:0 0 8px">Dear <strong>${app.fullName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px">${early ? `Wonderful news — your <strong>${label}</strong> arrived ahead of schedule!` : `Your <strong>${label}</strong> is ready.`} Please download it using the button below.</p>
      ${table}
      ${ctaButton(finalDocUrl, "📄 Download Your Visa")}
      <p style="color:#9CA3AF;font-size:12px;margin:4px 0 16px">If the button doesn't work: <a href="${finalDocUrl}" style="color:#B8923A">${finalDocUrl}</a></p>
      <p style="color:#6B7280;font-size:13px">We hope you have a wonderful trip! ✈️ Thank you for choosing East &amp; West Travel Services.</p>`;
  }

  if (!body) return;
  await sendEmail({ to: app.email, subject, html: emailWrap(body) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  const { status, adminNote, appliedVia, supplierName, appliedNotes, finalDocumentUrl, isEarlyDelivery } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status.` }, { status: 400 });
  }

  const existing = await prisma.visaApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isBeingApproved = status === "approved" && existing.status !== "approved" && existing.agentId && existing.commission !== null;

  const application = await prisma.$transaction(async (tx) => {
    if (isBeingApproved) {
      const netOwed = existing.totalPricePkr - (existing.commission ?? 0);
      await tx.agent.update({ where: { id: existing.agentId! }, data: { balance: { decrement: netOwed } } });
      await tx.agentTransaction.create({
        data: { agentId: existing.agentId!, amount: -netOwed, type: "debit", note: `Visa approved: ${existing.batchRef}` },
      });
    }
    return tx.visaApplication.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote: adminNote?.trim() || null }),
        ...(status === "applied" && {
          ...(appliedVia !== undefined && { appliedVia: appliedVia || null }),
          ...(supplierName !== undefined && { supplierName: supplierName?.trim() || null }),
          ...(appliedNotes !== undefined && { appliedNotes: appliedNotes?.trim() || null }),
        }),
        ...(finalDocumentUrl !== undefined && {
          finalDocumentUrl: finalDocumentUrl || null,
          finalDocumentSentAt: finalDocumentUrl ? new Date() : null,
        }),
      },
    });
  });

  if (existing.agentId && status && (status === "approved" || status === "rejected") && existing.status !== status) {
    await notifyAgent(existing.agentId,
      status === "approved" ? "Visa Approved 🎉" : "Visa Rejected",
      `${existing.batchRef} (${existing.fullName}) was ${status}.`,
      "/agent/bookings?service=visa"
    );
  }

  if (existing.email) {
    const visa = await prisma.visaService.findUnique({ where: { id: existing.visaId }, select: { country: true, title: true } });
    const emailApp = { email: existing.email, fullName: existing.fullName, batchRef: existing.batchRef, uploadToken: existing.uploadToken ?? "", adults: existing.adults, children: existing.children, infants: existing.infants, adminNote: adminNote ?? existing.adminNote };
    try {
      if (finalDocumentUrl && finalDocumentUrl !== existing.finalDocumentUrl) {
        await sendStatusEmail(emailApp, visa, "approved", finalDocumentUrl, isEarlyDelivery ?? false);
      } else if (status && status !== existing.status) {
        await sendStatusEmail(emailApp, visa, status);
      }
    } catch (e) { console.error("Visa email failed:", e); }
  }

  return NextResponse.json({ application });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  if (body.confirm !== "delete this visa") {
    return NextResponse.json({ error: "Type 'delete this visa' to confirm." }, { status: 400 });
  }
  const existing = await prisma.visaApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await prisma.visaApplication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
