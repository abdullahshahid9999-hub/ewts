"use client";
import { ConflictMatch } from "@/lib/useClientAutoSave";

export default function ClientConflictModal({ matches, onSaveNew, onDismiss }: { matches: ConflictMatch[]; onSaveNew: () => void; onDismiss: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>👥</div>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Client Already Exists?</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Similar name found in saved clients. Same person or new client?</p>
        <div style={{ marginBottom: 18 }}>
          {matches.map(m => (
            <div key={m.id} style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{m.fullName}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{[m.phone, m.passportNumber].filter(Boolean).join(" · ") || "No additional info"}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onDismiss} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Existing — Don&apos;t Save Again</button>
          <button onClick={onSaveNew} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#0A1930", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Save as New Client</button>
        </div>
      </div>
    </div>
  );
}
