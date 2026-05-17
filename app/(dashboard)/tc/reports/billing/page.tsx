import { BillingReportTable } from "@/components/tc/billing-report-table";
import { BillingWorkspaceNav } from "@/components/tc/billing-workspace-nav";
import { invoicePeriodKey } from "@/lib/billing/invoices";
import { getBillingDashboardData, type BillingPeriodSummary } from "@/lib/queries/billing-dashboard";

type Period = "month" | "quarter" | "year";

export default async function TcBillingReportPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const data = await getBillingDashboardData();
  const period = normalizePeriod(searchParams.period);
  const summaries = period === "year" ? data.yearly : period === "quarter" ? data.quarterly : data.monthly;
  const activeSummary = summaries[0];
  const reportInvoices = activeSummary
    ? data.invoices.filter((invoice) => invoicePeriodKey(invoice.issueDate, period) === activeSummary.period)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <BillingWorkspaceNav />

      <header className="border-b border-neutral-300 pb-5">
        <h2 className="font-display text-heading-lg text-brand-navy">Billing report</h2>
        <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
          Quick reporting for invoices, received money, and taxes on received money. Filing and
          provider sync stay separate until accounting integration is approved.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <PeriodPill href="/tc/reports/billing?period=month" active={period === "month"} label="Monthly" />
        <PeriodPill href="/tc/reports/billing?period=quarter" active={period === "quarter"} label="Quarterly" />
        <PeriodPill href="/tc/reports/billing?period=year" active={period === "year"} label="Yearly" />
      </div>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Metric title="Total billed" value={activeSummary?.totalLabel ?? "$0.00"} />
        <Metric title="Total received" value={activeSummary?.receivedLabel ?? "$0.00"} />
        <Metric title="Tax billed" value={activeSummary?.taxLabel ?? "$0.00"} />
        <Metric title="Taxes on received" value={activeSummary?.taxOnReceivedLabel ?? "$0.00"} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {summaries.slice(0, 3).map((summary) => (
          <PeriodSummary key={summary.period} summary={summary} />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-display text-heading-sm text-brand-navy">Invoice detail</h3>
          <p className="font-sans text-sm text-neutral-600">
            Person billed, date billed, date paid, amount billed, amount received, tax billed, tax
            on received, and remaining balance.
          </p>
        </div>
        <BillingReportTable invoices={reportInvoices} />
      </section>
    </div>
  );
}

function normalizePeriod(value: string | undefined): Period {
  return value === "quarter" || value === "year" ? value : "month";
}

function PeriodPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={
        active
          ? "rounded-full bg-brand-navy px-4 py-2 font-sans text-sm font-semibold text-white"
          : "rounded-full border border-neutral-300 bg-white px-4 py-2 font-sans text-sm font-semibold text-brand-navy"
      }
    >
      {label}
    </a>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{title}</p>
      <p className="mt-2 font-display text-heading-md text-brand-navy">{value}</p>
    </div>
  );
}

function PeriodSummary({ summary }: { summary: BillingPeriodSummary }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
        {summary.period}
      </p>
      <p className="mt-2 font-display text-heading-sm text-brand-navy">{summary.totalLabel}</p>
      <p className="mt-1 font-sans text-sm text-neutral-700">
        Received {summary.receivedLabel} · Tax billed {summary.taxLabel}
      </p>
      <p className="mt-1 font-sans text-sm text-neutral-700">
        Tax on received {summary.taxOnReceivedLabel}
      </p>
      <p className="mt-1 font-sans text-xs text-neutral-600">
        {summary.invoiceCount} invoice(s) · Open {summary.balanceLabel}
      </p>
    </div>
  );
}
