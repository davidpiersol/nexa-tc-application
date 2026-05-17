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
            className="break-after-page rounded-brand-lg border border-neutral-300 bg-white p-8 font-sans text-neutral-900 shadow-brand-sm print:rounded-none print:border-neutral-300 print:p-6 print:shadow-none"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="font-display text-[2.75rem] leading-none text-brand-navy">Invoice</h3>
              <div className="grid min-w-64 grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-neutral-600">DATE:</span>
                <span>{invoice.issueDate}</span>
                <span className="font-semibold text-neutral-600">INVOICE #</span>
                <span>{invoice.invoiceNumber ?? "Draft"}</span>
                <span className="font-semibold text-neutral-600">Customer ID:</span>
                <span>{invoice.brokerContactId?.slice(0, 8).toUpperCase() ?? "Manual"}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 bg-brand-navy px-3 py-1 font-display text-sm font-semibold text-white">
                  To:
                </p>
                <div className="min-h-24 border border-neutral-300 p-3 text-sm">
                  <p className="font-semibold">{invoice.brokerName ?? "Client TBD"}</p>
                  {invoice.brokerEmail ? <p>{invoice.brokerEmail}</p> : null}
                  <p className="mt-2 text-neutral-600">{invoice.sourceLabel}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 bg-brand-navy px-3 py-1 font-display text-sm font-semibold text-white">
                  From:
                </p>
                <div className="min-h-24 border border-neutral-300 p-3 text-sm">
                  <p className="font-semibold">{data.sender.name}</p>
                  {data.sender.company ? <p>{data.sender.company}</p> : null}
                  {data.sender.address ? <p>{data.sender.address}</p> : null}
                  {data.sender.phone ? <p>{data.sender.phone}</p> : null}
                  {data.sender.email ? <p>{data.sender.email}</p> : null}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 border-y border-neutral-300 py-4 text-sm sm:grid-cols-4">
              <Field label="Broker" value={invoice.brokerName ?? "TBD"} />
              <Field label="Job" value={invoice.sourceLabel} />
              <Field label="Payment Terms" value={invoice.paymentTerms} />
              <Field label="Due Date" value={invoice.dueDate ?? invoice.issueDate} />
            </div>

            <table className="mt-8 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-brand-navy text-white">
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lineItems.length
                  ? invoice.lineItems
                  : [
                      {
                        id: "fallback",
                        quantity: "1",
                        description: "Choral Point service",
                        unitAmountLabel: invoice.totalLabel,
                        lineTotalLabel: invoice.totalLabel,
                      },
                    ]).map((item) => (
                  <tr key={item.id} className="border-b border-neutral-200">
                    <td className="px-3 py-3">{item.quantity}</td>
                    <td className="px-3 py-3">{item.description}</td>
                    <td className="px-3 py-3 text-right">{item.unitAmountLabel}</td>
                    <td className="px-3 py-3 text-right">{item.lineTotalLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <TotalLine label="Subtotal" value={invoice.totalCents - invoice.taxCents} />
                <TotalLabel label={`Sales Tax (${invoice.taxRatePercent}%)`} value={invoice.taxLabel} />
                <TotalLabel label="Total" value={invoice.totalLabel} strong />
                <TotalLabel label="Balance Due" value={invoice.balanceLabel} strong />
              </dl>
            </div>

            <footer className="mt-10 border-t border-neutral-300 pt-4 text-center text-sm text-neutral-700">
              <p>Make all checks payable to {data.sender.company ?? data.sender.name}</p>
              <p className="mt-1 font-semibold text-brand-navy">Thank you for your business!</p>
              <p className="mt-3 text-xs">
                {[data.sender.name, data.sender.address, data.sender.phone, data.sender.email]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
            </footer>
          </article>
        ))
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-neutral-600">{label}</p>
      <p className="mt-1 text-brand-navy">{value}</p>
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: number }) {
  return <TotalLabel label={label} value={new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value / 100)} />;
}

function TotalLabel({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-200 pb-2">
      <dt className={strong ? "font-semibold text-brand-navy" : "text-neutral-600"}>{label}</dt>
      <dd className={strong ? "font-semibold text-brand-navy" : "text-neutral-900"}>{value}</dd>
    </div>
  );
}
