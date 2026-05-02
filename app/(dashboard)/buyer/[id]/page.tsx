import type { ReactNode } from "react";
import { HeroGraphic } from "@/components/graphics/HeroGraphic";
import { Button } from "@/components/ui/button";
import { TimelineBar } from "@/components/ui/timeline-bar";
import { buyerTimelinePlaceholder } from "@/lib/data/screen-placeholders";

type Props = { params: { id: string } };

/**
 * Figma: **Buyer Dashboard/Default** → `/buyer/[id]`
 * TODO: buyer-scoped transaction + messaging.
 */
export default function BuyerDashboardPage({ params }: Props) {
  const steps = buyerTimelinePlaceholder;

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-brand-lg border border-neutral-300 bg-neutral-50 shadow-brand-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
              {/* TODO: transaction ref */}
              Buyer · {params.id}
            </p>
            <h2 className="font-display text-heading-xl text-brand-navy">
              Your home purchase
            </h2>
            <p className="font-prose text-prose-body text-neutral-900">
              {/* TODO: property address */}
              4821 Maple Ridge Dr — we’ll guide you through each step in plain English.
            </p>
            <div className="flex flex-wrap gap-2">
              <BadgePill>Under contract</BadgePill>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Gold reserved for primary CTA */}
              <Button variant="gold" type="button">
                View documents
              </Button>
              <Button variant="secondary" type="button">
                Message TC
              </Button>
            </div>
          </div>
          <div className="relative min-h-[220px] lg:min-h-[320px]">
            <HeroGraphic className="h-full w-full [&_svg]:h-full [&_svg]:w-full" />
          </div>
        </div>
      </section>

      <section aria-labelledby="buyer-progress">
        <h3 id="buyer-progress" className="font-display text-heading-md text-brand-navy">
          Your progress
        </h3>
        <div className="mt-6 overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm sm:p-6">
          <TimelineBar steps={steps} />
        </div>
      </section>

      <section className="rounded-brand-lg border-l-4 border-brand-gold bg-brand-brown-pale p-6 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">Action needed</h3>
        <p className="mt-2 font-sans text-ui-body text-neutral-900">
          {/* TODO: dynamic tasks */}
          Review the seller disclosure package and acknowledge receipt.
        </p>
        <div className="mt-4">
          <Button variant="gold" type="button">
            Open disclosure
          </Button>
        </div>
      </section>
    </div>
  );
}

function BadgePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-brand-gold px-4 py-1.5 font-sans text-sm font-semibold text-brand-navy">
      {children}
    </span>
  );
}
