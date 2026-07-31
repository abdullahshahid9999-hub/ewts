import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken, isAllowedAdminEmail } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const totpCode = typeof body?.totpCode === "string" ? body.totpCode.trim() : "";

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

  if (!checkRateLimit(`admin-login:ip:${ip}`, 10, 10 * 60 * 1000) ||
      !checkRateLimit(`admin-login:email:${email}`, 5, 10 * 60 * 1000))
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const genericError = () => NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!isAllowedAdminEmail(email)) return genericError();

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return genericError();

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return genericError();

  // If 2FA enabled, require TOTP code
  if (admin.totpEnabled && admin.totpSecret) {
    if (!totpCode) {
      // Signal to frontend that 2FA is needed
      return NextResponse.json({ requires2FA: true }, { status: 200 });
    }
    if (!verifyTotp(admin.totpSecret, totpCode)) {
      return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
    }
  }

  const accessToken = signAccessToken({ sub: admin.id, role: "admin" });
  const refreshToken = signRefreshToken({ sub: admin.id, role: "admin" });

  const res = NextResponse.json({
    accessToken,
    admin: { id: admin.id, email: admin.email, fullName: admin.fullName },
  });

  res.cookies.set("admin_refresh_token", refreshToken, {
    httpOnly: true, secure: true, sameSite: "lax",
    path: "/api/admin", maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}
