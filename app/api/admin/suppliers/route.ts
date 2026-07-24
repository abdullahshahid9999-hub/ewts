import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { encryptSupplierKey, maskedKeyPreview } from "@/lib/supplierCrypto";

export const dynamic = "force-dynamic";

function toSafe(s: { encryptedApiKey: string | null; [k: string]: unknown }) {
  const { encryptedApiKey, ...rest } = s;
  return { ...rest, apiKeyPreview: maskedKeyPreview(encryptedApiKey), hasApiKey: !!encryptedApiKey };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ suppliers: suppliers.map(toSafe) });
  } catch (e) {
    console.error("GET /api/admin/suppliers failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not load suppliers: ${e.message}` : "Could not load suppliers." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Supplier name is required." }, { status: 400 });

  const apiKey = typeof body?.apiKey === "string" && body.apiKey.trim() ? body.apiKey.trim() : null;

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactInfo: typeof body?.contactInfo === "string" ? body.contactInfo : undefined,
        isApiBased: !!body?.isApiBased,
        apiBaseUrl: typeof body?.apiBaseUrl === "string" ? body.apiBaseUrl : undefined,
        encryptedApiKey: apiKey ? encryptSupplierKey(apiKey) : undefined,
        notes: typeof body?.notes === "string" ? body.notes : undefined,
        status: "active",
      },
    });
    return NextResponse.json({ supplier: toSafe(supplier) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/suppliers failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not create supplier: ${e.message}` : "Could not create supplier." },
      { status: 500 }
    );
  }
}
