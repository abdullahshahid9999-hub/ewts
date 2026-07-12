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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();
  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const bankName = str("bankName");
  const accountTitle = str("accountTitle");
  const accountNumber = str("accountNumber");

  if (!bankName || !accountTitle || !accountNumber) {
    return NextResponse.json({ error: "bankName, accountTitle, and accountNumber are required." }, { status: 400 });
  }

  let logoUrl: string | undefined;
  const file = form.get("logo");
  if (file instanceof File && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      logoUrl = await uploadToR2({ buffer, contentType: file.type, folder: "banks" });
    } catch (e) {
      console.error("Bank logo upload failed:", e);
      return NextResponse.json(
        { error: e instanceof Error ? `Logo upload failed: ${e.message}` : "Logo upload failed." },
        { status: 500 }
      );
    }
  }

  const account = await prisma.bankAccount.create({
    data: {
      bankName,
      logoUrl,
      accountTitle,
      accountNumber,
      iban: str("iban"),
      branchCode: str("branchCode"),
      sortOrder: Number(str("sortOrder")) || 0,
      isActive: true,
    },
  });

  return NextResponse.json({ account }, { status: 201 });
}
