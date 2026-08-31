import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PackageForm, { ExistingPackage } from "@/components/PackageForm";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pkg) notFound();
  return <PackageForm existing={pkg as unknown as ExistingPackage} />;
}
