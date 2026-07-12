import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { bankName, logoUrl, accountTitle, accountNumber, iban, branchCode, sortOrder, isActive } = body ?? {};

  const existing = await prisma.bankAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const account = await prisma.bankAccount.update({
    where: { id },
    data: {
      ...(bankName !== undefined && { bankName }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(accountTitle !== undefined && { accountTitle }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(iban !== undefined && { iban }),
      ...(branchCode !== undefined && { branchCode }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });

  return NextResponse.json({ account });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.bankAccount.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
