import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called daily by UptimeRobot or any HTTP monitor:
//   GET https://eastwestpk.com/api/cron/expire-packages
//   Header: x-cron-secret: <CRON_SECRET env var>
// Auto-marks packages whose retDate has passed as "inactive".

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;
  if (!secret || !cronSecret || secret !== cronSecret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const expired = await prisma.package.findMany({
    where: { status: "active", retDate: { not: null, lt: today } },
    select: { id: true, name: true, retDate: true },
  });

  if (expired.length === 0)
    return NextResponse.json({ expired: 0, message: "Nothing to expire." });

  await prisma.package.updateMany({
    where: { id: { in: expired.map((p: { id: string }) => p.id) } },
    data: { status: "inactive" },
  });

  await prisma.adminAuditLog.createMany({
    data: expired.map((p: { id: string; name: string; retDate: string | null }) => ({
      adminEmail: "system@cron",
      action: "package.auto_expired",
      target: `package:${p.id}`,
      meta: JSON.stringify({ name: p.name, retDate: p.retDate }),
    })),
  });

  return NextResponse.json({
    expired: expired.length,
    packages: expired.map((p: { id: string; name: string; retDate: string | null }) => ({
      id: p.id, name: p.name, retDate: p.retDate,
    })),
  });
}
