import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentPackageBookingWidget from "@/components/AgentPackageBookingWidget";

export const revalidate = 60;

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

function parseList(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export default async function AgentUmrahDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  const includes = parseList(pkg.includes);
  const excludes = parseList(pkg.excludes);

  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div>
            <h2><span>{pkg.name}</span></h2>
            <p>
              <Link href="/agent/umrah" style={{ color: "var(--muted)" }}>← Back to Umrah packages</Link>
              {pkg.duration ? ` · ${pkg.duration}` : ""} {pkg.departureCity ? ` · from ${pkg.departureCity}` : ""}
            </p>
          </div>
        </div>

        <div className="relative h-56 rounded-2xl overflow-hidden bg-surface mb-6">
          {pkg.imageUrl ? (
            <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-white/50 text-sm">
              {pkg.name}
            </div>
          )}
        </div>

        {(includes.length > 0 || excludes.length > 0) && (
          <div className="ap-card">
            <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {includes.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>What&apos;s Included</p>
                  <ul style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.8 }}>
                    {includes.map((i, k) => <li key={k}>✓ {i}</li>)}
                  </ul>
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Not Included</p>
                  <ul style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.8 }}>
                    {excludes.map((i, k) => <li key={k}>✕ {i}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <AgentPackageBookingWidget packageId={pkg.id} roomTypes={pkg.roomTypes} category="umrah" />
      </AgentShell>
    </AgentGuard>
  );
}
