import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/assets") || pathname.startsWith("/images") || pathname === "/favicon.ico" || pathname === "/sitemap.xml" || pathname === "/robots.txt";
  if (isStatic) return NextResponse.next();

  // admin.eastwestpk.com → /admin/*
  if (host === "admin.eastwestpk.com") {
    const url = req.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/admin/login";
    } else if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
      url.pathname = `/admin${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // b2b.eastwestpk.com → /agent/*
  if (host === "b2b.eastwestpk.com") {
    const url = req.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/agent/login";
    } else if (!pathname.startsWith("/agent") && !pathname.startsWith("/api/")) {
      url.pathname = `/agent${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
