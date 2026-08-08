import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  // admin.eastwestpk.com → serve /admin/* routes directly
  if (host.startsWith("admin.")) {
    // Already on an /admin path — let it through
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/_next") || pathname.startsWith("/assets")) {
      return NextResponse.next();
    }
    // Root of admin subdomain → go to admin dashboard
    const url = req.nextUrl.clone();
    url.pathname = "/admin" + (pathname === "/" ? "" : pathname);
    return NextResponse.rewrite(url);
  }

  // b2b.eastwestpk.com → serve /agent/* routes directly
  if (host.startsWith("b2b.")) {
    if (pathname.startsWith("/agent") || pathname.startsWith("/api/agent") || pathname.startsWith("/_next") || pathname.startsWith("/assets")) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = "/agent" + (pathname === "/" ? "" : pathname);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
