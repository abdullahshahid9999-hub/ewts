import { NextRequest, NextResponse } from "next/server";

// Emergency rate-limit reset — just restart the Render service instead.
// This endpoint is kept as a stub so the import doesn't break the build.
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_RESET_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (body?.secret !== secret) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  // Rate limits are in-memory — restarting the Render service clears them.
  return NextResponse.json({ ok: true, note: "Restart the Render service to clear in-memory rate limits." });
}
