"use client";
import { useEffect, useRef, useState } from "react";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type SavedClient = { id: string; fullName: string; passportNumber?: string|null; phone?: string|null; email?: string|null };

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (c: SavedClient) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ClientAutoSuggest({ value, onChange, onSelect, placeholder, required }: Props) {
  const { accessToken, refresh } = useAgentAuth();
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [filtered, setFiltered] = useState<SavedClient[]>([]);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    agentFetch("/api/agent/saved-clients", accessToken, refresh)
      .then(r => r.json()).then(d => setClients(d.clients ?? [])).catch(() => {});
  }, [accessToken, refresh]);

  useEffect(() => {
    if (value.length < 2) { setFiltered([]); setShow(false); return; }
    const q = value.toLowerCase();
    const m = clients.filter(c => c.fullName.toLowerCase().includes(q)).slice(0, 6);
    setFiltered(m); setShow(m.length > 0);
  }, [value, clients]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input required={required} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => { if (filtered.length > 0) setShow(true); }}
        placeholder={placeholder ?? "Customer full name"}
        style={{ width: "100%", boxSizing: "border-box" }} />
      {show && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--bdr)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden" }}>
          {filtered.map(c => (
            <button key={c.id} type="button"
              onMouseDown={() => { onSelect(c); onChange(c.fullName); setShow(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fa")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.fullName}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{[c.phone, c.passportNumber].filter(Boolean).join(" · ")}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
