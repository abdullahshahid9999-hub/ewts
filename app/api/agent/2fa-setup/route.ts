import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { generateTotpSecret, getTotpUri, verifyTotp } from "@/lib/totp";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// GET — generate secret + QR code
export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const dbAgent = await prisma.agent.findUnique({ where: { id: agent.id } });
  if (!dbAgent) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, dbAgent.email);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({ secret, qrDataUrl, alreadyEnabled: dbAgent.totpEnabled });
}

// POST — verify and enable
export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { secret, code } = body ?? {};
  if (!secret || !code) return NextResponse.json({ error: "secret and code required." }, { status: 400 });

  if (!verifyTotp(secret, String(code)))
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });

  await prisma.agent.update({
    where: { id: agent.id },
    data: { totpSecret: secret, totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — disable 2FA
export async function DELETE(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { code } = body ?? {};

  const dbAgent = await prisma.agent.findUnique({ where: { id: agent.id } });
  if (!dbAgent?.totpSecret) return NextResponse.json({ error: "2FA not enabled." }, { status: 400 });

  if (!verifyTotp(dbAgent.totpSecret, String(code)))
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  await prisma.agent.update({
    where: { id: agent.id },
    data: { totpSecret: null, totpEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
