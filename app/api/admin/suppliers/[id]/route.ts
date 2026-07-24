import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { encryptSupplierKey, maskedKeyPreview } from "@/lib/supplierCrypto";

export const dynamic = "force-dynamic";

function toSafe(s: { encryptedApiKey: string | null; [k: string]: unknown }) {
  const { encryptedApiKey, ...rest } = s;
  return { ...rest, apiKeyPreview: maskedKeyPreview(encryptedApiKey), hasApiKey: !!encryptedApiKey };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (body?.name !== undefined) data.name = body.name;
  if (body?.contactInfo !== undefined) data.contactInfo = body.contactInfo;
  if (body?.isApiBased !== undefined) data.isApiBased = !!body.isApiBased;
  if (body?.apiBaseUrl !== undefined) data.apiBaseUrl = body.apiBaseUrl;
  if (body?.status !== undefined) data.status = body.status;
  if (body?.notes !== undefined) data.notes = body.notes;
  // Only overwrite the stored key if a NEW one was actually typed — an
  // empty/untouched field must never blank out an existing saved key.
  if (typeof body?.apiKey === "string" && body.apiKey.trim()) {
    data.encryptedApiKey = encryptSupplierKey(body.apiKey.trim());
  }

  try {
    const supplier = await prisma.supplier.update({ where: { id }, data });
    return NextResponse.json({ supplier: toSafe(supplier) });
  } catch (e) {
    console.error("PATCH /api/admin/suppliers/[id] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not update supplier: ${e.message}` : "Could not update supplier." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/suppliers/[id] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not delete supplier: ${e.message}` : "Could not delete supplier." },
      { status: 500 }
    );
  }
}
