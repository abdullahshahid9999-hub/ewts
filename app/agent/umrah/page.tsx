import { prisma } from "@/lib/prisma";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentPackageFilter from "@/components/AgentPackageFilter";

export const revalidate = 60;

async function getPackages() {
  try {
    return await prisma.package.findMany({
      where: { category: "umrah", status: "active" },
      include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  } catch { return []; }
}

export default async function AgentUmrahPage() {
  const packages = await getPackages();
  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div><h2>Umrah <span>Packages</span></h2><p>Browse packages the same way your customer would</p></div>
        </div>
        {packages.length === 0 ? (
          <p className="etd">No active Umrah packages right now.</p>
        ) : (
          <AgentPackageFilter packages={packages as Parameters<typeof AgentPackageFilter>[0]["packages"]} />
        )}
      </AgentShell>
    </AgentGuard>
  );
}
