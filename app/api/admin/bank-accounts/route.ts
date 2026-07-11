import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ accounts });
}

// POST accepts multipart/form-data so logo file can be included
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const bankName = form.get("bankName") as string | null;
  const accountTitle = form.get("accountTitle") as string | null;
  const accountNumber = form.get("accountNumber") as string | null;
  const iban = form.get("iban") as string | null;
  const branchCode = form.get("branchCode") as string | null;
  const sortOrder = Number(form.get("sortOrder")) || 0;

  if (!bankName || !accountTitle || !accountNumber) {
    return NextResponse.json({ error: "bankName, accountTitle, and accountNumber are required." }, { status: 400 });
  }

  let logoUrl: string | null = null;
  const logoFile = form.get("logo");
  if (logoFile && logoFile instanceof Blob && logoFile.size > 0) {
    const ct = logoFile.type;
    if (!["image/jpeg", "image/png", "image/webp"].includes(ct)) {
      return NextResponse.json({ error: "Logo must be JPEG, PNG, or WebP." }, { status: 400 });
    }
    const buf = Buffer.from(await logoFile.arrayBuffer());
    logoUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "payments" });
  }

  const account = await prisma.bankAccount.create({
    data: { bankName, accountTitle, accountNumber, iban: iban || null, branchCode: branchCode || null, sortOrder, isActive: true, logoUrl },
  });

  return NextResponse.json({ account }, { status: 201 });
}
