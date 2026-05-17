import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  formatTransactionNextLabel,
  formatTransactionStatusLabel,
  getBrokerAgentTransactionsList,
} from "@/lib/queries/tc-transactions-list";

export default async function BrokerDashboardHubPage() {
  const rows = await getBrokerAgentTransactionsList();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Broker workspace
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
          Assigned transactions
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-ui-body text-neutral-600">
          Files where you are listed as the broker contact or invited as an agent party. Open a row
          for status and client-visible documents only — TC internal notes stay in the coordinator
          workspace.
        </p>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-brand-lg border border-neutral-300 bg-white px-6 py-10 text-center shadow-brand-sm"
          role="status"
        >
          <p className="font-sans font-semibold text-brand-navy">No transactions yet</p>
          <p className="mt-2 max-w-md mx-auto font-sans text-ui-body text-neutral-600">
            When your coordinator assigns your broker contact on a file, it appears here
            automatically.
          </p>
        </div>
      ) : (
        <DataTable
          getRowId={(r) => r.id}
          columns={[
            {
              id: "address",
              header: "Property",
              cell: (r) => (
                <Link
                  href={`/agent/${r.id}`}
                  className="font-semibold text-brand-navy hover:underline"
                >
                  {r.property_address?.trim() || "Property address TBD"}
                </Link>
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (r) => (
                <Badge variant="gold" className="normal-case">
                  {formatTransactionStatusLabel(r.status)}
                </Badge>
              ),
            },
            {
              id: "next",
              header: "Closing",
              cell: (r) => (
                <span className="text-neutral-600">
                  {formatTransactionNextLabel(r.close_date)}
                </span>
              ),
            },
          ]}
          data={rows}
        />
      )}
    </div>
  );
}
