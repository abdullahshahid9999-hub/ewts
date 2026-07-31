import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("document");
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No document file provided." }, { status: 400 });
  }

  const application = await prisma.visaApplication.findUnique({
    where: { id },
    include: { visa: { select: { title: true } }, agent: { select: { email: true, fullName: true } } },
  });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const finalDocumentUrl = await uploadToR2({ buffer, contentType: file.type || "application/pdf", folder: "visas" });

  const updated = await prisma.visaApplication.update({
    where: { id },
    data: { status: "approved", finalDocumentUrl, finalDocumentSentAt: new Date() },
  });

  // Email the applicant directly — and the agent too, if this was an
  // agent-submitted application, so both sides get the document at once
  // instead of the agent having to relay it manually.
  const recipients = [application.email, application.agent?.email].filter((e): e is string => !!e);
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0E2A26">Your Visa Has Arrived! 🎉</h2>
      <p>Good news — your <strong>${application.visa.title}</strong> visa application (Ref: ${application.batchRef}) has been approved.</p>
      <a href="${finalDocumentUrl}" style="display:inline-block;background:#B8862E;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Download Your Visa</a>
      <p style="color:#666;font-size:12px">If the button doesn't work, copy this link: ${finalDocumentUrl}</p>
    </div>
  `;
  for (const to of recipients) {
    await sendEmail({ to, subject: "Your Visa Has Arrived — East & West Travel Services", html }).catch((e) => console.error("Visa document email failed:", e));
  }

  return NextResponse.json({ app: updated, emailedTo: recipients });
}
