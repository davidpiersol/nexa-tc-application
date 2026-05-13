import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBillingInvoiceDetail } from "@/lib/queries/billing-invoice-detail";

export default async function BillingInvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await getBillingInvoiceDetail(params.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-heading-lg text-brand-navy">
              {invoice.invoiceNumber ?? "Draft invoice"}
            </h2>
            <p className="mt-1 font-sans text-ui-body text-neutral-600">
              {invoice.brokerName ?? "Broker TBD"} · {invoice.statusLabel} · AR:{" "}
              {invoice.receivableStatusLabel}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/tc/billing">Back to billing</Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Metric label="Total" value={invoice.totalLabel} />
        <Metric label="Balance" value={invoice.balanceLabel} />
        <Metric label="Tax" value={`${invoice.taxLabel} (${invoice.taxRatePercent}%)`} />
        <Metric label="Due" value={invoice.dueDate ?? invoice.issueDate} />
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-sm text-brand-navy">Line items</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left font-sans text-sm">
            <thead className="border-b border-neutral-200 text-ui-label uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Line total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-3 pr-4 text-brand-navy">{item.description}</td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 pr-4">{item.unitAmountLabel}</td>
                  <td className="py-3 pr-4">{item.lineTotalLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <InfoCard title="Payment terms" body={invoice.paymentTerms} />
        <InfoCard title="Reminder" body={invoice.reminderLabel} />
        <InfoCard
          title="Provider status"
          body={`Accounting: ${invoice.accountingSyncStatus}; Email: ${invoice.emailDeliveryStatus}`}
        />
      </section>

      {invoice.notes ? (
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 font-sans text-sm text-neutral-700 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Notes</h3>
          <p className="mt-2 whitespace-pre-wrap">{invoice.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{label}</p>
      <p className="mt-2 font-display text-heading-sm text-brand-navy">{value}</p>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{title}</p>
      <p className="mt-2 font-sans text-sm text-neutral-700">{body}</p>
    </div>
  );
}
