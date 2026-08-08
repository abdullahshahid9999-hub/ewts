import { NextRequest, NextResponse } from "next/server";
import { clearRateLimit } from "@/lib/rateLimit";

// Emergency endpoint — clears the in-memory rate-limit bucket for a given
// admin email so a locked-out admin can try again immediately.
// Protected by ADMIN_RESET_SECRET env var (set this in Render env vars).
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_RESET_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (body?.secret !== secret)
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "email required." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  clearRateLimit(`admin-login:email:${email}`);
  clearRateLimit(`admin-login:ip:${ip}`);

  return NextResponse.json({ ok: true, cleared: [`admin-login:email:${email}`, `admin-login:ip:${ip}`] });
}
