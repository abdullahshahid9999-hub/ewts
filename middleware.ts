import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host") ?? "";
  const host = forwardedHost || req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt";
  if (isStatic) return NextResponse.next();

  // admin.eastwestpk.com → /admin/*
  if (host === "admin.eastwestpk.com") {
    let newPath = pathname;
    if (pathname === "/") {
      newPath = "/admin/login";
    } else if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
      newPath = `/admin${pathname}`;
    }
    if (newPath !== pathname) {
      const url = req.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // b2b.eastwestpk.com → /agent/*
  if (host === "b2b.eastwestpk.com") {
    let newPath = pathname;
    if (pathname === "/") {
      newPath = "/agent/login";
    } else if (!pathname.startsWith("/agent") && !pathname.startsWith("/api/")) {
      newPath = `/agent${pathname}`;
    }
    if (newPath !== pathname) {
      const url = req.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
