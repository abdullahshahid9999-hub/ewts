import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.package.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let imageUrl: string | undefined;
  const file = form.get("image");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    imageUrl = await uploadToR2({ buffer, contentType: file.type, folder: "packages" });
  }

  const pkg = await prisma.package.update({
    where: { id },
    data: {
      category: str("category"),
      name: str("name"),
      duration: str("duration"),
      price: str("price"),
      priceNote: str("priceNote"),
      destination: str("destination"),
      depDate: str("depDate"),
      retDate: str("retDate"),
      airline: str("airline"),
      route: str("route"),
      hotels: str("hotels"),
      includes: str("includes"),
      excludes: str("excludes"),
      imageUrl,
      featured: form.has("featured") ? form.get("featured") === "true" : undefined,
      status: str("status"),
    },
  });

  return NextResponse.json({ package: pkg });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.package.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
