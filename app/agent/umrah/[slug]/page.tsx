import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentPackageBookingWidget from "@/components/AgentPackageBookingWidget";
import FlightStatusBadge from "@/components/FlightStatusBadge";
import ItineraryImageDownload from "@/components/ItineraryImageDownload";

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

type Sector = { type: string; flightNo?: string; airlineIata?: string; fromIata?: string; fromName?: string; toIata?: string; toName?: string; city?: string; date?: string; time?: string };
function parseSectors(raw: unknown): Sector[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((s): s is Sector => !!s && typeof s === "object");
}

export default async function AgentUmrahDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  const includes = parseList(pkg.includes);
  const excludes = parseList(pkg.excludes);
  const sectors = parseSectors(pkg.flightSectors);

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

        {sectors.length > 0 && (
          <div className="ap-card" style={{ marginBottom: 16 }}>
            <div style={{ padding: "14px 18px" }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>✈ Flight Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sectors.map((sec, i) => {
                  const from = sec.fromIata || sec.city || "";
                  const to = sec.toIata || "";
                  return (
                    <div key={i} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "#f9fafb" }}>
                      {sec.airlineIata && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://images.kiwi.com/airlines/64/${sec.airlineIata}.png`} alt="" style={{ height: 20, objectFit: "contain" }} />
                      )}
                      <span style={{ fontSize: 11, fontWeight: 800, color: sec.type === "Departure" ? "#16a34a" : sec.type === "Arrival" ? "#dc2626" : "#7c3aed" }}>{sec.type}</span>
                      {from && <span style={{ fontSize: 13, fontWeight: 600 }}>{from}{to ? ` → ${to}` : ""}</span>}
                      {sec.date && <span style={{ fontSize: 11, color: "var(--muted)" }}>{sec.date}{sec.time ? ` · ${sec.time}` : ""}</span>}
                      {sec.flightNo && <div style={{ marginLeft: "auto" }}><FlightStatusBadge flightIata={sec.flightNo} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(includes.length > 0 || excludes.length > 0) && (
          <div className="ap-card">
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ padding: "16px 18px", gap: 20 }}>
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

        <div style={{ padding: "0 16px 16px" }}>
          <ItineraryImageDownload
            packageName={pkg.name}
            tier={pkg.tier}
            duration={pkg.duration}
            airline={pkg.airline}
            route={pkg.route}
            depDate={pkg.depDate}
            retDate={pkg.retDate}
            departureCity={pkg.departureCity}
            flightType={pkg.flightType}
            luggage={pkg.luggage}
            transportType={pkg.transportType}
            makkahHotel={pkg.makkahHotel}
            makkahHotelDistance={pkg.makkahHotelDistance}
            makkahHotelNights={pkg.makkahHotelNights}
            makkahHotelImg={pkg.makkahHotelImg}
            madinahHotel={pkg.madinahHotel}
            madinahHotelDistance={pkg.madinahHotelDistance}
            madinahHotelNights={pkg.madinahHotelNights}
            madinahHotelImg={pkg.madinahHotelImg}
            roomTypes={pkg.roomTypes.map(r => ({ roomType: r.roomType, pricePerPersonPkr: r.pricePerPersonPkr, pricePerChildWithBedPkr: r.pricePerChildWithBedPkr, pricePerInfantPkr: r.pricePerInfantPkr }))}
            includes={pkg.includes}
          />
        </div>

        <AgentPackageBookingWidget packageId={pkg.id} roomTypes={pkg.roomTypes} category="umrah" />
      </AgentShell>
    </AgentGuard>
  );
}
