import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TimelineBar } from "@/components/ui/timeline-bar";
import { buyerTimelinePlaceholder } from "@/lib/data/screen-placeholders";
import { getClientPartyTransactionOverview } from "@/lib/queries/client-party-overview";
import {
  formatTransactionNextLabel,
  formatTransactionStatusLabel,
} from "@/lib/queries/tc-transactions-list";

type Props = { params: { id: string } };

export default async function SellerDashboardPage({ params }: Props) {
  const overview = await getClientPartyTransactionOverview(params.id);
  if (!overview) notFound();

  const steps = buyerTimelinePlaceholder;

  return (
    <div className="flex flex-col gap-10">
      <header className="rounded-brand-lg border border-neutral-300 bg-white p-6 shadow-brand-sm sm:p-8">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Seller workspace
        </p>
        <h2 className="mt-2 font-display text-heading-xl text-brand-navy">Your sale</h2>
        <p className="mt-3 max-w-2xl font-prose text-prose-body text-neutral-900">
          {overview.property_address?.trim() ||
            "Your coordinator will share the listing address when ready."}{" "}
          Status:{" "}
          <span className="font-semibold text-brand-navy">
            {formatTransactionStatusLabel(overview.status)}
          </span>
          {overview.close_date ? (
            <>
              {" "}
              · Target close {formatTransactionNextLabel(overview.close_date)}
            </>
          ) : null}
        </p>
        <p className="mt-3 font-sans text-sm text-neutral-600">
          Illustrative actions below — real uploads follow coordinator assignments. TC-only notes are
          never shown on this dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="gold" type="button">
            Upload disclosure
          </Button>
          <Button variant="secondary" type="button">
            View offer
          </Button>
        </div>
      </header>

      <section>
        <h3 className="font-display text-heading-md text-brand-navy">Sale progress</h3>
        <p className="mt-2 font-sans text-xs text-neutral-500">
          Sample timeline — live milestones arrive with coordinator workflow wiring.
        </p>
        <div className="mt-4 overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white p-4 sm:p-6">
          <TimelineBar steps={steps} />
        </div>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-neutral-50 p-6">
        <h3 className="font-display text-heading-md text-brand-navy">Important dates</h3>
        <ul className="mt-4 flex flex-col gap-2 font-sans text-ui-body text-neutral-900">
          <li className="flex justify-between border-b border-neutral-200 py-2">
            <span className="text-brand-brown">Inspection window</span>
            <span className="text-neutral-600">See coordinator calendar</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-brand-brown">Closing date</span>
            <span className="text-neutral-600">
              {overview.close_date
                ? formatTransactionNextLabel(overview.close_date)
                : "TBD"}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
