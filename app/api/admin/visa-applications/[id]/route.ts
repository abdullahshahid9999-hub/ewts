import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { notifyAgent } from "@/lib/notifyAgent";
import { sendEmail } from "@/lib/email";

const VALID_STATUSES = ["pending", "under_review", "applied", "approved", "rejected", "more_info_needed"];

// ── Email helpers ──────────────────────────────────────────────────────────────

const BASE = "https://eastwestpk.com";
const FOOTER = `<p style="color:#9CA3AF;font-size:12px;margin-top:32px;border-top:1px solid #F3F4F6;padding-top:16px">
  East &amp; West Travel Services · IATA Certified<br>
  Chaudhry Arcade, Regency Road, New Civil Lines, Faisalabad<br>
  WhatsApp: <a href="https://wa.me/923336515349" style="color:#B8923A">+92 333 651 5349</a> · <a href="${BASE}" style="color:#B8923A">eastwestpk.com</a>
</p>`;

function wrap(body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1E26">
    <div style="margin-bottom:24px"><img src="${BASE}/logo.png" height="36" alt="East & West Travel" onerror="this.style.display='none'" />
      <span style="font-size:18px;font-weight:700;color:#B8923A;margin-left:8px">East &amp; West Travel</span></div>
    ${body}
    ${FOOTER}
  </div>`;
}

function infoRow(label: string, value: string) {
  return `<tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6;font-size:13px">${label}</td>
    <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #F3F4F6;font-size:13px">${value}</td></tr>`;
}

