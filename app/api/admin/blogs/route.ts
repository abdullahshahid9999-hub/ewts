import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ blogs });
  } catch (e) {
    console.error("Blogs list failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to load blogs." }, { status: 500 });
  }
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();
  const title = form.get("title");
  if (typeof title !== "string" || !title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const requestedSlug = str("slug");
  const slug = requestedSlug ? slugify(requestedSlug) : slugify(title);

  const clash = await prisma.blog.findUnique({ where: { slug } });
  if (clash) {
    return NextResponse.json({ error: "A blog with this slug already exists." }, { status: 409 });
  }

  let coverImage: string | undefined;
  const file = form.get("coverImage");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    coverImage = await uploadToR2({ buffer, contentType: file.type, folder: "blogs" });
  }

  const blog = await prisma.blog.create({
    data: {
      title,
      slug,
      category: str("category"),
      coverImage,
      excerpt: str("excerpt"),
      content: str("content"),
      published: form.get("published") === "true",
    },
  });

  return NextResponse.json({ blog }, { status: 201 });
}
