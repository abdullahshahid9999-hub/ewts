import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getBlog(slug: string) {
  try {
    return await prisma.blog.findFirst({ where: { slug, published: true } });
  } catch {
    return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlog(slug);

  if (!post) notFound();

  const date = new Date(post.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Navbar />

      {/* HEADER — matches the breadcrumb pattern used on every other rebuilt
          page; no real live blog post was fetchable to match against (see
          PROGRESS.md), so this follows the established site pattern rather
          than copying unseen content. */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-14">
        {post.category && (
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
            {post.category}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4 max-w-3xl mx-auto">
          {post.title}
        </h1>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-gold">Blog</Link>
          <span className="mx-2">/</span>
          <span>{post.title}</span>
        </p>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-muted text-sm mb-6">{date}</p>

        {post.coverImage && (
          <div className="relative h-72 sm:h-96 mb-8 rounded-2xl overflow-hidden bg-surface">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        )}

        {post.excerpt && (
          <p className="text-lg text-muted mb-6 italic">{post.excerpt}</p>
        )}

        {post.content && (
          <div className="prose prose-neutral max-w-none whitespace-pre-wrap text-text">
            {post.content}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
          <Link href="/blog" className="text-sm font-semibold text-gold hover:underline">
            ← Back to all articles
          </Link>
          <a
            href={waLink(`Assalam o Alaikum! I read "${post.title}" on your website and have a question.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-5 py-2.5 rounded-lg shadow-md transition-colors text-sm"
          >
            Ask Us on WhatsApp
          </a>
        </div>
      </article>

      <Footer />
    </>
  );
}
