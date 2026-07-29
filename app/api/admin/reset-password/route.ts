import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/\d/.test(pw)) return "Password must contain at least one number.";
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { token, password } = body ?? {};

  if (!token || !password)
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });

  const pwError = validatePassword(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== "admin" || record.usedAt || record.expiresAt < new Date())
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });

  const admin = await prisma.adminUser.findUnique({ where: { email: record.email } });
  if (!admin) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
