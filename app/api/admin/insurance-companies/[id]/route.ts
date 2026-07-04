import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.insuranceCompany.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let logoUrl: string | undefined;
  const file = form.get("logo");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    logoUrl = await uploadToR2({ buffer, contentType: file.type, folder: "insurance" });
  }

  const insuranceCompany = await prisma.insuranceCompany.update({
    where: { id },
    data: { name: str("name"), logoUrl, description: str("description") },
  });

  return NextResponse.json({ insuranceCompany });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  // Cascades to plans -> rates per schema's onDelete: Cascade.
  await prisma.insuranceCompany.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
