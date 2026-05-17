import Link from "next/link";
import { BillingInvoiceForm } from "@/components/tc/billing-invoice-form";
import { BillingWorkspaceNav } from "@/components/tc/billing-workspace-nav";
import { DEFAULT_NM_GRT_RATE_PERCENT } from "@/lib/billing/invoices";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";
import { getTcSettingsForCurrentUser } from "@/lib/queries/tc-settings";

export default async function TcBillingPage() {
  const [data, settings] = await Promise.all([
    getBillingDashboardData(),
    getTcSettingsForCurrentUser(),
  ]);
  const taxRatePercent = settings?.billingTaxRatePercent ?? DEFAULT_NM_GRT_RATE_PERCENT;

  return (
    <div className="flex flex-col gap-6">
      <BillingWorkspaceNav />

      <header className="border-b border-neutral-300 pb-5">
        <h2 className="font-display text-heading-lg text-brand-navy">Billing</h2>
        <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
          Track invoice drafts and accounts receivable for full TC transactions, MLS-only jobs, and
          custom work. Accounting sync is scaffolded but not connected to QuickBooks, Profit Power,
          provider email, tax filing, or payment processors yet.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="Billing summaries">
        <SummaryCard title="Monthly" summary={data.monthly[0]} href="/tc/reports/billing?period=month" />
        <SummaryCard title="Quarterly" summary={data.quarterly[0]} href="/tc/reports/billing?period=quarter" />
        <SummaryCard title="Yearly" summary={data.yearly[0]} href="/tc/reports/billing?period=year" />
      </section>

      <BillingInvoiceForm
        serviceTypes={data.serviceTypes}
        transactions={data.transactions}
        mlsJobs={data.mlsJobs}
        contacts={data.contacts}
        taxRatePercent={taxRatePercent}
      />

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 font-sans text-sm text-neutral-700 shadow-brand-sm">
        <h3 className="font-display text-heading-sm text-brand-navy">Tax settings</h3>
        <p className="mt-2">
          Billing summaries show total billed, total received, and taxes on received money. The
          default invoice tax rate is {taxRatePercent}% from TC settings and should be adjusted when
          the location-specific New Mexico rate differs.
        </p>
      </section>

      <section className="rounded-brand-lg border border-brand-gold/40 bg-brand-gold/10 p-5 font-sans text-sm text-brand-navy">
        <h3 className="font-display text-heading-sm">Accounting integration path</h3>
        <p className="mt-2 text-neutral-700">
          P24 only records invoice and receivable data. QuickBooks, Profit Power, payment services,
          provider email, and tax filing require separate approval, credentials, provider terms, and
          sandbox testing.
        </p>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  summary,
  href,
}: {
  title: string;
  summary?: {
    period: string;
    invoiceCount: number;
    totalLabel: string;
    receivedLabel: string;
    taxOnReceivedLabel: string;
    taxLabel: string;
  };
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm transition-colors hover:bg-neutral-50"
    >
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{title}</p>
      <p className="mt-2 font-display text-heading-md text-brand-navy">
        {summary?.totalLabel ?? "$0.00"}
      </p>
      <p className="mt-1 font-sans text-sm text-neutral-700">
        Received {summary?.receivedLabel ?? "$0.00"} · Tax billed {summary?.taxLabel ?? "$0.00"}
      </p>
      <p className="mt-1 font-sans text-sm text-neutral-700">
        Tax on received{" "}
        {summary?.taxOnReceivedLabel ?? "$0.00"}
      </p>
      <p className="mt-1 font-sans text-xs text-neutral-600">
        {summary ? `${summary.invoiceCount} invoice(s) · open report` : "No invoices · open report"}
      </p>
    </Link>
  );
}
