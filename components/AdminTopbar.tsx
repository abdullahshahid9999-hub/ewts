"use client";

import { useAdminAuth } from "@/lib/adminAuthClient";

export default function AdminTopbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="adp-tbar">
      <button
        onClick={onMenuToggle}
        className="mr-auto hidden max-[900px]:flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--a-border2)] bg-[var(--a-raised)] text-sm"
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <div className="adp-tbar-acct">
        <span>👤</span>
        <span>{admin?.email ?? "Admin"}</span>
      </div>
      <button onClick={logout} className="adp-tbar-out" title="Logout">⏻</button>
    </div>
  );
}
