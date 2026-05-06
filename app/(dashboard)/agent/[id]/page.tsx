import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  formatTransactionNextLabel,
  formatTransactionStatusLabel,
  getAgentTransactionsList,
} from "@/lib/queries/tc-transactions-list";

type Props = { params: { id: string } };

/**
 * Figma: **Agent Dashboard/Default** → `/agent/[id]`
 * `params.id` is the workspace anchor from role-redirect (often a transaction id); rows are RLS-scoped.
 */
export default async function AgentDashboardPage({ params }: Props) {
  const rows = await getAgentTransactionsList();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Agent workspace ·{" "}
          <Link
            href={`/tc/transactions/${params.id}`}
            className="text-brand-navy underline-offset-2 hover:underline"
          >
            {params.id}
          </Link>
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
          Your transactions
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-ui-body text-neutral-600">
          Track documents and milestones for every party you represent. Open a row for the TC
          transaction workspace.
        </p>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-brand-lg border border-neutral-300 bg-white px-6 py-10 text-center shadow-brand-sm"
          role="status"
        >
          <p className="font-sans font-semibold text-brand-navy">No transactions yet</p>
          <p className="mt-2 max-w-md mx-auto font-sans text-ui-body text-neutral-600">
            When your transaction coordinator adds you to a file in this workspace, it will show up
            here.
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
                  href={`/tc/transactions/${r.id}`}
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
              header: "Next milestone",
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
