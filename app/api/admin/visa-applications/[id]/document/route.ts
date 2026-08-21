import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";
import { sendEmail } from "@/lib/email";
import { emailWrap, refTable, ctaButton, waButton, travelersStr } from "@/lib/emailTemplates";

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

  const subjectApplicant = isEarlyDelivery
    ? `🎉 Great news! Your visa arrived early – ${application.batchRef}`
    : `Your visa is ready – ${application.batchRef}`;

  const travelers = travelersStr(application.adults, application.children, application.infants);
  const table = refTable(application.batchRef, label, travelers);
  const htmlApplicant = emailWrap(`
    <h2 style="color:#15803D;margin:0 0 16px">${isEarlyDelivery ? "🎉 Your Visa Arrived Early!" : "Your Visa is Ready! ✅"}</h2>
    <p style="color:#374151;margin:0 0 8px">Dear <strong>${application.fullName}</strong>,</p>
    <p style="color:#374151;margin:0 0 16px">${isEarlyDelivery
      ? `Wonderful news — your <strong>${label}</strong> arrived ahead of schedule!`
      : `Your <strong>${label}</strong> is ready.`} Please download it using the button below.</p>
    ${table}
    ${ctaButton(finalDocumentUrl, "📄 Download Your Visa")}
    <p style="color:#9CA3AF;font-size:12px;margin:4px 0 16px">If the button doesn't work: <a href="${finalDocumentUrl}" style="color:#B8923A">${finalDocumentUrl}</a></p>
    <p style="color:#6B7280;font-size:13px">We hope you have a wonderful trip! ✈️ Thank you for choosing East &amp; West Travel Services.</p>
  `);

  const htmlAgent = emailWrap(`
    <h2 style="color:#15803D;margin:0 0 16px">Client Visa Ready – ${application.batchRef}</h2>
    <p style="color:#374151;margin:0 0 8px">Dear <strong>${application.agent?.fullName ?? "Agent"}</strong>,</p>
    <p style="color:#374151;margin:0 0 16px">The visa for your client <strong>${application.fullName}</strong> (${label}) is ready. Please forward the document to your client.</p>
    ${ctaButton(finalDocumentUrl, "📄 Download Visa Document")}
  `);

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
