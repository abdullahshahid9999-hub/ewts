import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentBookingsByType from "@/components/AgentBookingsByType";

export default function Page() {
  return (
    <AgentGuard>
      <AgentShell>
        <AgentBookingsByType
          category="umrah"
          title={<>Umrah <span>Bookings</span></>}
          subtitle="Your Umrah package bookings"
          detailLabel="Package"
        />
      </AgentShell>
    </AgentGuard>
  );
}
