import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VisaApplyWizard from "./VisaApplyWizard";

export const revalidate = 60;

async function getVisa(id: string) {
  try {
    return await prisma.visaService.findUnique({
      where: { id, status: "active" },
      include: { requiredDocuments: { orderBy: [{ sortOrder: "asc" }] } },
    });
  } catch {
    return null;
  }
}

export default async function VisaApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adults?: string; children?: string; infants?: string; occupation?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const visa = await getVisa(id);
  if (!visa) notFound();

  const initialAdults = sp.adults ? Math.max(1, parseInt(sp.adults, 10) || 1) : 1;
  const initialChildren = sp.children ? Math.max(0, parseInt(sp.children, 10) || 0) : 0;
  const initialInfants = sp.infants ? Math.max(0, parseInt(sp.infants, 10) || 0) : 0;
  const initialOccupation = sp.occupation ?? "";

  return (
    <>
      <Navbar />
      <div className="bg-[var(--lp-ink)] text-white px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[var(--lp-brass)] text-xs font-semibold tracking-widest uppercase mb-2">
            <Link href="/visa" className="hover:underline">Visa Services</Link>
            {" / "}
            <Link href={`/visa/${id}`} className="hover:underline">{visa.country}</Link>
            {" / Apply"}
          </p>
          <h1 className="font-display text-2xl font-semibold">{visa.countryFlag && <span className="mr-2">{visa.countryFlag}</span>}Apply — {visa.title}</h1>
        </div>
      </div>
      <VisaApplyWizard
        visa={{
          id: visa.id,
          title: visa.title,
          country: visa.country,
          type: visa.type,
          processingTime: visa.processingTime,
          priceAdult: visa.priceAdult,
          priceChild: visa.priceChild,
          priceInfant: visa.priceInfant,
          requiredDocuments: visa.requiredDocuments.map((d: { id: string; name: string; description: string | null; isRequired: boolean; icon?: string | null; applicantCategory?: string | null; nationality?: string | null }) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            isRequired: d.isRequired,
            icon: (d as { icon?: string | null }).icon ?? null,
            applicantCategory: (d as { applicantCategory?: string | null }).applicantCategory ?? null,
            nationality: (d as { nationality?: string | null }).nationality ?? null,
          })),
        }}
        initialAdults={initialAdults}
        initialChildren={initialChildren}
        initialInfants={initialInfants}
        initialOccupation={initialOccupation}
      />
      <Footer />
    </>
  );
}
