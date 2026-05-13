import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MlsWriteAccessResearchPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-neutral-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-brand-navy">
            MLS write-access spike
          </h2>
          <p className="mt-1 font-sans text-ui-body text-neutral-600">
            P23 intentionally keeps MLS-only work manual until SWMLS, GAAR, and the MLS vendor
            confirm authorized write access.
          </p>
        </div>
        <Button variant="secondary" type="button" asChild>
          <Link href="/tc/mls-entry">Back to MLS entry</Link>
        </Button>
      </header>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 font-sans text-sm text-neutral-700 shadow-brand-sm">
        <h3 className="font-display text-heading-sm text-brand-navy">Current decision</h3>
        <p className="mt-2">
          Do not implement MLS write submission yet. Choral Point can capture the MLS-only job,
          track status, and support billing, but final listing entry remains in the authorized MLS
          portal.
        </p>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 font-sans text-sm text-neutral-700 shadow-brand-sm">
        <h3 className="font-display text-heading-sm text-brand-navy">Access questions</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Does SWMLS/GAAR allow create or update listing access through RESO Web API?</li>
          <li>Is write access provided directly by SWMLS/GAAR or through FlexMLS?</li>
          <li>What broker, MLS membership, certification, and audit requirements apply?</li>
          <li>Are there sandbox credentials for listing submission testing?</li>
          <li>Which listing fields, media rules, disclosures, and validation errors must be supported?</li>
        </ul>
      </section>

      <section className="rounded-brand-lg border border-brand-gold/40 bg-brand-gold/10 p-5 font-sans text-sm text-brand-navy">
        <h3 className="font-display text-heading-sm">Implementation guardrail</h3>
        <p className="mt-2 text-neutral-700">
          If write access is confirmed later, build it as a separate integration sprint with
          credential storage, field validation, sandbox tests, audit events, and rollback-safe
          manual fallback.
        </p>
      </section>
    </div>
  );
}
