import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET — list all accepted admins
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admins = await prisma.adminUser.findMany({
    where: { inviteAcceptedAt: { not: null } },
    select: { id: true, email: true, fullName: true, invitedByEmail: true, createdAt: true, inviteAcceptedAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ admins });
}

// POST — reset password (send new invite link)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  if (target.email === admin.email)
    return NextResponse.json({ error: "Cannot reset your own password via this panel. Use the profile page." }, { status: 400 });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.adminUser.update({
    where: { id },
    data: {
      inviteToken: token,
      inviteExpiresAt: expiresAt,
      inviteAcceptedAt: null, // force re-set
      passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eastwestpk.com";
  const resetLink = `${baseUrl}/admin/invite-accept?token=${token}`;

  try {
    await sendEmail({
      to: target.email,
      subject: "Reset your East & West Travel Admin password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1C1E26">Password Reset</h2>
          <p style="color:#6B7280">Your admin account password has been reset by <strong>${admin.email}</strong>.</p>
          <p style="color:#6B7280">Click below to set a new password. This link expires in <strong>48 hours</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#B8923A;color:#fff;font-weight:700;border-radius:8px;text-decoration:none">
            Set New Password
          </a>
          <p style="color:#9CA3AF;font-size:12px">If you did not expect this, contact your admin immediately.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Reset email failed:", err);
    return NextResponse.json({ ok: true, emailWarning: "Password reset but email delivery failed. Check Resend config." });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — terminate (delete) an admin account
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  if (target.email === admin.email)
    return NextResponse.json({ error: "Cannot terminate your own account." }, { status: 400 });

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
