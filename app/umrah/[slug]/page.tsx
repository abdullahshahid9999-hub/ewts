import { notFound } from "next/navigation";
import Link from "next/link";
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
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link href="/umrah" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-amber-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Back to Packages
        </Link>
      </div>
      <PackageDetailView pkg={pkg} initialAdults={initialAdults} initialChildren={initialChildren} initialInfants={initialInfants} />
      <Footer />
    </>
  );
}
