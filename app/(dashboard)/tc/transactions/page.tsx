import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getTcTransactionsList,
  formatTransactionStatusLabel,
} from "@/lib/queries/tc-transactions-list";
import {
  parseTcTransactionListFilter,
  tcTransactionListFilterTitle,
} from "@/lib/tc-transaction-list-filter";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

/**
 * Transaction index — real tenant rows from Supabase; optional KPI filters via `?filter=`.
 */
export default async function TcTransactionsIndexPage({ searchParams }: Props) {
  const filter = parseTcTransactionListFilter(searchParams?.filter);
  const rows = await getTcTransactionsList(filter);
  const filterTitle = tcTransactionListFilterTitle(filter);

  const representationLabel = (value: string | null): string => {
    if (!value) return "Not set";
    if (value === "seller_listing_broker") return "Seller / Listing broker";
    if (value === "buyer_broker") return "Buyer broker";
    if (value === "both") return "Both sides";
    return value.replace(/_/g, " ");
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-heading-lg text-brand-navy">All transactions</h2>
            <p className="mt-2 font-sans text-ui-body text-neutral-600">
              Open a file for documents, First Pass, and parties (same scope as the dashboard
              KPIs).
            </p>
          </div>
          <Button variant="gold" type="button" asChild>
            <Link href="/tc/transactions/new">Add transaction</Link>
          </Button>
        </div>
        {filterTitle ? (
          <p className="mt-3 rounded-brand-md border border-brand-gold/40 bg-brand-gold/10 px-4 py-2 font-sans text-sm text-brand-navy">
            Showing: <span className="font-semibold">{filterTitle}</span>
            {" · "}
            <Link href="/tc/transactions" className="underline underline-offset-2">
              Clear filter
            </Link>
          </p>
        ) : null}
      </header>
      <ul className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <li className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
            No transactions match this view.
          </li>
        ) : null}
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/tc/transactions/${r.id}`}
                className="font-sans font-semibold text-brand-navy underline underline-offset-2"
              >
                {r.property_address?.trim() || "Property address TBD"}
              </Link>
              <p className="mt-1 text-sm text-neutral-600">
                {formatTransactionStatusLabel(r.status)}
                {r.mls_number ? (
                  <>
                    {" "}
                    · MLS #{r.mls_number}
                  </>
                ) : null}
              </p>
              {r.legal_description ? (
                <p className="mt-1 text-xs text-neutral-600">Legal: {r.legal_description}</p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-600">
                TC rep: {representationLabel(r.representation_side)}
                {r.seller_broker_name ? ` · Seller broker: ${r.seller_broker_name}` : ""}
                {r.buyer_broker_name ? ` · Buyer broker: ${r.buyer_broker_name}` : ""}
              </p>
            </div>
            <Button variant="secondary" type="button" size="sm" asChild>
              <Link href={`/tc/transactions/${r.id}`}>Open</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
