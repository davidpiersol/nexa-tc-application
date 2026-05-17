import Link from "next/link";
import { Target } from "lucide-react";
import type { ScorecardSummary } from "@/lib/operations/scorecard";

export function ScorecardSummaryCard({ scorecard }: { scorecard: ScorecardSummary }) {
  return (
    <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Scorecard
          </p>
          <h2 className="mt-1 font-display text-heading-md text-brand-navy">
            {scorecard.configured ? `${scorecard.percent}% complete` : "Setup blocked"}
          </h2>
        </div>
        <Target className="size-5 text-brand-gold" aria-hidden />
      </div>
      <p className="mt-3 font-sans text-sm text-neutral-600">
        {scorecard.configured
          ? `${scorecard.completed} of ${scorecard.total} scorecard items completed.`
          : scorecard.blocker}
      </p>
      <div className="mt-4 h-2 rounded-full bg-neutral-200" aria-hidden>
        <div
          className="h-2 rounded-full bg-brand-gold"
          style={{ width: `${scorecard.percent}%` }}
        />
      </div>
      <Link
        href="/tc/scorecard"
        className="mt-4 inline-flex font-sans text-sm font-semibold text-brand-navy underline underline-offset-2"
      >
        Open scorecard
      </Link>
    </section>
  );
}
