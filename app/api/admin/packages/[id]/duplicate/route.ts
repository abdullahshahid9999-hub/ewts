import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const src = await prisma.package.findUnique({ where: { id }, include: { roomTypes: { orderBy: { sortOrder: "asc" } } } });
  if (!src) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id: _id, createdAt: _c, updatedAt: _u, slug, name, roomTypes, ...rest } = src;
  void _id; void _c; void _u;

  const copy = await prisma.package.create({
    data: {
      ...rest,
      name: `${name} (Copy)`,
      slug: slug ? `${slug}-copy-${Date.now().toString(36)}` : null,
      status: "inactive",
      featured: false,
      galleryUrls: rest.galleryUrls ?? undefined,
      roomTypes: {
        create: roomTypes.map(({ id: _rid, packageId: _pid, createdAt: _rc, updatedAt: _ru, ...rt }) => {
          void _rid; void _pid; void _rc; void _ru;
          return rt;
        }),
      },
    },
  });

  return NextResponse.json({ package: copy }, { status: 201 });
}
