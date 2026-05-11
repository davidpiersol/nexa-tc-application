import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatTransactionStatusLabel, getTcTransactionsList } from "@/lib/queries/tc-transactions-list";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function TcTransactionsArchivePage({ searchParams }: Props) {
  const queryValue = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;
  const query = typeof queryValue === "string" ? queryValue.trim() : "";
  const rows = await getTcTransactionsList({
    query,
    archiveView: "archive",
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">Archived transactions</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Archived files stay closed and hidden from default transaction views.
        </p>
        <form method="get" className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex w-full flex-col gap-1.5 sm:max-w-xl">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Search archive
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Address, MLS, notes, intake, party, broker"
              className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/tc/archive">Clear</Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/tc/transactions">Back to active transactions</Link>
            </Button>
          </div>
        </form>
      </header>

      <ul className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <li className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
            No archived transactions match this view.
          </li>
        ) : null}
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-3 rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/tc/transactions/${row.id}`}
                className="font-sans font-semibold text-brand-navy underline underline-offset-2"
              >
                {row.property_address?.trim() || "Property address TBD"}
              </Link>
              <p className="mt-1 text-sm text-neutral-600">
                {formatTransactionStatusLabel(row.status)}
                {row.close_date ? ` · Closed ${row.close_date}` : ""}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Archived{" "}
                {row.archived_at ? new Date(row.archived_at).toLocaleDateString() : "recently"}
              </p>
            </div>
            <Button variant="secondary" type="button" size="sm" asChild>
              <Link href={`/tc/transactions/${row.id}`}>Open</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
