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
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
