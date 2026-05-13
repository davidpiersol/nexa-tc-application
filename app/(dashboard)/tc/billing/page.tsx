import { BillingInvoiceForm } from "@/components/tc/billing-invoice-form";
import { BillingInvoiceListClient } from "@/components/tc/billing-invoice-list-client";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";
import { getTcSettingsForCurrentUser } from "@/lib/queries/tc-settings";

export default async function TcBillingPage() {
  const [data, settings] = await Promise.all([
    getBillingDashboardData(),
    getTcSettingsForCurrentUser(),
  ]);
  const taxRatePercent = settings?.billingTaxRatePercent ?? 4.875;

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <h2 className="font-display text-heading-lg text-brand-navy">Billing</h2>
        <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
          Track invoice drafts and accounts receivable for full TC transactions, MLS-only jobs, and
          custom work. Accounting sync is scaffolded but not connected to QuickBooks, Profit Power,
          provider email, tax filing, or payment processors yet.
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
        contacts={data.contacts}
        taxRatePercent={taxRatePercent}
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
          <BillingInvoiceListClient invoices={data.invoices} />
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="Tax reporting scaffold">
        <ReportCard
          title="NM quarterly GRT"
          summary={data.taxReports.nmQuarterly[0]}
          note={`Default rate ${taxRatePercent}% from TC settings. Local NM rates vary by reporting location.`}
        />
        <ReportCard
          title="Federal quarterly"
          summary={data.taxReports.federalQuarterly[0]}
          note="Tracks gross receipts for quarterly estimate review. Filing math stays with accounting software or CPA review."
        />
        <ReportCard
          title="Year end"
          summary={data.taxReports.yearEnd[0]}
          note="Annual gross receipts, tax collected, and open balance scaffold for 1099/accounting review."
        />
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

function ReportCard({
  title,
  summary,
  note,
}: {
  title: string;
  summary?: {
    period: string;
    invoiceCount: number;
    subtotalLabel: string;
    taxLabel: string;
    totalLabel: string;
  };
  note: string;
}) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{title}</p>
      <p className="mt-2 font-display text-heading-md text-brand-navy">
        {summary?.period ?? "No data"}
      </p>
      <p className="mt-1 font-sans text-sm text-neutral-700">
        Gross {summary?.totalLabel ?? "$0.00"} · Tax {summary?.taxLabel ?? "$0.00"}
      </p>
      <p className="mt-2 font-sans text-xs text-neutral-600">{note}</p>
    </div>
  );
}
