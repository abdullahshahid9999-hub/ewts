import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

const CATEGORIES = ["Umrah", "Tours", "Visa", "Flights", "Insurance", "Travel Tips", "News", "Other"];

async function getBlogs(category?: string) {
  try {
    return await prisma.blog.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, category: true, coverImage: true, excerpt: true, createdAt: true, authorName: true },
    });
  } catch { return []; }
}

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const blogs = await getBlogs(category);

  return (
    <>
      <Navbar />

      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-14">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">Travel Stories &amp; Tips</p>
        <h1 className="font-display text-3xl md:text-5xl font-semibold mb-4">
          Our Travel <span className="italic text-[var(--lp-brass)]">Blog</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-4">Destinations, tips, Umrah guides, and travel inspiration — all in one place.</p>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-[var(--lp-brass)]">Home</Link>
          <span className="mx-2">/</span>
          <span>Blog</span>
        </p>
      </section>

      {/* Category filter pills */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "14px 0" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/blog"
            style={{ padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1.5px solid", textDecoration: "none", borderColor: !category ? "#B8923A" : "#e5e7eb", background: !category ? "#B8923A" : "#fff", color: !category ? "#fff" : "#374151" }}>
            All
          </Link>
          {CATEGORIES.map(cat => (
            <Link key={cat} href={`/blog?category=${encodeURIComponent(cat)}`}
              style={{ padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1.5px solid", textDecoration: "none", borderColor: category === cat ? "#B8923A" : "#e5e7eb", background: category === cat ? "#B8923A" : "#fff", color: category === cat ? "#fff" : "#374151" }}>
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-14">
        {blogs.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-border rounded-2xl p-10">
            <p className="text-4xl mb-4">📝</p>
            <h3 className="font-display text-xl font-semibold mb-2">No Articles {category ? `in "${category}"` : "Published Yet"}</h3>
            <p className="text-muted text-sm mb-6">We&apos;re working on travel guides and tips. Check back soon.</p>
            <a href={waLink("Assalam o Alaikum! I have a travel question.")} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">
              WhatsApp Us
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="block bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
                <div className="relative h-44 bg-surface overflow-hidden">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1C1E26,#2a2d3a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 36 }}>✈️</span>
                    </div>
                  )}
                  {post.category && (
                    <span style={{ position: "absolute", top: 10, left: 10, background: "#B8923A", color: "#fff", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 12 }}>
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-snug">{post.title}</h3>
                  {post.excerpt && <p className="text-muted text-sm line-clamp-2 mb-3">{post.excerpt}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#B8923A,#D4AF5A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 11 }}>
                      {((post as { authorName?: string | null }).authorName ?? "E")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{(post as { authorName?: string | null }).authorName ?? "East & West Travel"}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
