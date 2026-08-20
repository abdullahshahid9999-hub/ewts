import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { sendEmail } from "@/lib/email";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/admin/invite — existing admin invites a new admin
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });

  // Check if already exists
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing && existing.inviteAcceptedAt)
    return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  if (existing) {
    // Re-send invite — update token
    await prisma.adminUser.update({
      where: { email },
      data: { inviteToken: token, inviteExpiresAt: expiresAt, invitedByEmail: admin.email },
    });
  } else {
    // Create placeholder admin (no password yet — they set it via invite link)
    await prisma.adminUser.create({
      data: {
        email,
        fullName: fullName || null,
        passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")), // unusable random pw
        inviteToken: token,
        inviteExpiresAt: expiresAt,
        invitedByEmail: admin.email,
      },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eastwestpk.com";
  const inviteLink = `${baseUrl}/admin/invite-accept?token=${token}`;

  try { await sendEmail({
    to: email,
    subject: "You've been invited to East & West Travel Admin Panel",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#1C1E26;margin-bottom:8px">Admin Panel Invitation</h2>
        <p style="color:#6B7280">You've been invited by <strong>${admin.email}</strong> to join the East &amp; West Travel Services admin panel.</p>
        ${fullName ? `<p style="color:#6B7280">Your name has been set as: <strong>${fullName}</strong></p>` : ""}
        <p style="color:#6B7280">Click the button below to set your password and activate your account. This link expires in <strong>48 hours</strong>.</p>
        <a href="${inviteLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#B8923A;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;font-size:15px">
          Accept Invitation &amp; Set Password
        </a>
        <p style="color:#9CA3AF;font-size:12px">If you didn't expect this email, you can safely ignore it. The link will expire on its own.</p>
        <p style="color:#9CA3AF;font-size:12px">East &amp; West Travel Services · eastwestpk.com</p>
      </div>
    `,
  }); } catch (emailErr) {
    console.error("Invite email failed:", emailErr);
    return NextResponse.json({ ok: true, emailWarning: "Invite saved but email delivery failed. Check Resend config." });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/admin/invite — list pending invites
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const pending = await prisma.adminUser.findMany({
    where: { inviteAcceptedAt: null, inviteToken: { not: null } },
    select: { id: true, email: true, fullName: true, inviteExpiresAt: true, invitedByEmail: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pending });
}

// DELETE /api/admin/invite — revoke a pending invite
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (target.inviteAcceptedAt) return NextResponse.json({ error: "Invite already accepted — cannot revoke." }, { status: 409 });

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
