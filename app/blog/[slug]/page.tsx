import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

  return (
    <>
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        {post.category && (
          <p className="text-gold text-xs font-semibold uppercase tracking-wide mb-3">
            {post.category}
          </p>
        )}
        <h1 className="font-display text-4xl font-semibold leading-tight mb-6">
          {post.title}
        </h1>
        {post.coverImage && (
          <div className="relative h-72 sm:h-96 mb-8 rounded-2xl overflow-hidden bg-surface">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        )}
        {post.content && (
          <div className="prose prose-neutral max-w-none whitespace-pre-wrap text-text">
            {post.content}
          </div>
        )}
      </article>
      <Footer />
    </>
  );
}
