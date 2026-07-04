import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          Blog
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Travel guides &amp; <span className="italic text-gold">updates.</span>
        </h1>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {blogs.length === 0 ? (
          <p className="text-muted">No articles published yet — check back soon.</p>
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
