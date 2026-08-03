"use client";

const STEPS = [
  { key: "pending", label: "Pending", icon: "📝" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "issue_requested", label: "Issue Requested", icon: "📨" },
  { key: "issued", label: "Issued", icon: "🎫" },
];

export default function BookingStatusTimeline({
  status, createdAt, issueRequestedAt, issuedAt,
}: {
  status: string;
  createdAt: string;
  issueRequestedAt?: string | null;
  issuedAt?: string | null;
}) {
  // Cancelled/expired are terminal off-ramps, not part of the normal
  // forward pipeline — shown as a distinct banner instead of a step.
  if (status === "cancelled" || status === "expired") {
    return (
      <div className="ap-card no-print" style={{ padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{status === "cancelled" ? "🚫" : "⏱️"}</span>
        <div>
          <strong style={{ fontSize: 13, textTransform: "capitalize" }}>{status}</strong>
          <p style={{ fontSize: 11.5, color: "var(--muted)" }}>This booking did not complete the normal pipeline.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const times: Record<string, string | null | undefined> = { pending: createdAt, issue_requested: issueRequestedAt, issued: issuedAt };

  return (
    <div className="ap-card no-print" style={{ padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const time = times[step.key];
          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {i > 0 && (
                <div
                  style={{ position: "absolute", top: 17, right: "50%", width: "100%", height: 2, background: i <= currentIdx ? "var(--gold)" : "var(--bdr)", zIndex: 0 }}
                />
              )}
              <div
                style={{
                  width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "var(--gold)" : "var(--surface, #f2f2f2)",
                  border: isCurrent ? "2px solid var(--gold)" : "1px solid var(--bdr)",
                  fontSize: 15, zIndex: 1, position: "relative",
                }}
              >
                {step.icon}
              </div>
              <p style={{ fontSize: 11.5, fontWeight: isCurrent ? 700 : 500, marginTop: 6, color: done ? "var(--text)" : "var(--muted)", textAlign: "center" }}>
                {step.label}
              </p>
              {done && time && (
                <p style={{ fontSize: 9.5, color: "var(--muted)", textAlign: "center" }}>
                  {new Date(time).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
