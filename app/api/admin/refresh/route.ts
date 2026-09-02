import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken, signRefreshToken, isAllowedAdminEmail } from "@/lib/auth";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60,
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_refresh_token")?.value;
  if (!token) return NextResponse.json({ error: "No session." }, { status: 401 });

  const payload = verifyRefreshToken(token);
  if (!payload || payload.role !== "admin")
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !isAllowedAdminEmail(admin.email))
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const res = NextResponse.json({
    accessToken: signAccessToken({ sub: admin.id, role: "admin" }),
    admin: { id: admin.id, email: admin.email, fullName: admin.fullName },
  });
  // Rotate refresh token on every use
  res.cookies.set("admin_refresh_token", signRefreshToken({ sub: admin.id, role: "admin" }), COOKIE_OPTS);
  return res;
}
