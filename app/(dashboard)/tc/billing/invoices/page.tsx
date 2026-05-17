import { BillingInvoiceListClient } from "@/components/tc/billing-invoice-list-client";
import { BillingWorkspaceNav } from "@/components/tc/billing-workspace-nav";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";

export default async function TcBillingInvoicesPage() {
  const data = await getBillingDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <BillingWorkspaceNav />

      <header className="border-b border-neutral-300 pb-5">
        <h2 className="font-display text-heading-lg text-brand-navy">Invoices</h2>
        <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">
          Search, sort, open, print, and email invoices without crowding the billing entry
          workspace.
        </p>
      </header>

      {data.invoices.length === 0 ? (
        <div className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
          No invoices yet.
        </div>
      ) : (
        <BillingInvoiceListClient invoices={data.invoices} />
      )}
    </div>
  );
}
