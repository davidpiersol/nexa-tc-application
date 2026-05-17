import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMlsEntryJobDetail } from "@/lib/queries/mls-entry-jobs";

export default async function MlsEntryJobDetailPage({ params }: { params: { id: string } }) {
  const job = await getMlsEntryJobDetail(params.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
              MLS-only job
            </p>
            <h2 className="mt-1 font-display text-heading-lg text-brand-navy">
              {job.propertyAddress ?? "Property address TBD"}
            </h2>
            <p className="mt-1 font-sans text-ui-body text-neutral-600">
              {job.statusLabel} · Billing: {job.billingStatusLabel}
              {job.mlsNumber ? ` · MLS #${job.mlsNumber}` : ""}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/tc/mls-entry">Back to MLS entry</Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Metric label="Property type" value={job.propertyType ?? "TBD"} />
        <Metric label="List price" value={job.listPrice ? formatCurrency(job.listPrice) : "TBD"} />
        <Metric label="Parcel" value={job.parcelNumber ?? "TBD"} />
        <Metric label="Acreage" value={job.acreage ?? "TBD"} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <InfoCard title="Requesting broker" body={job.requestingBrokerName ?? "TBD"} />
        <InfoCard title="Listing broker" body={job.listingBrokerName ?? "TBD"} />
        <InfoCard title="Listing client" body={job.listingClientName ?? "TBD"} />
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-sm text-brand-navy">Property details</h3>
        <dl className="mt-4 grid grid-cols-1 gap-4 font-sans text-sm lg:grid-cols-2">
          <Detail label="Seller(s)" value={job.sellerNames ?? "TBD"} />
          <Detail label="Created" value={job.createdAt.slice(0, 10)} />
          <Detail label="Updated" value={job.updatedAt.slice(0, 10)} />
          <Detail label="Legal description" value={job.propertyLegalDescription ?? "TBD"} wide />
        </dl>
      </section>

      {job.generalNotes ? (
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 font-sans text-sm text-neutral-700 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Notes</h3>
          <p className="mt-2 whitespace-pre-wrap">{job.generalNotes}</p>
        </section>
      ) : null}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(value);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{label}</p>
      <p className="mt-2 font-display text-heading-sm text-brand-navy">{value}</p>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{title}</p>
      <p className="mt-2 font-sans text-sm text-neutral-700">{body}</p>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "lg:col-span-2" : undefined}>
      <dt className="font-semibold text-neutral-600">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-brand-navy">{value}</dd>
    </div>
  );
}
