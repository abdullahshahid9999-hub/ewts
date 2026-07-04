import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const requestedSlug = str("slug");
  if (requestedSlug && requestedSlug !== existing.slug) {
    const clash = await prisma.blog.findUnique({ where: { slug: requestedSlug } });
    if (clash) return NextResponse.json({ error: "A blog with this slug already exists." }, { status: 409 });
  }

  let coverImage: string | undefined;
  const file = form.get("coverImage");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    coverImage = await uploadToR2({ buffer, contentType: file.type, folder: "blogs" });
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      title: str("title"),
      slug: requestedSlug,
      category: str("category"),
      coverImage,
      excerpt: str("excerpt"),
      content: str("content"),
      published: form.has("published") ? form.get("published") === "true" : undefined,
    },
  });

  return NextResponse.json({ blog });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.blog.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
