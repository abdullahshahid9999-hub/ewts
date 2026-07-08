"use client";

import { useEffect, useState } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
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
    if (!res.ok) { setPwError(data.error ?? "Could not change password."); return; }
    setPwSuccess("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>My <span>Profile</span></h2>
          <p>Account details &amp; security</p>
        </div>
      </div>

      {profile && (
        <div className="ap-card">
          <div className="ap-ch"><h3>Account Details</h3></div>
          <div style={{ padding: "16px 18px" }} className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-[var(--muted)]">Agent code</span><strong>{profile.agentCode}</strong></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Name</span><span>{profile.fullName}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Email</span><span>{profile.email}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Phone</span><span>{profile.phone ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Tier</span><span className="capitalize">{profile.tier}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Balance</span><span>PKR {profile.balance.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Credit limit</span><span>PKR {profile.creditLimit.toLocaleString()}</span></div>
          </div>
          <p style={{ padding: "0 18px 16px" }} className="text-xs text-[var(--muted)]">
            Balance, credit limit, and tier are set by the office and can&apos;t be changed here.
          </p>
        </div>
      )}

      <div className="ap-card">
        <div className="ap-ch"><h3>Change Password</h3></div>
        <form onSubmit={handlePasswordChange} style={{ padding: "16px 18px" }} className="space-y-3">
          <div className="ap-field">
            <label>Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="ap-field">
            <label>New Password</label>
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          {pwError && <p className="text-sm text-red-700">{pwError}</p>}
          {pwSuccess && <p className="text-sm" style={{ color: "var(--green)" }}>{pwSuccess}</p>}
          <button type="submit" disabled={submitting} className="ap-btn ap-btn-gold">
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </>
  );
}

export default function AgentProfilePage() {
  return (
    <AgentGuard>
      <AgentShell>
        <ProfileInner />
      </AgentShell>
    </AgentGuard>
  );
}
