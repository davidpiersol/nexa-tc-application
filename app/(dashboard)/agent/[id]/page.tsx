import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  formatTransactionNextLabel,
  formatTransactionStatusLabel,
  getBrokerScopedTransaction,
} from "@/lib/queries/tc-transactions-list";
import { listBrokerVisibleDocuments } from "@/lib/queries/broker-dashboard";
import { documentStatusToBadge } from "@/lib/ui/map-document-status";

type Props = { params: { id: string } };

/**
 * Broker workspace for one transaction — client-visible documents only (RLS).
 */
export default async function BrokerTransactionWorkspacePage({ params }: Props) {
  const tx = await getBrokerScopedTransaction(params.id);
  if (!tx) notFound();

  const docs = await listBrokerVisibleDocuments(params.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Broker file ·{" "}
            <span className="font-mono text-xs text-brand-navy">{params.id}</span>
          </p>
          <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
            {tx.property_address?.trim() || "Property address TBD"}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="gold" className="normal-case">
              {formatTransactionStatusLabel(tx.status)}
            </Badge>
            <span className="font-sans text-sm text-neutral-600">
              Closing · {formatTransactionNextLabel(tx.close_date)}
            </span>
          </div>
          <p className="mt-3 max-w-2xl font-sans text-sm text-neutral-600">
            Document list shows client-visible uploads only. Message TC through your coordinator —
            internal TC threads are not shown here.
          </p>
        </div>
        <Button variant="secondary" size="sm" type="button" asChild>
          <Link href="/agent">All assignments</Link>
        </Button>
      </div>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">Client-visible documents</h3>
        <p className="mt-1 font-sans text-sm text-neutral-600">
          Status reflects coordinator workflow (including signatures requested).
        </p>
        {docs.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-neutral-600">No visible documents yet.</p>
        ) : (
          <div className="mt-4">
            <DataTable
              getRowId={(r) => r.id}
              columns={[
                {
                  id: "file",
                  header: "File",
                  cell: (r) => (
                    <span className="font-medium text-brand-navy">{r.file_name ?? "Document"}</span>
                  ),
                },
                {
                  id: "category",
                  header: "Category",
                  cell: (r) => <span className="text-neutral-700">{r.category}</span>,
                },
                {
                  id: "status",
                  header: "Status",
                  cell: (r) => {
                    const b = documentStatusToBadge(r.status);
                    return (
                      <Badge variant={b.variant === "gold" ? "gold" : "neutral"}>{b.label}</Badge>
                    );
                  },
                },
                {
                  id: "created",
                  header: "Uploaded",
                  cell: (r) => (
                    <span className="text-neutral-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  ),
                },
              ]}
              data={docs}
            />
          </div>
        )}
      </section>
    </div>
  );
}
