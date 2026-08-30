import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  const form = await req.formData();

  let imageUrl: string | undefined;
  const imgFile = form.get("image");
  if (imgFile instanceof File) {
    const buf = Buffer.from(await imgFile.arrayBuffer());
    imageUrl = await uploadToR2({ buffer: buf, contentType: imgFile.type, folder: "umrah-steps" });
  } else {
    const u = form.get("imageUrl");
    if (typeof u === "string" && u.startsWith("http")) imageUrl = u;
  }

  const step = await prisma.umrahStep.update({
    where: { id },
    data: {
      title: (form.get("title") as string)?.trim() || undefined,
      description: form.has("description") ? (form.get("description") as string) || null : undefined,
      imageUrl: imageUrl ?? undefined,
      tag: (form.get("tag") as string) || undefined,
      sortOrder: form.has("sortOrder") ? Number(form.get("sortOrder")) : undefined,
      isActive: form.has("isActive") ? form.get("isActive") === "true" : undefined,
    },
  });
  return NextResponse.json({ step });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  await prisma.umrahStep.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
