import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Set NEXT_PUBLIC_SITE_URL in Render's environment once the final public
// domain is confirmed (custom domain vs the onrender.com one) — falls
// back to the current known Render URL so this works either way without
// needing a code change later.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ewts.onrender.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/umrah`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/tours`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/group-tickets`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/visa`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/insurance`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const [packages, blogs, visas] = await Promise.all([
      prisma.package.findMany({ where: { status: "active", slug: { not: null } }, select: { slug: true, category: true, updatedAt: true } }),
      prisma.blog.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.visaService.findMany({ where: { status: "active" }, select: { id: true, updatedAt: true } }),
    ]);

    const packagePages: MetadataRoute.Sitemap = packages
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/${p.category === "umrah" ? "umrah" : "tours"}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const blogPages: MetadataRoute.Sitemap = blogs.map((b) => ({
      url: `${BASE_URL}/blog/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    const visaPages: MetadataRoute.Sitemap = visas.map((v) => ({
      url: `${BASE_URL}/visa/${v.id}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...packagePages, ...blogPages, ...visaPages];
  } catch {
    // DB unreachable at build time — still ship the static pages rather
    // than fail the whole sitemap.
    return staticPages;
  }
}
