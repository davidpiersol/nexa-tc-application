import { TimelineBar } from "@/components/ui/timeline-bar";
import { Button } from "@/components/ui/button";
import { buyerTimelinePlaceholder } from "@/lib/data/screen-placeholders";

type Props = { params: { id: string } };

/**
 * Figma: **Seller Dashboard/Default** → `/seller/[id]`
 * TODO: seller-scoped listing + offers.
 */
export default function SellerDashboardPage({ params }: Props) {
  const steps = buyerTimelinePlaceholder;

  return (
    <div className="flex flex-col gap-10">
      <header className="rounded-brand-lg border border-neutral-300 bg-white p-6 shadow-brand-sm sm:p-8">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Seller · {params.id}
        </p>
        <h2 className="mt-2 font-display text-heading-xl text-brand-navy">Your sale</h2>
        <p className="mt-3 max-w-2xl font-prose text-prose-body text-neutral-900">
          {/* TODO: listing address */}
          Track buyer milestones, signatures, and closing prep in one place.
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
        <div className="mt-4 overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white p-4 sm:p-6">
          <TimelineBar steps={steps} />
        </div>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-neutral-50 p-6">
        <h3 className="font-display text-heading-md text-brand-navy">Important dates</h3>
        <ul className="mt-4 flex flex-col gap-2 font-sans text-ui-body text-neutral-900">
          {/* TODO: calendar integration */}
          <li className="flex justify-between border-b border-neutral-200 py-2">
            <span className="text-brand-brown">Inspection window</span>
            <span className="text-neutral-600">Apr 12–15</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-brand-brown">Closing date</span>
            <span className="text-neutral-600">Jun 14</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
