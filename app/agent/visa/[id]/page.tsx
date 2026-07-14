import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentVisaApplyFlow from "@/components/AgentVisaApplyFlow";

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

export default async function AgentVisaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visa = await getVisa(id);
  if (!visa) notFound();

  const hasPricing = visa.priceAdult !== null;

  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div>
            <h2>{visa.countryFlag ? `${visa.countryFlag} ` : ""}<span>{visa.title}</span></h2>
            <p>
              <Link href="/agent/visa" style={{ color: "var(--muted)" }}>← Back to Visa Services</Link>
              {" · "}<span style={{ textTransform: "capitalize" }}>{visa.country} · {visa.type} visa</span>
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20, alignItems: "start" }}>
          {/* LEFT: same "read first" info as the public detail page */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="ap-card" style={{ padding: 18 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Visa Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {visa.processingTime && <Fact label="Processing Time" value={visa.processingTime} />}
                {visa.validity && <Fact label="Validity" value={visa.validity} />}
                {visa.maxStay && <Fact label="Max Stay" value={visa.maxStay} />}
                {visa.days && <Fact label="Duration" value={visa.days} />}
                <Fact label="Visa Type" value={visa.type.charAt(0).toUpperCase() + visa.type.slice(1)} />
                <Fact label="Country" value={visa.country} />
              </div>
            </div>

            {hasPricing && (
              <div className="ap-card" style={{ padding: 18 }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Pricing (PKR)</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
                  <PriceCard label="Adult" amount={visa.priceAdult!} />
                  <PriceCard label="Child" amount={visa.priceChild!} />
                  <PriceCard label="Infant" amount={visa.priceInfant!} />
                </div>
              </div>
            )}

            {visa.requiredDocuments.length > 0 && (
              <div className="ap-card" style={{ padding: 18 }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Required Documents</p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Make sure the customer has these ready before applying.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {visa.requiredDocuments.map((doc) => (
                    <div key={doc.id} style={{ display: "flex", gap: 10, padding: 10, borderRadius: 10, border: "1px solid var(--bdr)", background: "var(--bg)" }}>
                      <span style={{ fontSize: 16 }}>{doc.isRequired ? "📄" : "📎"}</span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                          {doc.name}
                          {!doc.isRequired && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>(optional)</span>}
                        </div>
                        {doc.description && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{doc.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visa.requirements && visa.requiredDocuments.length === 0 && (
              <div className="ap-card" style={{ padding: 18 }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Requirements</p>
                <p style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "pre-wrap" }}>{visa.requirements}</p>
              </div>
            )}
          </div>

          {/* RIGHT: the apply flow itself */}
          <div>
            <AgentVisaApplyFlow visa={{
              id: visa.id,
              title: visa.title,
              country: visa.country,
              type: visa.type,
              priceAdult: visa.priceAdult,
              priceChild: visa.priceChild,
              priceInfant: visa.priceInfant,
              requiredDocuments: visa.requiredDocuments.map((d) => ({
                id: d.id, name: d.name, description: d.description, isRequired: d.isRequired,
              })),
            }} />
          </div>
        </div>
      </AgentShell>
    </AgentGuard>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 12.5, fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function PriceCard({ label, amount }: { label: string; amount: number }) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: 10, padding: 10 }}>
      <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{amount > 0 ? `PKR ${amount.toLocaleString()}` : "Free"}</p>
    </div>
  );
}
