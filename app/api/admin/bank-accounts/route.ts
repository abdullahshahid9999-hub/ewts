import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { bankName, accountTitle, accountNumber, iban, branchCode, sortOrder } = body ?? {};

  if (!bankName || !accountTitle || !accountNumber) {
    return NextResponse.json({ error: "bankName, accountTitle, and accountNumber are required." }, { status: 400 });
  }

  const account = await prisma.bankAccount.create({
    data: {
      bankName,
      accountTitle,
      accountNumber,
      iban: iban ?? null,
      branchCode: branchCode ?? null,
      sortOrder: Number(sortOrder) || 0,
      isActive: true,
    },
  });

  return NextResponse.json({ account }, { status: 201 });
}
