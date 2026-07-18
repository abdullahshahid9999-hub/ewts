import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("logo");
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No logo file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = await uploadToR2({ buffer, contentType: file.type || "image/png", folder: "agents" });

  const agent = await prisma.agent.update({ where: { id }, data: { logoUrl } });
  const { passwordHash: _hash, ...safeAgent } = agent;
  return NextResponse.json({ agent: safeAgent });
}
