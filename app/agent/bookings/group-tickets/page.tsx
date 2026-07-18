import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentBookingsByType from "@/components/AgentBookingsByType";

export default function Page() {
  return (
    <AgentGuard>
      <AgentShell>
        <AgentBookingsByType
          category="group_ticket"
          title={<>Group <span>Tickets</span></>}
          subtitle="Your group flight bookings"
          detailLabel="Flight"
        />
      </AgentShell>
    </AgentGuard>
  );
}
