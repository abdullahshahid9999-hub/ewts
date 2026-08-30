import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StepForm from "../StepForm";

export default async function EditStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const step = await prisma.umrahStep.findUnique({ where: { id } });
  if (!step) notFound();
  return <StepForm existing={{ ...step, description: step.description ?? null, imageUrl: step.imageUrl ?? null }} />;
}
