import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Package/blog/logo images will be served from Cloudflare R2's public
    // URL once that's wired up — using remotePatterns with a wildcard here
    // for now so Next/Image doesn't reject uploaded images. Tighten this
    // to the exact R2 public hostname once it's known.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
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
