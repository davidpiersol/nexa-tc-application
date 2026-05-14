import { CommunicationIntegrationPlan } from "@/components/tc/communication-integration-plan";
import { ScorecardSummaryCard } from "@/components/tc/scorecard-summary-card";
import { buildScorecardPlaceholder } from "@/lib/operations/scorecard";

export default function TcScorecardPage() {
  const scorecard = buildScorecardPlaceholder();

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          P27 operations
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">Scorecard</h2>
        <p className="mt-2 max-w-3xl font-sans text-ui-body text-neutral-600">
          This page is the safe placeholder for daily and weekly business-growth scorecards.
          The detailed rules are blocked until the team provides the final Coldwell Banker/team
          scorecard definitions.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <ScorecardSummaryCard scorecard={scorecard} />
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Placeholder metrics
          </p>
          <h3 className="mt-1 font-display text-heading-md text-brand-navy">
            Awaiting final rules
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {scorecard.metrics.map((metric) => (
              <li
                key={metric.id}
                className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3"
              >
                <p className="font-sans text-sm font-semibold text-brand-navy">
                  {metric.label}
                </p>
                <p className="mt-1 font-sans text-sm text-neutral-600">
                  {metric.cadence} · target {metric.target} {metric.unit}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CommunicationIntegrationPlan />
    </div>
  );
}
