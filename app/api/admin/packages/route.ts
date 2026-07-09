import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

// GET is intentionally open (packages are public content, matching the
// public site's read-only queries) — only writes require admin auth.
export async function GET() {
  const packages = await prisma.package.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ packages });
}

/**
 * Accepts multipart/form-data so a single request can carry both the
 * package fields and an optional image file. The client is expected to
 * have already compressed the image to ~1280px/JPEG q0.8 before upload
 * (see admin panel brief) — this route re-validates content type but does
 * not re-compress server-side.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();

  const category = form.get("category");
  const name = form.get("name");
  if (typeof category !== "string" || typeof name !== "string" || !category || !name) {
    return NextResponse.json({ error: "category and name are required." }, { status: 400 });
  }
  if (category !== "umrah" && category !== "tours") {
    return NextResponse.json({ error: "category must be 'umrah' or 'tours'." }, { status: 400 });
  }

  let imageUrl: string | undefined;
  const file = form.get("image");
  if (file instanceof File) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await uploadToR2({ buffer, contentType: file.type, folder: "packages" });
    } catch (e) {
      console.error("Package image upload failed:", e);
      return NextResponse.json(
        { error: e instanceof Error ? `Image upload failed: ${e.message}` : "Image upload failed." },
        { status: 500 }
      );
    }
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const pkg = await prisma.package.create({
    data: {
      category,
      name,
      duration: str("duration"),
      price: str("price"),
      priceNote: str("priceNote"),
      destination: str("destination"),
      depDate: str("depDate"),
      retDate: str("retDate"),
      airline: str("airline"),
      route: str("route"),
      hotels: str("hotels"),
      includes: str("includes"),
      excludes: str("excludes"),
      imageUrl,
      featured: form.get("featured") === "true",
      status: str("status") ?? "active",
    },
  });

  return NextResponse.json({ package: pkg }, { status: 201 });
}
