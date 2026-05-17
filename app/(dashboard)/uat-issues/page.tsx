import { notFound } from "next/navigation";
import { UatIssueForm } from "@/components/uat/uat-issue-form";
import { uatIssuesEnabled } from "@/lib/uat/issues";

export default function UatIssuesPage() {
  if (!uatIssuesEnabled()) notFound();
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h2 className="font-display text-heading-lg text-brand-navy">UAT issues</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          During user acceptance testing, use this form to report bugs or suggest improvements while the detail is still fresh.
        </p>
      </div>
      <UatIssueForm />
    </section>
  );
}
