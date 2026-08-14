import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentVisaBookingsList from "@/components/AgentVisaBookingsList";
import Link from "next/link";

export default function AgentVisaApplicationsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div>
            <h2>Visa <span>Applications</span></h2>
            <p>Track all visa applications you&apos;ve submitted on behalf of your clients</p>
          </div>
          <Link href="/agent/visa" className="adp-btn adp-btn-g" style={{ textDecoration: "none" }}>
            + New Application
          </Link>
        </div>

        {/* Commission info banner */}
        <div style={{ margin: "0 0 20px", padding: "12px 16px", borderRadius: 12, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
            Your commission on each visa application is computed at submission time and shown in your finance ledger.
            Contact your admin to configure your Visa Services commission rate.
          </p>
        </div>

        <AgentVisaBookingsList />
      </AgentShell>
    </AgentGuard>
  );
}
