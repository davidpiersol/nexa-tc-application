import { BillingPrintButton } from "@/components/tc/billing-print-button";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";

export default async function BillingPrintPage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const ids = new Set(
    String(searchParams.ids ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
  const data = await getBillingDashboardData();
  const invoices = data.invoices.filter((invoice) => ids.has(invoice.id));

  return (
    <div className="flex flex-col gap-6 bg-white text-brand-navy print:p-0">
      <header className="flex items-center justify-between border-b border-neutral-300 pb-4 print:hidden">
        <div>
          <h2 className="font-display text-heading-lg">Print invoices</h2>
          <p className="font-sans text-sm text-neutral-600">
            Review the selected invoices, then use your browser print dialog.
          </p>
        </div>
        <BillingPrintButton />
      </header>

      {invoices.length === 0 ? (
        <p className="font-sans text-sm text-neutral-600">No selected invoices were found.</p>
      ) : (
        invoices.map((invoice) => (
          <article
            key={invoice.id}
            className="break-after-page rounded-brand-lg border border-neutral-300 p-6 print:rounded-none print:border-neutral-300"
          >
            <div className="flex justify-between gap-6">
              <div>
                <h3 className="font-display text-heading-md">
                  {invoice.invoiceNumber ?? "Draft invoice"}
                </h3>
                <p className="mt-1 font-sans text-sm text-neutral-700">
                  {invoice.brokerName ?? "Broker TBD"}
                </p>
              </div>
              <div className="text-right font-sans text-sm text-neutral-700">
                <p>Issue {invoice.issueDate}</p>
                <p>Due {invoice.dueDate ?? invoice.issueDate}</p>
                <p>Payable upon receipt</p>
              </div>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 font-sans text-sm">
              <div>
                <dt className="text-neutral-600">Source</dt>
                <dd>{invoice.sourceLabel}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Status</dt>
                <dd>
                  {invoice.statusLabel} · {invoice.receivableStatusLabel}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-600">Tax</dt>
                <dd>{invoice.taxLabel}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Total</dt>
                <dd className="font-semibold">{invoice.totalLabel}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Balance due</dt>
                <dd className="font-semibold">{invoice.balanceLabel}</dd>
              </div>
            </dl>
          </article>
        ))
      )}
    </div>
  );
}
