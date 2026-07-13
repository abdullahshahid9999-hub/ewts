import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";

export const revalidate = 60;

async function getPackages() {
  try {
    return await prisma.package.findMany({
      where: { category: "tours", status: "active" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function AgentToursPage() {
  const packages = await getPackages();

  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div><h2>World <span>Tours</span></h2><p>Browse packages the same way your customer would</p></div>
        </div>

        {packages.length === 0 ? (
          <p className="etd">No active tour packages right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={pkg.slug ? `/agent/tours/${pkg.slug}` : "#"}
                className="ap-card"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div className="relative h-36 bg-surface">
                  {pkg.imageUrl ? (
                    <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-white/50 text-xs">
                      {pkg.name}
                    </div>
                  )}
                  {pkg.featured && (
                    <span className="absolute top-2 left-2 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded">Featured</span>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{pkg.name}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginTop: 6 }}>{pkg.price}</p>
                  {!pkg.slug && (
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>No slug set — ask admin to add one before booking through this page.</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </AgentShell>
    </AgentGuard>
  );
}