async function sendStatusEmail(
  app: { email: string; fullName: string; batchRef: string; adults: number; children: number; infants: number; adminNote?: string | null },
  visa: { title: string; country: string } | null,
  status: string,
  finalDocUrl?: string | null,
  isEarlyDelivery?: boolean,
) {
  const label = visa ? `${visa.country} – ${visa.title}` : "Visa";
  const travelersStr = `${app.adults} Adult${app.adults > 1 ? "s" : ""}${app.children > 0 ? `, ${app.children} Child${app.children > 1 ? "ren" : ""}` : ""}${app.infants > 0 ? `, ${app.infants} Infant${app.infants > 1 ? "s" : ""}` : ""}`;

  const table = `<table style="width:100%;border-collapse:collapse;margin:20px 0">${infoRow("Reference", app.batchRef)}${infoRow("Visa", label)}${infoRow("Travelers", travelersStr)}</table>`;

  let subject = "";
  let html = "";

  if (status === "under_review") {
    subject = `Your visa application is under review – ${app.batchRef}`;
    html = wrap(`
      <h2 style="color:#1C1E26;margin-bottom:4px">Application Under Review 🔍</h2>
      <p>Dear <strong>${app.fullName}</strong>,</p>
      <p>Your <strong>${label}</strong> application is now being reviewed by our visa team. We are verifying all documents and details before proceeding.</p>
      ${table}
      <p>We will update you at each step. If we need anything, we will reach out directly.</p>
    `);
  } else if (status === "applied") {
    subject = `Your visa application has been submitted to the embassy – ${app.batchRef}`;
    html = wrap(`
      <h2 style="color:#1C1E26;margin-bottom:4px">Application Submitted to Embassy ✅</h2>
      <p>Dear <strong>${app.fullName}</strong>,</p>
      <p>Great news! Your <strong>${label}</strong> application has been formally submitted to the concerned embassy/consulate on your behalf.</p>
      ${table}
      <p>Processing times vary by embassy. We will notify you as soon as there is any update.</p>
      <p style="background:#FEF9EE;border-left:3px solid #B8923A;padding:10px 14px;border-radius:4px;font-size:13px">
        💬 For any queries, please contact us on <strong>WhatsApp</strong> and mention your reference number <strong>${app.batchRef}</strong>.
      </p>
    `);
  } else if (status === "approved" && !finalDocUrl) {
    subject = `Visa Approved! 🎉 – ${app.batchRef}`;
    html = wrap(`
      <h2 style="color:#15803D;margin-bottom:4px">Visa Approved! 🎉</h2>
      <p>Dear <strong>${app.fullName}</strong>,</p>
      <p>We are thrilled to inform you that your <strong>${label}</strong> has been <strong>approved</strong>! Your visa document will be delivered to you shortly.</p>
      ${table}
      <p>We will send you another email as soon as your visa document is ready. Please keep your phone/email accessible.</p>
    `);
  } else if (status === "rejected") {
    subject = `Visa Application Update – ${app.batchRef}`;
    html = wrap(`
      <h2 style="color:#DC2626;margin-bottom:4px">Application Status Update</h2>
      <p>Dear <strong>${app.fullName}</strong>,</p>
      <p>We regret to inform you that your <strong>${label}</strong> application has not been approved at this time.</p>
      ${table}
      ${app.adminNote ? `<div style="background:#FEF2F2;border-left:3px solid #DC2626;padding:10px 14px;border-radius:4px;margin:16px 0;font-size:13px"><strong>Reason:</strong> ${app.adminNote}</div>` : ""}
      <p>Please contact us on WhatsApp if you have any questions or would like to discuss next steps. We are here to help.</p>
    `);
  } else if (status === "more_info_needed") {
    subject = `Additional information required – ${app.batchRef}`;
    html = wrap(`
      <h2 style="color:#D97706;margin-bottom:4px">Additional Information Needed 📋</h2>
      <p>Dear <strong>${app.fullName}</strong>,</p>
      <p>We need some additional information or documents to proceed with your <strong>${label}</strong> application.</p>
      ${table}
      ${app.adminNote ? `<div style="background:#FFFBEB;border-left:3px solid #D97706;padding:10px 14px;border-radius:4px;margin:16px 0;font-size:13px"><strong>Details:</strong> ${app.adminNote}</div>` : ""}
      <p>Please contact us on WhatsApp as soon as possible and mention your reference number <strong>${app.batchRef}</strong>.</p>
    `);
  } else if (finalDocUrl) {
    const isEarly = isEarlyDelivery ?? false;
    subject = isEarly ? `🎉 Great news! Your visa arrived early – ${app.batchRef}` : `Your visa is ready – ${app.batchRef}`;
    html = wrap(`
      <h2 style="color:#15803D;margin-bottom:4px">${isEarly ? "🎉 Your Visa Arrived Early!" : "Your Visa is Ready! ✅"}</h2>
      <p>Dear <strong>${app.fullName}</strong>,</p>
      ${isEarly
        ? `<p>We have <strong>great news</strong> — your <strong>${label}</strong> arrived ahead of schedule! Please find your visa document attached/available below.</p>`
        : `<p>Your <strong>${label}</strong> is ready. Please find your visa document below.</p>`}
      ${table}
      <div style="text-align:center;margin:24px 0">
        <a href="${finalDocUrl}" style="display:inline-block;padding:14px 32px;background:#B8923A;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;font-size:15px">
          📄 Download Your Visa
        </a>
      </div>
      <p style="font-size:13px;color:#6B7280">If the button doesn't work, copy this link: <a href="${finalDocUrl}" style="color:#B8923A">${finalDocUrl}</a></p>
      <p>We hope you have a wonderful trip! Thank you for choosing East &amp; West Travel Services. ✈️</p>
    `);
  }

  if (!html) return;
  await sendEmail({ to: app.email, subject, html });
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  const { status, adminNote, appliedVia, supplierName, appliedNotes, finalDocumentUrl, isEarlyDelivery } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const existing = await prisma.visaApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Application not found." }, { status: 404 });

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

  // ── Agent in-app notifications ───────────────────────────────────────────────
  if (existing.agentId && status && (status === "approved" || status === "rejected") && existing.status !== status) {
    await notifyAgent(
      existing.agentId,
      status === "approved" ? "Visa Approved 🎉" : "Visa Rejected",
      `Application ${existing.batchRef} (${existing.fullName}) was ${status}.`,
      "/agent/bookings?service=visa"
    );
  }

  // ── Customer emails ───────────────────────────────────────────────────────────
  if (existing.email) {
    const visa = await prisma.visaService.findUnique({ where: { id: existing.visaId }, select: { country: true, title: true } });
    const emailApp = { email: existing.email, fullName: existing.fullName, batchRef: existing.batchRef, adults: existing.adults, children: existing.children, infants: existing.infants, adminNote: adminNote ?? existing.adminNote };

    try {
      // Final document uploaded → send visa delivery email (with early detection)
      if (finalDocumentUrl && finalDocumentUrl !== existing.finalDocumentUrl) {
        await sendStatusEmail(emailApp, visa, "approved", finalDocumentUrl, isEarlyDelivery ?? false);
      }
      // Status changed → send status email
      else if (status && status !== existing.status) {
        await sendStatusEmail(emailApp, visa, status);
      }
    } catch (e) {
      console.error("Visa status email failed:", e);
    }
  }

  return NextResponse.json({ application });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

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
