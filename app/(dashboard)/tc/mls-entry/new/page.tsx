import Link from "next/link";
import { MlsEntryJobForm } from "@/components/tc/mls-entry-job-form";
import { Button } from "@/components/ui/button";

export default function NewMlsEntryJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-neutral-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-brand-navy">New MLS entry job</h2>
          <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
            Capture listing-entry data for a broker request without opening a full buyer/seller TC
            transaction.
          </p>
        </div>
        <Button variant="secondary" type="button" asChild>
          <Link href="/tc/mls-entry">Back to MLS entry</Link>
        </Button>
      </header>
      <MlsEntryJobForm />
    </div>
  );
}
