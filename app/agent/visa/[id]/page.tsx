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
        {/* Hero header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
            <Link href="/agent/visa" style={{ color: "var(--muted)" }}>← Back to Visa Services</Link>
            {" · "}{visa.country} · <span style={{ textTransform: "capitalize" }}>{visa.type} Visa</span>
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                {visa.countryFlag && <span style={{ marginRight: 8 }}>{visa.countryFlag}</span>}
                {visa.title}
              </h2>
              {visa.entryType && (
                <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(184,142,62,0.12)", border: "1px solid rgba(184,142,62,0.3)", color: "var(--gold-dim,#9C7E3A)", fontWeight: 600 }}>
                  {visa.entryType === "single" ? "Single Entry" : visa.entryType === "multiple" ? "Multiple Entry" : "Transit"}
                </span>
              )}
            </div>
            {hasPricing && (
              <div style={{ display: "flex", gap: 10 }}>
                {[["Adult", visa.priceAdult], ["Child", visa.priceChild], ["Infant", visa.priceInfant]].map(([l, p]) => (
                  <div key={String(l)} style={{ textAlign: "center", background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "8px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>PKR {Number(p).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
