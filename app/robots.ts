import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/agent", "/api/"] },
    ],
    sitemap: "https://eastwestpk.com/sitemap.xml",
  };
}
