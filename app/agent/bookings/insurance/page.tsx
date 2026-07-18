import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentBookingsByType from "@/components/AgentBookingsByType";

export default function Page() {
  return (
    <AgentGuard>
      <AgentShell>
        <AgentBookingsByType
          category="insurance"
          title={<>Insurance <span>Bookings</span></>}
          subtitle="Your travel insurance bookings"
          detailLabel="Plan"
        />
      </AgentShell>
    </AgentGuard>
  );
}
