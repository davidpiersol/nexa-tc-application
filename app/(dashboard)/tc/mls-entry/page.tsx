import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMlsEntryJobs } from "@/lib/queries/mls-entry-jobs";

export default async function MlsEntryJobsPage() {
  const jobs = await getMlsEntryJobs();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-neutral-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-brand-navy">MLS entry jobs</h2>
          <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
            Track MLS-only service requests separately from full TC-to-close transactions. MLS write
            submission remains manual until SWMLS/GAAR/FlexMLS write access is confirmed.
          </p>
        </div>
        <Button variant="gold" type="button" asChild>
          <Link href="/tc/mls-entry/new">New MLS entry</Link>
        </Button>
      </header>

      <section className="rounded-brand-lg border border-brand-gold/40 bg-brand-gold/10 p-4 font-sans text-sm text-brand-navy">
        <p className="font-semibold">Write-access spike status</p>
        <p className="mt-1 text-neutral-700">
          No MLS write integration is enabled. Use this queue to capture the data and billing status,
          then complete MLS entry in the authorized MLS portal.
        </p>
        <Link
          href="/tc/mls-entry/research"
          className="mt-2 inline-block underline underline-offset-2"
        >
          Research notes
        </Link>
      </section>

      <ul className="flex flex-col gap-3">
        {jobs.length === 0 ? (
          <li className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
            No MLS-only jobs yet.
          </li>
        ) : null}
        {jobs.map((job) => (
          <li
            key={job.id}
            className="rounded-brand-lg border border-neutral-300 bg-white shadow-brand-sm transition-colors hover:bg-neutral-50"
          >
            <Link
              href={`/tc/mls-entry/${job.id}`}
              className="flex flex-col gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-sans font-semibold text-brand-navy underline-offset-4 hover:underline">
                  {job.propertyAddress ?? "Property address TBD"}
                </p>
                <p className="mt-1 font-sans text-sm text-neutral-600">
                  {job.statusLabel} · Billing: {job.billingStatusLabel}
                  {job.mlsNumber ? ` · MLS #${job.mlsNumber}` : ""}
                </p>
                <p className="mt-1 font-sans text-xs text-neutral-600">
                  Requesting broker: {job.requestingBrokerName ?? "TBD"}
                  {job.listingBrokerName ? ` · Listing broker: ${job.listingBrokerName}` : ""}
                  {job.listingClientName ? ` · Client: ${job.listingClientName}` : ""}
                </p>
                {job.sellerNames ? (
                  <p className="mt-1 font-sans text-xs text-neutral-600">
                    Seller(s): {job.sellerNames}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 font-sans text-xs font-semibold text-neutral-700">
                MLS-only
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
