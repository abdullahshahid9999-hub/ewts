import { requireAdminPage } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "package.created":       { label: "Package Created",   color: "#16a34a" },
  "package.edited":        { label: "Package Edited",    color: "#2563eb" },
  "package.deleted":       { label: "Package Deleted",   color: "#dc2626" },
  "package.duplicated":    { label: "Package Duplicated",color: "#7c3aed" },
  "package.auto_expired":  { label: "Auto Expired",      color: "#d97706" },
  "agent.edited":          { label: "Agent Edited",      color: "#2563eb" },
  "agent.status_changed:active":    { label: "Agent Activated",   color: "#16a34a" },
  "agent.status_changed:suspended": { label: "Agent Suspended",   color: "#dc2626" },
};

function actionStyle(action: string) {
  const m = ACTION_LABELS[action];
  return m ?? { label: action, color: "#6b7280" };
}

function relTime(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const filterAction = sp.action ?? "";
  const pageSize = 50;

  const where = filterAction ? { action: { contains: filterAction } } : {};

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const tdStyle = { padding: "10px 12px", borderBottom: "1px solid var(--a-border)", fontSize: 12, verticalAlign: "top" } as const;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🔍 Audit Log</h1>
          <p style={{ color: "var(--a-muted)", fontSize: 13, marginTop: 4 }}>Every admin action recorded. {total.toLocaleString()} total entries.</p>
        </div>
        <Link href="/admin/packages" style={{ fontSize: 12, color: "var(--a-muted)" }}>← Back</Link>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["", "package", "agent", "auto_expired"].map(f => (
          <Link key={f} href={f ? `/admin/audit-log?action=${f}` : "/admin/audit-log"}
            style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
              background: filterAction === f ? "var(--a-blue)" : "var(--a-card)",
              color: filterAction === f ? "#fff" : "var(--a-muted)",
              border: "1.5px solid var(--a-border)", textDecoration: "none" }}>
            {f === "" ? "All" : f === "package" ? "Packages" : f === "agent" ? "Agents" : "Auto-Expired"}
          </Link>
        ))}
      </div>

      <div style={{ background: "var(--a-card)", borderRadius: 12, border: "1.5px solid var(--a-border)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--a-hover)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--a-muted)" }}>
              <th style={{ ...tdStyle, width: 140 }}>When</th>
              <th style={{ ...tdStyle, width: 160 }}>Action</th>
              <th style={{ ...tdStyle }}>Admin</th>
              <th style={{ ...tdStyle }}>Target</th>
              <th style={{ ...tdStyle }}>Details</th>
              <th style={{ ...tdStyle, width: 110 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--a-muted)", padding: "32px 0" }}>No entries found.</td></tr>
            )}
            {logs.map(log => {
              const { label, color } = actionStyle(log.action);
              let meta: Record<string, unknown> = {};
              try { meta = JSON.parse(log.meta ?? "{}"); } catch { /* ignore */ }
              return (
                <tr key={log.id} style={{ transition: "background 0.1s" }}>
                  <td style={{ ...tdStyle, color: "var(--a-muted)", whiteSpace: "nowrap" }}>
                    {relTime(log.createdAt)}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
                      {new Date(log.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: `${color}18`, color, border: `1px solid ${color}30` }}>
                      {label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{log.adminEmail}</td>
                  <td style={{ ...tdStyle, color: "var(--a-muted)", fontFamily: "monospace", fontSize: 11 }}>{log.target}</td>
                  <td style={tdStyle}>
                    {meta.name && <span style={{ fontWeight: 600 }}>{String(meta.name)}</span>}
                    {meta.changedFields && (
                      <span style={{ color: "var(--a-muted)", fontSize: 10 }}> · {(meta.changedFields as string[]).join(", ")}</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: "var(--a-muted)", fontSize: 10, fontFamily: "monospace" }}>{log.ip ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          {page > 1 && <Link href={`/admin/audit-log?page=${page - 1}${filterAction ? `&action=${filterAction}` : ""}`} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "1.5px solid var(--a-border)", textDecoration: "none", color: "var(--a-muted)" }}>← Prev</Link>}
          <span style={{ fontSize: 12, padding: "6px 14px", color: "var(--a-muted)" }}>Page {page} / {totalPages}</span>
          {page < totalPages && <Link href={`/admin/audit-log?page=${page + 1}${filterAction ? `&action=${filterAction}` : ""}`} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "1.5px solid var(--a-border)", textDecoration: "none", color: "var(--a-muted)" }}>Next →</Link>}
        </div>
      )}
    </div>
  );
}
