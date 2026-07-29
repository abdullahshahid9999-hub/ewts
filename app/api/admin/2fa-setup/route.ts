import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// GET — generate a new TOTP secret and return QR code (setup step 1)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const dbAdmin = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!dbAdmin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Generate new secret (not saved yet — saved only after user verifies)
  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, dbAdmin.email);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({ secret, qrDataUrl, alreadyEnabled: dbAdmin.totpEnabled });
}

// POST — verify code and save secret (setup step 2)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { secret, code } = body ?? {};
  if (!secret || !code) return NextResponse.json({ error: "secret and code required." }, { status: 400 });

  const { verifyTotp } = await import("@/lib/totp");
  if (!verifyTotp(secret, String(code))) {
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: secret, totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — disable 2FA
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { code } = body ?? {};

  const dbAdmin = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!dbAdmin?.totpSecret) return NextResponse.json({ error: "2FA not enabled." }, { status: 400 });

  const { verifyTotp } = await import("@/lib/totp");
  if (!verifyTotp(dbAdmin.totpSecret, String(code))) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
