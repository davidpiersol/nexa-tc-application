import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

type Props = { params: { id: string } };

/**
 * Figma: **Agent Dashboard/Default** → `/agent/[id]`
 * TODO: scoped transactions for agent id from RLS.
 */
export default function AgentDashboardPage({ params }: Props) {
  /* TODO: GET /api/agent/:id/dashboard */
  const rows = [
    { id: "1", address: "4821 Maple Ridge Dr", status: "Under contract", next: "Apr 20" },
    { id: "2", address: "910 Pearl St", status: "Active listing", next: "Apr 22" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          {/* TODO: agent profile */}
          Agent workspace · {params.id}
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
          Your transactions
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-ui-body text-neutral-600">
          {/* TODO: personalized subtitle */}
          Track documents and milestones for every party you represent.
        </p>
      </div>

      <DataTable
        getRowId={(r) => r.id}
        columns={[
          {
            id: "address",
            header: "Property",
            cell: (r) => r.address,
          },
          {
            id: "status",
            header: "Status",
            cell: (r) => (
              <Badge variant="gold" className="normal-case">
                {r.status}
              </Badge>
            ),
          },
          {
            id: "next",
            header: "Next milestone",
            cell: (r) => <span className="text-neutral-600">{r.next}</span>,
          },
        ]}
        data={rows}
      />
    </div>
  );
}
