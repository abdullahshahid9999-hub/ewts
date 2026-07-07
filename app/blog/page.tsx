import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getBlogs() {
  try {
    return await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const blogs = await getBlogs();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-14">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          Travel Stories &amp; Tips
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Our Travel <span className="italic text-gold">Blog</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-4">
          Destinations, tips, Umrah guides, and travel inspiration — all in one place.
        </p>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <span>Blog</span>
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        {blogs.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-border rounded-2xl p-10">
            <p className="text-4xl mb-4">📝</p>
            <h3 className="font-display text-xl font-semibold mb-2">No Articles Published Yet</h3>
            <p className="text-muted text-sm mb-6">
              We&apos;re working on travel guides and tips. Check back soon, or WhatsApp us your
              travel questions directly.
            </p>
            <a
              href={waLink("Assalam o Alaikum! I have a travel question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-40 bg-surface">
                  {post.coverImage && (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5">
                  {post.category && (
                    <p className="text-gold text-xs font-semibold uppercase tracking-wide mb-2">
                      {post.category}
                    </p>
                  )}
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-muted text-sm line-clamp-3">{post.excerpt}</p>
                  )}
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
