import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";

export default function TopupPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div>
            <h2>💳 <span>Topup</span></h2>
            <p>Add funds to your agent account</p>
          </div>
        </div>
        <div className="ap-card">
          <div className="ap-ch">
            <div>
              <h3>Account Topup</h3>
              <p>Submit a payment slip to add balance to your account</p>
            </div>
          </div>
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            To topup your account, please contact East &amp; West directly or submit a payment slip.
            <br /><br />
            📞 Contact your account manager for bank details.
          </div>
        </div>
      </AgentShell>
    </AgentGuard>
  );
}
