import type { NextConfig } from "next";

// Derived from the actual configured R2_PUBLIC_URL rather than hardcoded —
// stays correct automatically if the bucket/domain ever changes, and is
// far tighter than the previous wildcard (any HTTPS host was allowed
// through Next/Image's optimizer, which is unnecessary now that the real
// R2 host is known at build time).
function r2Hostname(): string | null {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const r2Host = r2Hostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2Host
      ? [{ protocol: "https", hostname: r2Host }]
      : [{ protocol: "https", hostname: "**" }], // R2_PUBLIC_URL not set (e.g. local dev without it) — fall back rather than break builds
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://cdn.jsdelivr.net; worker-src 'self' blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' blob: https://admin.eastwestpk.com https://eastwestpk.com https://b2b.eastwestpk.com https://api.anthropic.com https://www.google-analytics.com https://cloudflareinsights.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com; frame-src https://www.google.com https://maps.google.com; object-src 'none'; base-uri 'self';" },
        ],
      },
    ];
  },
};

export default nextConfig;
