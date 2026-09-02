import { NextRequest, NextResponse } from "next/server";

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com ${process.env.R2_PUBLIC_URL ?? ""} https://lh3.googleusercontent.com`,
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  return res;
}

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
    if (pathname === "/") newPath = "/admin/login";
    else if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/")) newPath = `/admin${pathname}`;
    const res = newPath !== pathname
      ? (() => { const url = req.nextUrl.clone(); url.pathname = newPath; return NextResponse.rewrite(url); })()
      : NextResponse.next();
    return addSecurityHeaders(res);
  }

  // b2b.eastwestpk.com → /agent/*
  if (host === "b2b.eastwestpk.com") {
    let newPath = pathname;
    if (pathname === "/") newPath = "/agent/login";
    else if (!pathname.startsWith("/agent") && !pathname.startsWith("/api/")) newPath = `/agent${pathname}`;
    const res = newPath !== pathname
      ? (() => { const url = req.nextUrl.clone(); url.pathname = newPath; return NextResponse.rewrite(url); })()
      : NextResponse.next();
    return addSecurityHeaders(res);
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
