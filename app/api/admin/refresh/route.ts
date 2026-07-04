import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken, isAllowedAdminEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_refresh_token")?.value;
  if (!token) return NextResponse.json({ error: "No session." }, { status: 401 });

  const payload = verifyRefreshToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !isAllowedAdminEmail(admin.email)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const accessToken = signAccessToken({ sub: admin.id, role: "admin" });
  return NextResponse.json({
    accessToken,
    admin: { id: admin.id, email: admin.email, fullName: admin.fullName },
  });
}
