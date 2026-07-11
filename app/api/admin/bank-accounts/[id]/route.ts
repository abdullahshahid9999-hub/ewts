import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

// PATCH accepts multipart/form-data (to allow logo upload) OR JSON (for simple toggles)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.bankAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const ct = req.headers.get("content-type") ?? "";
  let fields: Record<string, string | null | boolean | number> = {};
  let logoUrl: string | undefined = undefined;

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

    for (const key of ["bankName", "accountTitle", "accountNumber", "iban", "branchCode"]) {
      const v = form.get(key);
      if (v !== null) fields[key] = (v as string).trim() || null;
    }
    if (form.get("sortOrder") !== null) fields.sortOrder = Number(form.get("sortOrder")) || 0;
    if (form.get("isActive") !== null) fields.isActive = form.get("isActive") === "true";

    const logoFile = form.get("logo");
    if (logoFile && logoFile instanceof Blob && logoFile.size > 0) {
      const fileCt = logoFile.type;
      if (!["image/jpeg", "image/png", "image/webp"].includes(fileCt)) {
        return NextResponse.json({ error: "Logo must be JPEG, PNG, or WebP." }, { status: 400 });
      }
      const buf = Buffer.from(await logoFile.arrayBuffer());
      logoUrl = await uploadToR2({ buffer: buf, contentType: fileCt, folder: "payments" });
    }
  } else {
    const body = await req.json().catch(() => null) ?? {};
    const { bankName, accountTitle, accountNumber, iban, branchCode, sortOrder, isActive } = body;
    if (bankName !== undefined) fields.bankName = bankName;
    if (accountTitle !== undefined) fields.accountTitle = accountTitle;
    if (accountNumber !== undefined) fields.accountNumber = accountNumber;
    if (iban !== undefined) fields.iban = iban;
    if (branchCode !== undefined) fields.branchCode = branchCode;
    if (sortOrder !== undefined) fields.sortOrder = Number(sortOrder);
    if (isActive !== undefined) fields.isActive = Boolean(isActive);
  }

  const account = await prisma.bankAccount.update({
    where: { id },
    data: { ...fields, ...(logoUrl !== undefined && { logoUrl }) },
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
