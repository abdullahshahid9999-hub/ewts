import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname, search } = req.nextUrl;

  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/assets") || pathname === "/favicon.ico";
  if (isStatic) return NextResponse.next();

  // admin.eastwestpk.com → /admin/*
  if (host === "admin.eastwestpk.com") {
    const url = req.nextUrl.clone();
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // b2b.eastwestpk.com → /agent/*
  if (host === "b2b.eastwestpk.com") {
    const url = req.nextUrl.clone();
    if (!pathname.startsWith("/agent") && !pathname.startsWith("/api/agent")) {
      url.pathname = pathname === "/" ? "/agent" : `/agent${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // www redirect to naked domain
  if (host === "www.eastwestpk.com") {
    const url = req.nextUrl.clone();
    url.host = "eastwestpk.com";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
