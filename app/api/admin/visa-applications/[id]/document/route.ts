import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";
import { sendEmail } from "@/lib/email";

const BASE = "https://eastwestpk.com";
const FOOTER = `<p style="color:#9CA3AF;font-size:12px;margin-top:32px;border-top:1px solid #F3F4F6;padding-top:16px">
  East &amp; West Travel Services · IATA Certified<br>
  Chaudhry Arcade, Regency Road, New Civil Lines, Faisalabad<br>
  WhatsApp: <a href="https://wa.me/923336515349" style="color:#B8923A">+92 333 651 5349</a> · <a href="${BASE}" style="color:#B8923A">eastwestpk.com</a>
</p>`;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("document");
  const isEarlyDelivery = form?.get("isEarlyDelivery") === "true";

  if (!file || !(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No document file provided." }, { status: 400 });
  }

  const application = await prisma.visaApplication.findUnique({
    where: { id },
    include: {
      visa: { select: { title: true, country: true } },
      agent: { select: { email: true, fullName: true } },
    },
  });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const finalDocumentUrl = await uploadToR2({ buffer, contentType: file.type || "application/pdf", folder: "visas" });

  const updated = await prisma.visaApplication.update({
    where: { id },
    data: { status: "approved", finalDocumentUrl, finalDocumentSentAt: new Date() },
  });

  const label = `${application.visa.country} – ${application.visa.title}`;
  const travelersStr = `${application.adults} Adult${application.adults > 1 ? "s" : ""}${application.children > 0 ? `, ${application.children} Child${application.children > 1 ? "ren" : ""}` : ""}${application.infants > 0 ? `, ${application.infants} Infant${application.infants > 1 ? "s" : ""}` : ""}`;

  const subjectApplicant = isEarlyDelivery
    ? `🎉 Great news! Your visa arrived early – ${application.batchRef}`
    : `Your visa is ready – ${application.batchRef}`;

  const htmlApplicant = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1E26">
    <div style="margin-bottom:24px"><span style="font-size:18px;font-weight:700;color:#B8923A">East &amp; West Travel</span></div>
    <h2 style="color:#15803D;margin-bottom:4px">${isEarlyDelivery ? "🎉 Your Visa Arrived Early!" : "Your Visa is Ready! ✅"}</h2>
    <p>Dear <strong>${application.fullName}</strong>,</p>
    ${isEarlyDelivery
      ? `<p>We have <strong>great news</strong> — your <strong>${label}</strong> arrived ahead of schedule! Please find your visa document below.</p>`
      : `<p>Your <strong>${label}</strong> is ready. Please find your visa document below.</p>`}
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6;font-size:13px">Reference</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #F3F4F6;font-size:13px">${application.batchRef}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6;font-size:13px">Visa</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #F3F4F6;font-size:13px">${label}</td></tr>
      <tr><td style="padding:8px 0;color:#6B7280;font-size:13px">Travelers</td><td style="padding:8px 0;font-weight:600;font-size:13px">${travelersStr}</td></tr>
    </table>
    <div style="text-align:center;margin:24px 0">
      <a href="${finalDocumentUrl}" style="display:inline-block;padding:14px 32px;background:#B8923A;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;font-size:15px">
        📄 Download Your Visa
      </a>
    </div>
    <p style="font-size:13px;color:#6B7280">If the button doesn't work, copy this link: <a href="${finalDocumentUrl}" style="color:#B8923A">${finalDocumentUrl}</a></p>
    <p>We hope you have a wonderful trip! Thank you for choosing East &amp; West Travel Services. ✈️</p>
    ${FOOTER}
  </div>`;

  // Agent gets a simpler forward email
  const htmlAgent = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1E26">
    <div style="margin-bottom:24px"><span style="font-size:18px;font-weight:700;color:#B8923A">East &amp; West Travel</span></div>
    <h2 style="color:#15803D;margin-bottom:4px">Client Visa Ready – ${application.batchRef}</h2>
    <p>Dear <strong>${application.agent?.fullName ?? "Agent"}</strong>,</p>
    <p>The visa for your client <strong>${application.fullName}</strong> (${label}) is ready. Please forward the document to your client.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${finalDocumentUrl}" style="display:inline-block;padding:14px 32px;background:#B8923A;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;font-size:15px">
        📄 Download Visa Document
      </a>
    </div>
    ${FOOTER}
  </div>`;

  const emailedTo: string[] = [];
  if (application.email) {
    await sendEmail({ to: application.email, subject: subjectApplicant, html: htmlApplicant }).catch(e => console.error("Applicant visa email failed:", e));
    emailedTo.push(application.email);
  }
  if (application.agent?.email) {
    await sendEmail({ to: application.agent.email, subject: `Client visa ready – ${application.batchRef}`, html: htmlAgent }).catch(e => console.error("Agent visa email failed:", e));
    emailedTo.push(application.agent.email);
  }

  return NextResponse.json({ app: updated, emailedTo });
}
