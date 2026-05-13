import type { BillingInvoiceListItem } from "@/lib/queries/billing-dashboard";

export function BillingReportTable({ invoices }: { invoices: BillingInvoiceListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white shadow-brand-sm">
      <table className="w-full min-w-[920px] text-left font-sans text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-ui-label uppercase tracking-wide text-neutral-600">
          <tr>
            <th className="px-4 py-3">Person billed</th>
            <th className="px-4 py-3">Date billed</th>
            <th className="px-4 py-3">Date paid</th>
            <th className="px-4 py-3">Amount billed</th>
            <th className="px-4 py-3">Amount received</th>
            <th className="px-4 py-3">Tax billed</th>
            <th className="px-4 py-3">Tax on received</th>
            <th className="px-4 py-3">Balance</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-neutral-600" colSpan={8}>
                No invoices in this report window.
              </td>
            </tr>
          ) : null}
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-neutral-100">
              <td className="px-4 py-3 font-semibold text-brand-navy">
                {invoice.brokerName ?? "Broker TBD"}
              </td>
              <td className="px-4 py-3">{invoice.issueDate}</td>
              <td className="px-4 py-3">{invoice.paidAt ?? "Not paid"}</td>
              <td className="px-4 py-3">{invoice.totalLabel}</td>
              <td className="px-4 py-3">{invoice.receivedLabel}</td>
              <td className="px-4 py-3">{invoice.taxLabel}</td>
              <td className="px-4 py-3">{invoice.taxOnReceivedLabel}</td>
              <td className="px-4 py-3">{invoice.balanceLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
