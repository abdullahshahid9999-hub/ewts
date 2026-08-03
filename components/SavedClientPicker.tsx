"use client";

import { useEffect, useState } from "react";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Client = { id: string; fullName: string; passportNumber: string | null; cnic: string | null; phone: string | null; email: string | null };

export default function SavedClientPicker({ onPick }: { onPick: (c: Client) => void }) {
  const { accessToken, refresh } = useAgentAuth();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    agentFetch("/api/agent/saved-clients", accessToken, refresh).then(async (res) => {
      if (res.ok) setClients((await res.json()).clients ?? []);
    });
  }, [accessToken, refresh]);

  if (clients.length === 0) return null;

  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const c = clients.find((x) => x.id === e.target.value);
        if (c) onPick(c);
        e.target.value = "";
      }}
      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--bdr)", color: "var(--gold)", background: "var(--white)" }}
    >
      <option value="">👥 Fill from saved client…</option>
      {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
    </select>
  );
}
