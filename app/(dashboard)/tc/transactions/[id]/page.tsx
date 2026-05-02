import Link from "next/link";
import { Button } from "@/components/ui/button";
import { transactionDetailPlaceholder } from "@/lib/data/screen-placeholders";

type Props = { params: { id: string } };

/**
 * Figma: **Transaction Detail/Default** → `/tc/transactions/[id]`
 * TODO: load transaction, parties, milestones from `/api/transactions/:id`.
 */
export default function TransactionDetailPage({ params }: Props) {
  const t = transactionDetailPlaceholder(params.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-neutral-300 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            {/* TODO: MLS / internal ref */}
            Transaction · {t.id}
          </p>
          <h2 className="mt-2 font-display text-heading-lg text-brand-navy">{t.address}</h2>
          <p className="mt-2 font-sans text-ui-body text-neutral-600">
            {/* TODO: status pill from server */}
            Milestone · <span className="text-brand-brown">{t.milestone}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" asChild>
            <Link href={`/tc/transactions/${params.id}/documents`}>Documents</Link>
          </Button>
          <Button variant="gold" type="button" asChild>
            <Link href={`/tc/transactions/${params.id}/first-pass`}>First Pass</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Parties</h3>
          <ul className="mt-4 flex flex-col gap-2 font-sans text-ui-body text-neutral-900">
            {t.parties.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {/* TODO: linked contacts + roles from DB */}
        </section>
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Activity</h3>
          <p className="mt-4 font-prose text-prose-body text-neutral-900">
            {/* TODO: timeline feed */}
            Recent messages and system events will render here.
          </p>
        </section>
      </div>

      <section className="rounded-brand-lg border border-dashed border-neutral-300 bg-neutral-50 p-6">
        <h3 className="font-display text-heading-md text-brand-navy">Two-panel workspace</h3>
        <p className="mt-2 font-sans text-sm text-neutral-600">
          {/* TODO: embed checklist + doc preview per Figma */}
          Reserve for split checklist / preview panes.
        </p>
      </section>
    </div>
  );
}
