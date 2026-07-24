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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ adults?: string; children?: string; infants?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialAdults = sp.adults ? parseInt(sp.adults, 10) || 1 : undefined;
  const initialChildren = sp.children ? parseInt(sp.children, 10) || 0 : undefined;
  const initialInfants = sp.infants ? parseInt(sp.infants, 10) || 0 : undefined;
  const pkg = await getPackage(slug);

  if (!pkg) notFound();

  return (
    <>
      <Navbar />
      <PackageDetailView pkg={pkg} initialAdults={initialAdults} initialChildren={initialChildren} initialInfants={initialInfants} />
      <Footer />
    </>
  );
}
