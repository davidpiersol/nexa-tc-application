import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Transaction index (supports navigation from TC sidebar).
 * TODO: paginated list from `/api/transactions`.
 */
export default function TcTransactionsIndexPage() {
  /* TODO: GET /api/transactions */
  const rows = [
    { id: "txn_demo_1", address: "4821 Maple Ridge Dr, Austin", phase: "Under contract" },
    { id: "txn_demo_2", address: "910 Pearl St, Boulder", phase: "Active listing" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-heading-lg text-brand-navy">All transactions</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          {/* TODO: filters */}
          Placeholder list — click through to detail routes.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-sans font-semibold text-brand-navy">{r.address}</p>
              <p className="mt-1 text-sm text-neutral-600">{r.phase}</p>
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
