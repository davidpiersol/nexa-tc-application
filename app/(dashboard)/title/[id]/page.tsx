import { notFound } from "next/navigation";
import { ChecklistPanel } from "@/components/ui/checklist-panel";
import { getClientPartyTransactionOverview } from "@/lib/queries/client-party-overview";
import {
  formatTransactionNextLabel,
  formatTransactionStatusLabel,
} from "@/lib/queries/tc-transactions-list";

type Props = { params: { id: string } };

/**
 * Title partner workspace — checklist is illustrative until title ops wiring lands.
 */
export default async function TitleDashboardPage({ params }: Props) {
  const overview = await getClientPartyTransactionOverview(params.id);
  if (!overview) notFound();

  const items = [
    { id: "t1", label: "Preliminary report issued", checked: true },
    { id: "t2", label: "Payoff ordered", checked: true },
    { id: "t3", label: "Survey receipt", checked: false },
    { id: "t4", label: "Wire instructions verified", checked: false },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Title partner workspace
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
          Closing preparation
        </h2>
        <p className="mt-2 font-prose text-prose-body text-neutral-900">
          {overview.property_address?.trim() ||
            "Your coordinator shares property details when ready."}{" "}
          Status:{" "}
          <span className="font-semibold text-brand-navy">
            {formatTransactionStatusLabel(overview.status)}
          </span>
          {overview.close_date ? (
            <>
              {" "}
              · Scheduled close {formatTransactionNextLabel(overview.close_date)}
            </>
          ) : null}
        </p>
        <p className="mt-2 font-sans text-sm text-neutral-600">
          Track curative items through funding. TC-only notes never appear here. Documents and messaging
          routes will appear here when enabled for title partners.
        </p>
      </header>

      <ChecklistPanel title="Title checklist (sample)" items={items} />
    </div>
  );
}
