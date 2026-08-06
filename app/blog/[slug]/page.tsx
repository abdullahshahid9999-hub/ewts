import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import { jsonToBlocks, type Block } from "@/components/BlogEditor";

export const revalidate = 120;

async function getBlog(slug: string) {
  try { return await prisma.blog.findFirst({ where: { slug, published: true } }); }
  catch { return null; }
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "h1":
      return <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, margin: "28px 0 12px", lineHeight: 1.2 }}>{block.text}</h1>;
    case "h2":
      return <h2 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 700, margin: "24px 0 10px", lineHeight: 1.3 }}>{block.text}</h2>;
    case "h3":
      return <h3 style={{ fontSize: "clamp(15px,2.5vw,19px)", fontWeight: 700, margin: "20px 0 8px" }}>{block.text}</h3>;
    case "paragraph":
      return <p style={{ fontSize: 16, lineHeight: 1.8, margin: "0 0 18px", color: "#333" }}>{block.text}</p>;
    case "quote":
      return (
        <blockquote style={{ borderLeft: "4px solid #B8923A", margin: "24px 0", paddingLeft: 20, color: "#555", fontStyle: "italic", fontSize: 17, lineHeight: 1.7 }}>
          {block.text}
        </blockquote>
      );
    case "callout":
      return (
        <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 10, padding: "14px 18px", margin: "20px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>💡</span>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#78350f" }}>{block.text}</p>
        </div>
      );
    case "bullets":
      return (
        <ul style={{ margin: "0 0 18px", paddingLeft: 0, listStyle: "none" }}>
          {block.items.filter(Boolean).map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8, fontSize: 15, lineHeight: 1.7, color: "#333" }}>
              <span style={{ color: "#B8923A", fontWeight: 700, fontSize: 18, lineHeight: "1.6", flexShrink: 0 }}>•</span>
              {item}
            </li>
          ))}
        </ul>
      );
    case "image":
      return (
        <figure style={{ margin: "28px 0", textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.caption} style={{ width: "100%", maxHeight: 480, objectFit: "cover", borderRadius: 12 }} />
          {block.caption && <figcaption style={{ fontSize: 13, color: "#888", marginTop: 8, fontStyle: "italic" }}>{block.caption}</figcaption>}
        </figure>
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: "2px solid #f0f0f0", margin: "32px 0" }} />;
    default:
      return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlog(slug);
  if (!post) notFound();

  const date = new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const blocks = jsonToBlocks(post.content);
  const hasBlocks = blocks.length > 0;
  const mobileCover: string | null = (post as { mobileCoverImage?: string | null }).mobileCoverImage ?? null;
  const authorName: string | null = (post as { authorName?: string | null }).authorName ?? null;

  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-14">
        {post.category && (
          <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">{post.category}</p>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4 max-w-3xl mx-auto">{post.title}</h1>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-[var(--lp-brass)]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[var(--lp-brass)]">Blog</Link>
          <span className="mx-2">/</span>
          <span>{post.title}</span>
        </p>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-12">

        {/* Author + Date */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#B8923A,#D4AF5A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {(authorName ?? "E")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{authorName ?? "East & West Travel"}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{date}</div>
          </div>
        </div>

        {/* Cover image — mobile vs desktop */}
        {(post.coverImage || mobileCover) && (
          <div style={{ position: "relative", height: "clamp(200px,40vw,420px)", marginBottom: 32, borderRadius: 16, overflow: "hidden" }}>
            {/* Mobile cover */}
            {mobileCover && (
              <Image src={mobileCover} alt={post.title} fill className="object-cover md:hidden" />
            )}
            {/* Desktop cover */}
            {post.coverImage && (
              <Image src={post.coverImage} alt={post.title} fill className={`object-cover ${mobileCover ? "hidden md:block" : ""}`} />
            )}
            {/* Fallback if only mobile provided */}
            {!post.coverImage && mobileCover && (
              <Image src={mobileCover} alt={post.title} fill className="object-cover hidden md:block" />
            )}
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: 18, color: "#555", fontStyle: "italic", lineHeight: 1.7, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #eee" }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        {hasBlocks ? (
          <div>{blocks.map(b => <BlockRenderer key={b.id} block={b} />)}</div>
        ) : post.content ? (
          <div className="prose prose-neutral max-w-none whitespace-pre-wrap text-text">{post.content}</div>
        ) : null}

        {/* Footer CTA */}
        <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <Link href="/blog" style={{ fontSize: 14, fontWeight: 700, color: "#B8923A", textDecoration: "none" }}>
            ← Back to all articles
          </Link>
          <a href={waLink(`Assalam o Alaikum! I read "${post.title}" on your website and have a question.`)}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-block", background: "#B8923A", color: "#fff", fontWeight: 700, padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontSize: 14 }}>
            Ask Us on WhatsApp
          </a>
        </div>
      </article>

      <Footer />
    </>
  );
}
