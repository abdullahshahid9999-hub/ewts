"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

type AppDoc = {
  id: string;
  fileName: string;
  fileUrl: string;
  document: { name: string } | null;
};

type Application = {
  id: string;
  batchRef: string;
  fullName: string;
  passportNumber: string;
  adults: number;
  children: number;
  infants: number;
  totalPricePkr: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
  visa: { title: string; country: string; type: string; countryFlag: string | null };
  documents: AppDoc[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  pending:          { label: "Pending Review",   color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳" },
  under_review:     { label: "Under Review",     color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", icon: "🔍" },
  approved:         { label: "Approved",         color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0", icon: "✅" },
  rejected:         { label: "Rejected",         color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", icon: "❌" },
  more_info_needed: { label: "More Info Needed", color: "#7C2D12", bg: "#FFF7ED", border: "#FED7AA", icon: "📋" },
};

function MyApplicationsInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("ref") ?? "");
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setApps(null);
    const isEmail = q.includes("@");
    const params = new URLSearchParams(isEmail ? { email: q.trim() } : { batchRef: q.trim() });
    const res = await fetch(`/api/visa-applications/track?${params}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not load applications."); return; }
    setApps(data.applications ?? []);
  }

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) doSearch(ref);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function search(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <>
      <Navbar />

      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-10">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">Visa Applications</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Track Your <span className="italic text-gold">Applications</span>
        </h1>
        <p className="text-white/60 text-sm max-w-md mx-auto mb-4">
          Enter the email you used when applying, or your batch reference number.
        </p>
        <p className="text-white/40 text-xs">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/visa" className="hover:text-gold">Visa Services</Link>
          <span className="mx-2">/</span>
          <span>My Applications</span>
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-6 py-12">

        <form onSubmit={search} className="flex gap-3 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email address or reference number (VA-...)"
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? "Searching…" : "Track →"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">{error}</div>
        )}

        {apps !== null && apps.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold mb-1">No applications found</p>
            <p className="text-sm">Double-check the email or reference number used when applying.</p>
          </div>
        )}

        {apps && apps.length > 0 && (
          <div className="space-y-5">
            <p className="text-sm text-muted">{apps.length} application{apps.length !== 1 ? "s" : ""} found</p>

            {apps.map((app) => {
              const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
              const isMoreInfo = app.status === "more_info_needed";
              const waMsg = `Assalam o Alaikum! My visa application reference is ${app.batchRef}. Here is the additional information requested: `;

              return (
                <div
                  key={app.id}
                  className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
                  style={{ borderColor: isMoreInfo ? "#FED7AA" : undefined }}
                >
                  {/* Header */}
                  <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {app.visa.countryFlag && <span className="text-lg">{app.visa.countryFlag}</span>}
                        <h3 className="font-semibold">{app.visa.title}</h3>
                      </div>
                      <p className="text-muted text-xs capitalize">{app.visa.country} · {app.visa.type} visa</p>
                    </div>
                    <div
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                    >
                      <span>{sc.icon}</span> {sc.label}
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Detail label="Applicant" value={app.fullName} />
                      <Detail label="Passport" value={app.passportNumber} />
                      <Detail label="Travelers" value={[
                        `${app.adults} Adult${app.adults !== 1 ? "s" : ""}`,
                        app.children ? `${app.children} Child${app.children !== 1 ? "ren" : ""}` : "",
                        app.infants ? `${app.infants} Infant${app.infants !== 1 ? "s" : ""}` : "",
                      ].filter(Boolean).join(", ")} />
                      <Detail label="Submitted" value={new Date(app.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} />
                      {app.totalPricePkr > 0 && <Detail label="Total Price" value={`PKR ${app.totalPricePkr.toLocaleString()}`} />}
                      <Detail label="Ref #" value={app.batchRef} mono />
                    </div>

                    {/* Uploaded docs */}
                    {app.documents.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Submitted Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {app.documents.map((doc) => (
                            <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs font-semibold text-gold border border-border rounded-lg px-3 py-1.5 hover:border-gold transition-colors">
                              📎 {doc.document?.name ?? doc.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin note — prominently shown */}
                    {app.adminNote && (
                      <div className="rounded-xl p-4" style={{ background: sc.bg, border: `1.5px solid ${sc.border}` }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: sc.color }}>
                          {isMoreInfo ? "📋 Action Required — Message from East & West:" : "📝 Note from East & West:"}
                        </p>
                        <p className="text-sm font-medium" style={{ color: sc.color }}>{app.adminNote}</p>
                      </div>
                    )}

                    {/* More info CTA — WhatsApp reply */}
                    {isMoreInfo && (
                      <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
                        💬 Reply on WhatsApp with Required Info
                      </a>
                    )}

                    {/* Approved congratulations */}
                    {app.status === "approved" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <p className="text-emerald-700 font-semibold text-sm">🎉 Congratulations! Your visa has been approved.</p>
                        <p className="text-emerald-600 text-xs mt-1">East & West will contact you with next steps.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default function MyApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <MyApplicationsInner />
    </Suspense>
  );
}
