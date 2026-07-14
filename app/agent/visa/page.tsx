import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";

export const revalidate = 60;

async function getVisas() {
  try {
    return await prisma.visaService.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, country: true, type: true,
        price: true, priceAdult: true,
        validity: true, processingTime: true, countryFlag: true, countryImage: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function AgentVisaPage() {
  const visas = await getVisas();

  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div><h2>Visa <span>Services</span></h2><p>Browse visas the same way your customer would, and apply on their behalf</p></div>
        </div>

        {visas.length === 0 ? (
          <p className="etd">No active visa services right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visas.map((v) => (
              <Link key={v.id} href={`/agent/visa/${v.id}`} className="ap-card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div className="relative h-36 bg-surface">
                  {v.countryImage ? (
                    <Image src={v.countryImage} alt={v.country} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-white/50 text-xs">
                      {v.country}
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    {v.countryFlag && <span style={{ fontSize: 16 }}>{v.countryFlag}</span>}
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{v.title}</p>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>
                    {v.country} · {v.type} visa{v.processingTime ? ` · ${v.processingTime}` : ""}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginTop: 6 }}>
                    {v.priceAdult != null ? `PKR ${v.priceAdult.toLocaleString()}` : (v.price ?? "Enquire")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </AgentShell>
    </AgentGuard>
  );
}
