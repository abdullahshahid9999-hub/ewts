import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentBookingsByType from "@/components/AgentBookingsByType";

export default function Page() {
  return (
    <AgentGuard>
      <AgentShell>
        <AgentBookingsByType
          category="world_tour"
          title={<>World <span>Tour Bookings</span></>}
          subtitle="Your world tour package bookings"
          detailLabel="Package"
        />
      </AgentShell>
    </AgentGuard>
  );
}
