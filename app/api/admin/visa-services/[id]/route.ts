import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.visaService.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let countryImage: string | undefined;
  const file = form.get("countryImage");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    countryImage = await uploadToR2({ buffer, contentType: file.type, folder: "visas" });
  }

  const visaService = await prisma.visaService.update({
    where: { id },
    data: {
      title: str("title"),
      country: str("country"),
      type: str("type"),
      price: str("price"),
      // Age-tiered pricing — convert empty string to null, keep 0 as valid
      priceAdult: form.get("priceAdult") !== null && form.get("priceAdult") !== "" ? Number(form.get("priceAdult")) || 0 : undefined,
      priceChild: form.get("priceChild") !== null && form.get("priceChild") !== "" ? Number(form.get("priceChild")) || 0 : undefined,
      priceInfant: form.get("priceInfant") !== null && form.get("priceInfant") !== "" ? Number(form.get("priceInfant")) || 0 : undefined,
      days: str("days"),
      validity: str("validity"),
      maxStay: str("maxStay"),
      processingTime: str("processingTime"),
      requirements: str("requirements"),
      termsAndConditions: str("termsAndConditions"),
      refundPolicy: str("refundPolicy"),
      countryFlag: str("countryFlag"),
      countryImage,
      status: str("status"),
    },
  });

  return NextResponse.json({ visaService });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.visaService.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
