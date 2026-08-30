import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const steps = await prisma.umrahStep.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ steps });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const form = await req.formData();
  const title = (form.get("title") as string)?.trim();
  if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });

  let imageUrl: string | undefined;
  const imgFile = form.get("image");
  if (imgFile instanceof File) {
    const buf = Buffer.from(await imgFile.arrayBuffer());
    imageUrl = await uploadToR2({ buffer: buf, contentType: imgFile.type, folder: "umrah-steps" });
  } else {
    const u = form.get("imageUrl");
    if (typeof u === "string" && u.startsWith("http")) imageUrl = u;
  }

  const step = await prisma.umrahStep.create({
    data: {
      title,
      description: (form.get("description") as string) || null,
      imageUrl: imageUrl ?? null,
      tag: (form.get("tag") as string) || "activity",
      sortOrder: Number(form.get("sortOrder") || 0),
    },
  });
  return NextResponse.json({ step }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  // Bulk reorder: [{ id, sortOrder }]
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { items } = await req.json() as { items: { id: string; sortOrder: number }[] };
  await Promise.all(items.map(({ id, sortOrder }) => prisma.umrahStep.update({ where: { id }, data: { sortOrder } })));
  return NextResponse.json({ ok: true });
}
