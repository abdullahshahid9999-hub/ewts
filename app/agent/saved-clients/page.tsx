"use client";

import { useEffect, useState, useCallback } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Client = { id: string; fullName: string; passportNumber: string | null; cnic: string | null; phone: string | null; email: string | null };

function Inner() {
  const { accessToken, refresh } = useAgentAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: "", passportNumber: "", cnic: "", phone: "", email: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await agentFetch("/api/agent/saved-clients", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setClients(data.clients ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await agentFetch("/api/agent/saved-clients", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not save client."); return; }
    setForm({ fullName: "", passportNumber: "", cnic: "", phone: "", email: "" });
    load();
  }

  async function removeClient(id: string) {
    await agentFetch(`/api/agent/saved-clients/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="ap-ph">
        <div><h2>Saved <span>Clients</span></h2><p>Frequent passengers — pick them from a list next time instead of retyping</p></div>
      </div>

      <div className="ap-card" style={{ padding: 18, marginBottom: 16 }}>
        <form onSubmit={addClient} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <input required placeholder="Full Name *" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <input placeholder="Passport No." value={form.passportNumber} onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))} />
          <input placeholder="CNIC" value={form.cnic} onChange={(e) => setForm((f) => ({ ...f, cnic: e.target.value }))} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <button type="submit" className="ap-btn ap-btn-gold">+ Save Client</button>
        </form>
        {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>

      <div className="ap-card">
        {loading ? (
          <p style={{ padding: 16 }}>Loading…</p>
        ) : clients.length === 0 ? (
          <p style={{ padding: 16, color: "var(--muted)" }}>No saved clients yet — add one above, or save one directly from a booking form.</p>
        ) : (
          <table className="ap-table">
            <thead><tr><th>Name</th><th>Passport</th><th>CNIC</th><th>Phone</th><th>Email</th><th></th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.fullName}</strong></td>
                  <td>{c.passportNumber ?? "—"}</td>
                  <td>{c.cnic ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td><button onClick={() => removeClient(c.id)} className="ap-btn ap-btn-ghost" style={{ color: "var(--red)" }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function SavedClientsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <Inner />
      </AgentShell>
    </AgentGuard>
  );
}
