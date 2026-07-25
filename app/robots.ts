import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ewts.onrender.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/agent", "/api", "/booking-form", "/booking-confirmation"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
