import { BillingInvoiceForm } from "@/components/tc/billing-invoice-form";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";

export default async function TcBillingPage() {
  const data = await getBillingDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <h2 className="font-display text-heading-lg text-brand-navy">Billing</h2>
        <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
          Track invoice drafts and accounts receivable for full TC transactions, MLS-only jobs, and
          custom work. Accounting sync is scaffolded but not connected to QuickBooks, Profit Power,
          taxes, or payment processors yet.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="Billing summaries">
        <SummaryCard title="Monthly" summary={data.monthly[0]} />
        <SummaryCard title="Quarterly" summary={data.quarterly[0]} />
        <SummaryCard title="Yearly" summary={data.yearly[0]} />
      </section>

      <BillingInvoiceForm
        serviceTypes={data.serviceTypes}
        transactions={data.transactions}
        mlsJobs={data.mlsJobs}
      />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-display text-heading-sm text-brand-navy">Invoices</h3>
          <p className="font-sans text-sm text-neutral-600">
            Accounts receivable status is internal until an accounting provider is explicitly wired.
          </p>
        </div>
        {data.invoices.length === 0 ? (
          <div className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
            No invoices yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-sans font-semibold text-brand-navy">
                      {invoice.invoiceNumber ?? "Draft invoice"} · {invoice.totalLabel}
                    </p>
                    <p className="mt-1 font-sans text-sm text-neutral-600">
                      {invoice.brokerName ?? "Broker TBD"} · {invoice.statusLabel} · AR:{" "}
                      {invoice.receivableStatusLabel}
                    </p>
                    <p className="mt-1 font-sans text-xs text-neutral-600">
                      {invoice.sourceLabel} · Issue {invoice.issueDate}
                      {invoice.dueDate ? ` · Due ${invoice.dueDate}` : ""} · Balance{" "}
                      {invoice.balanceLabel}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-sans text-xs font-semibold text-neutral-700">
                    Sync: {invoice.accountingSyncStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-brand-lg border border-brand-gold/40 bg-brand-gold/10 p-5 font-sans text-sm text-brand-navy">
        <h3 className="font-display text-heading-sm">Accounting integration path</h3>
        <p className="mt-2 text-neutral-700">
          P24 only records invoice and receivable data. QuickBooks, Profit Power, payment services,
          and tax filing require separate approval, credentials, provider terms, and sandbox testing.
        </p>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  summary,
}: {
  title: string;
  summary?: { period: string; invoiceCount: number; totalLabel: string; balanceLabel: string };
}) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{title}</p>
      <p className="mt-2 font-display text-heading-md text-brand-navy">
        {summary?.totalLabel ?? "$0.00"}
      </p>
      <p className="mt-1 font-sans text-sm text-neutral-600">
        {summary ? `${summary.invoiceCount} invoice(s), ${summary.balanceLabel} open` : "No invoices"}
      </p>
    </div>
  );
}
