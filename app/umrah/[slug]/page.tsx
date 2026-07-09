import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageDetailView from "@/components/PackageDetailView";

export const revalidate = 120;

async function getPackage(slug: string) {
  try {
    return await prisma.package.findFirst({
      where: { slug, category: "umrah", status: "active" },
      include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
    });
  } catch {
    return null;
  }
}

export default async function UmrahDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = await getPackage(slug);

  if (!pkg) notFound();

  return (
    <>
      <Navbar />
      <PackageDetailView pkg={pkg} />
      <Footer />
    </>
  );
}
