import type { ReactNode } from "react";
import { HeroGraphic } from "@/components/graphics/HeroGraphic";
import { DocumentIcons } from "@/components/graphics/DocumentIcons";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/ui/document-card";
import { ProgressTimeline } from "@/components/ui/progress-timeline";
import type { BuyerDocFromMake } from "@/lib/data/figma-make";
import {
  buyerDocumentsFromMake,
  buyerImportantDatesFromMake,
  buyerTimelineFromMake,
} from "@/lib/data/figma-make";

type Props = { params: { id: string } };

const CATEGORY_LABEL: Record<BuyerDocFromMake["category"], string> = {
  contract: "Contract",
  disclosure: "Disclosure",
  inspection: "Inspection",
  loan: "Loan",
  title: "Title",
  photos: "Photos",
};

function statusVariant(
  status: BuyerDocFromMake["status"],
): React.ComponentProps<typeof DocumentCard>["statusVariant"] {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  return "danger";
}

/**
 * Figma Make **BuyerDashboard** → `/buyer/[id]` — hero, timeline, dates, documents.
 * TODO: buyer-scoped transaction + messaging + API-backed lists.
 */
export default function BuyerDashboardPage({ params }: Props) {
  const timelineSteps = buyerTimelineFromMake.map((s) => ({
    label: s.label,
    completed: s.completed,
    active: s.active,
  }));

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
        <div className="mt-6 rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm sm:p-6">
          <ProgressTimeline steps={timelineSteps} />
        </div>
      </section>

      <section aria-labelledby="buyer-dates">
        <h3 id="buyer-dates" className="font-display text-heading-md text-brand-navy">
          Important dates
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {buyerImportantDatesFromMake.map((d) => (
            <div
              key={`${d.month}-${d.day}-${d.event}`}
              className="rounded-brand-lg border border-neutral-300 bg-neutral-50 p-4 text-center shadow-brand-sm"
            >
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-navy">
                {d.month}
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-navy">{d.day}</p>
              <p className="mt-2 font-sans text-sm text-neutral-600">{d.event}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="buyer-docs">
        <h3 id="buyer-docs" className="font-display text-heading-md text-brand-navy">
          Documents
        </h3>
        <div className="mt-4 flex flex-wrap gap-4">
          {buyerDocumentsFromMake.map((doc) => {
            const Icon = DocumentIcons[doc.category];
            return (
              <DocumentCard
                key={doc.filename}
                category={CATEGORY_LABEL[doc.category]}
                fileName={doc.filename}
                statusVariant={statusVariant(doc.status)}
                statusLabel={doc.status}
                dateLabel={doc.date}
                thumbnail={<Icon size={56} />}
              />
            );
          })}
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
