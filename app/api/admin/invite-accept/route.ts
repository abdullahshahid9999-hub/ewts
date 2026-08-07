import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET — validate token (used by the accept page to show email)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  const admin = await prisma.adminUser.findFirst({
    where: { inviteToken: token },
    select: { id: true, email: true, fullName: true, inviteExpiresAt: true, inviteAcceptedAt: true },
  });

  if (!admin) return NextResponse.json({ error: "Invalid or expired invitation link." }, { status: 404 });
  if (admin.inviteAcceptedAt) return NextResponse.json({ error: "This invitation has already been used." }, { status: 410 });
  if (admin.inviteExpiresAt && admin.inviteExpiresAt < new Date())
    return NextResponse.json({ error: "This invitation link has expired. Ask an admin to resend it." }, { status: 410 });

  return NextResponse.json({ email: admin.email, fullName: admin.fullName });
}

// POST — accept invite, set password
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`invite-accept:ip:${ip}`, 10, 15 * 60 * 1000))
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const token    = typeof body?.token    === "string" ? body.token.trim()    : "";
  const password = typeof body?.password === "string" ? body.password        : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (!token || !password) return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  if (password.length < 8)  return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const admin = await prisma.adminUser.findFirst({ where: { inviteToken: token } });

  if (!admin) return NextResponse.json({ error: "Invalid or expired invitation link." }, { status: 404 });
  if (admin.inviteAcceptedAt) return NextResponse.json({ error: "This invitation has already been used." }, { status: 410 });
  if (admin.inviteExpiresAt && admin.inviteExpiresAt < new Date())
    return NextResponse.json({ error: "This invitation link has expired." }, { status: 410 });

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash:     await hashPassword(password),
      fullName:         fullName || admin.fullName,
      inviteToken:      null,
      inviteExpiresAt:  null,
      inviteAcceptedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
