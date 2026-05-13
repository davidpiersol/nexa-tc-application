import Link from "next/link";
import { BarChart3, BriefcaseBusiness, ContactRound, FileText, Home } from "lucide-react";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";

const plannedReports = [
  {
    title: "Contacts",
    description: "Contact categories, SOI segmentation, duplicate cleanup, and activity coverage.",
    href: "/tc/reports/contacts",
    icon: ContactRound,
    status: "Planned",
  },
  {
    title: "Brokers",
    description: "Broker clients, signing preferences, active files, billing totals, and missing profile data.",
    href: "/tc/reports/brokers",
    icon: BriefcaseBusiness,
    status: "Planned",
  },
  {
    title: "Transactions & listings",
    description: "Pipeline movement, closed files, MLS-only jobs, archive timing, and listing workload.",
    href: "/tc/reports/listings",
    icon: Home,
    status: "Planned",
  },
  {
    title: "Document operations",
    description: "Generated documents, review statuses, signatures, package readiness, and missing forms.",
    href: "/tc/reports/documents",
    icon: FileText,
    status: "Planned",
  },
];

export default async function TcReportsPage() {
  const data = await getBillingDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <h2 className="font-display text-heading-lg text-brand-navy">Reports</h2>
        <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
          Universal report hub for Choral Point workspaces. Billing is the first live report; the
          other report families are scaffolded here so page-specific reporting can land consistently.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ReportMetric title="Monthly billing" summary={data.monthly[0]} href="/tc/reports/billing?period=month" />
        <ReportMetric title="Quarterly billing" summary={data.quarterly[0]} href="/tc/reports/billing?period=quarter" />
        <ReportMetric title="Year-end billing" summary={data.yearly[0]} href="/tc/reports/billing?period=year" />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ReportCard
          title="Billing collections"
          description="Total billed, total received, taxes on received money, open balances, and invoice detail rows."
          href="/tc/reports/billing"
          icon={BarChart3}
          status="Live"
        />
        {plannedReports.map((report) => (
          <ReportCard key={report.title} {...report} />
        ))}
      </section>
    </div>
  );
}

function ReportMetric({
  title,
  summary,
  href,
}: {
  title: string;
  summary?: { totalLabel: string; receivedLabel: string; taxOnReceivedLabel: string };
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
        Received {summary?.receivedLabel ?? "$0.00"} · Tax {summary?.taxOnReceivedLabel ?? "$0.00"}
      </p>
    </Link>
  );
}

function ReportCard({
  title,
  description,
  href,
  icon: Icon,
  status,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof BarChart3;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm transition-colors hover:bg-neutral-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-brand-md bg-brand-gold/15 p-2 text-brand-navy">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-heading-sm text-brand-navy">{title}</h3>
            <p className="mt-1 font-sans text-sm text-neutral-600">{description}</p>
          </div>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 font-sans text-xs font-semibold text-neutral-700">
          {status}
        </span>
      </div>
    </Link>
  );
}
