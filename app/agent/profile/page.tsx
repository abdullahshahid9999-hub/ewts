"use client";

import { useEffect, useState } from "react";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Profile = {
  agentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  tier: string;
  balance: number;
  creditLimit: number;
};

function ProfileInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    agentFetch("/api/agent/profile", accessToken, refresh).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setProfile(data.agent);
      }
    });
  }, [accessToken, refresh]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    setSubmitting(true);
    const res = await agentFetch("/api/agent/profile", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setPwError(data.error ?? "Could not change password.");
      return;
    }
    setPwSuccess("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Profile</h1>

      {profile && (
        <div className="mt-6 rounded-2xl border border-[var(--bdr)] bg-white p-6 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Agent code</dt><dd>{profile.agentCode}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Name</dt><dd>{profile.fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Email</dt><dd>{profile.email}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Phone</dt><dd>{profile.phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Tier</dt><dd className="capitalize">{profile.tier}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Balance</dt><dd>PKR {profile.balance.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Credit limit</dt><dd>PKR {profile.creditLimit.toLocaleString()}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Balance, credit limit, and tier are set by the office and can't be changed here.
          </p>
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="mt-6 space-y-4 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <h2 className="font-display text-lg text-[var(--navy)]">Change Password</h2>
        <input
          type="password"
          required
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        />
        {pwError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</p>}
        {pwSuccess && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{pwSuccess}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[var(--navy)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function AgentProfilePage() {
  return (
    <AgentGuard>
      <ProfileInner />
    </AgentGuard>
  );
}
