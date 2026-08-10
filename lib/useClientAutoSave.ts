import { useState } from "react";
import { agentFetch } from "@/lib/agentAuthClient";

export type ConflictMatch = { id: string; fullName: string; phone?: string|null; passportNumber?: string|null };

export function useClientAutoSave() {
  const [conflict, setConflict] = useState<ConflictMatch[]|null>(null);
  const [pending, setPending] = useState<Record<string,string>|null>(null);

  async function autoSave(data: { fullName: string; phone?: string; email?: string; passportNumber?: string }, accessToken: string|null, refresh: () => Promise<string|null>) {
    if (!data.fullName?.trim()) return;
    setPending(data as Record<string,string>);
    const res = await agentFetch("/api/agent/saved-clients/auto-save", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const d = await res.json().catch(() => ({}));
    if (d.conflict && d.matches?.length > 0) setConflict(d.matches);
    else { setPending(null); }
  }

  async function saveAsNew(accessToken: string|null, refresh: () => Promise<string|null>) {
    if (!pending) return;
    await agentFetch("/api/agent/saved-clients/auto-save", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pending, forceNew: true }),
    });
    setConflict(null); setPending(null);
  }

  return { autoSave, conflict, saveAsNew, dismiss: () => { setConflict(null); setPending(null); } };
}
