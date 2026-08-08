import { MetadataRoute } from "next";

const BASE = "https://eastwestpk.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/umrah`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/tours`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/visa`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/group-tickets`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/insurance`,lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`,     lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
  ];
  return routes;
}
