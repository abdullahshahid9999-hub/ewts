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
  } catch { return null; }
}

export default async function AgentVisaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visa = await getVisa(id);
  if (!visa) notFound();

  const hasPricing = visa.priceAdult !== null;

  return (
    <AgentGuard>
      <AgentShell>
        {/* Hero image */}
        {visa.countryImage && (
          <div style={{ position: "relative", width: "100%", height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visa.countryImage} alt={visa.country} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }} />
            <div style={{ position: "absolute", bottom: 20, left: 24 }}>
              <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                {visa.countryFlag && <span style={{ marginRight: 8 }}>{visa.countryFlag}</span>}{visa.title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
                <Link href="/agent/visa" style={{ color: "rgba(255,255,255,0.7)" }}>← Back to Visa Services</Link>
                {" · "}<span style={{ textTransform: "capitalize" }}>{visa.country} · {visa.type} Visa</span>
              </p>
            </div>
          </div>
        )}
        {/* Header — only shown when no hero image */}
        {!visa.countryImage && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <Link href="/agent/visa" style={{ color: "var(--muted)" }}>← Back to Visa Services</Link>
              {" · "}{visa.country} · <span style={{ textTransform: "capitalize" }}>{visa.type} Visa</span>
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {visa.countryFlag && <span style={{ marginRight: 8 }}>{visa.countryFlag}</span>}{visa.title}
            </h2>
          </div>
        )}

        {/* Two-column info strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
          {[
            visa.days && ["⏱ Processing", visa.days],
            visa.validity && ["📅 Validity", visa.validity],
            visa.maxStay && ["🏨 Max Stay", visa.maxStay],
            ["🗂 Type", visa.type.charAt(0).toUpperCase() + visa.type.slice(1)],
            ["🌍 Country", visa.country],
          ].filter(Boolean).map((f) => {
            const [label, value] = f as [string, string];
            return (
              <div key={label} style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{value}</div>
              </div>
            );
          })}
        </div>

        {/* Required docs strip — read-only reference */}
        {visa.requiredDocuments.length > 0 && (
          <div className="ap-card" style={{ padding: "14px 18px", marginBottom: 24 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Required Documents</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8 }}>
              {visa.requiredDocuments.map((doc) => (
                <div key={doc.id} style={{ display: "flex", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--bdr)", background: "rgba(255,255,255,0.5)", alignItems: "flex-start" }}>
                  <span style={{ marginTop: 1 }}>{doc.isRequired ? "📄" : "📎"}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{doc.name}
                      {!doc.isRequired && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 4 }}>(optional)</span>}
                      {doc.applicantCategory && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 4 }}>· {doc.applicantCategory}</span>}
                    </div>
                    {doc.description && <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>{doc.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full-width application wizard */}
        <AgentVisaApplyFlow visa={{
          id: visa.id, title: visa.title, country: visa.country, type: visa.type,
          priceAdult: visa.priceAdult, priceChild: visa.priceChild, priceInfant: visa.priceInfant,
          requiredDocuments: visa.requiredDocuments.map((d) => ({
            id: d.id, name: d.name, description: d.description, isRequired: d.isRequired,
          })),
        }} />
      </AgentShell>
    </AgentGuard>
  );
}
