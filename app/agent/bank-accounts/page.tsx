import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";

export default function BankAccountsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <div className="ap-ph">
          <div>
            <h2>🏦 Bank <span>Accounts</span></h2>
            <p>East &amp; West bank account details for payments</p>
          </div>
        </div>
        <div className="ap-card">
          <div className="ap-ch">
            <div>
              <h3>Payment Details</h3>
              <p>Use these accounts to deposit funds and topup your balance</p>
            </div>
          </div>
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Bank account details will be listed here.
            <br /><br />
            Please contact East &amp; West to get the latest payment details.
          </div>
        </div>
      </AgentShell>
    </AgentGuard>
  );
}
