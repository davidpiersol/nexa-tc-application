import Link from "next/link";
import { BillingInvoiceEditForm } from "@/components/tc/billing-invoice-edit-form";
import { BillingWorkspaceNav } from "@/components/tc/billing-workspace-nav";
import { Button } from "@/components/ui/button";
import { getBillingDashboardData } from "@/lib/queries/billing-dashboard";
import { getBillingInvoiceDetail } from "@/lib/queries/billing-invoice-detail";

export default async function BillingInvoiceEditPage({ params }: { params: { id: string } }) {
  const [invoice, billingData] = await Promise.all([
    getBillingInvoiceDetail(params.id),
    getBillingDashboardData(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BillingWorkspaceNav />

      <header className="border-b border-neutral-300 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
              Edit invoice
            </p>
            <h2 className="mt-1 font-display text-heading-lg text-brand-navy">
              {invoice.invoiceNumber ?? "Draft invoice"}
            </h2>
            <p className="mt-1 font-sans text-ui-body text-neutral-600">
              Update bill-to, line item, tax, dates, status, and notes.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/tc/billing/${invoice.id}`}>Back to invoice</Link>
          </Button>
        </div>
      </header>

      <BillingInvoiceEditForm
        invoice={invoice}
        serviceTypes={billingData.serviceTypes}
        contacts={billingData.contacts}
      />
    </div>
  );
}
