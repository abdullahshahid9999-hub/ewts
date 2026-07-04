import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("agent_refresh_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/agent/refresh",
    maxAge: 0,
  });
  return res;
}
