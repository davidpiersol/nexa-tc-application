"use client";

import Link from "next/link";
import { Mail, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BillingInvoiceListItem } from "@/lib/queries/billing-dashboard";

export function BillingInvoiceListClient({ invoices }: { invoices: BillingInvoiceListItem[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selectedIds.includes(invoice.id)),
    [invoices, selectedIds],
  );
  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : invoices.map((invoice) => invoice.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  const printHref =
    selectedIds.length > 0 ? `/tc/billing/print?ids=${encodeURIComponent(selectedIds.join(","))}` : null;
  const emailHref =
    selectedInvoices.length > 0
      ? `mailto:?subject=${encodeURIComponent("Choral Point invoice follow-up")}&body=${encodeURIComponent(
          selectedInvoices
            .map(
              (invoice) =>
                `${invoice.invoiceNumber ?? "Draft invoice"} - ${invoice.brokerName ?? "Broker TBD"} - ${invoice.totalLabel} - Balance ${invoice.balanceLabel}`,
            )
            .join("\n"),
        )}`
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-brand-lg border border-neutral-300 bg-white p-3 shadow-brand-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 font-sans text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 accent-brand-gold"
            aria-label="Select all invoices"
          />
          {selectedIds.length} selected
        </label>
        <div className="flex flex-wrap gap-2">
          {printHref ? (
            <Button asChild variant="secondary">
              <Link href={printHref} target="_blank">
                <Printer className="size-4" aria-hidden="true" />
                Print selected
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="secondary" disabled>
              <Printer className="size-4" aria-hidden="true" />
              Print selected
            </Button>
          )}
          {emailHref ? (
            <Button asChild variant="secondary">
              <a href={emailHref}>
                <Mail className="size-4" aria-hidden="true" />
                Email selected
              </a>
            </Button>
          ) : (
            <Button type="button" variant="secondary" disabled>
              <Mail className="size-4" aria-hidden="true" />
              Email selected
            </Button>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {invoices.map((invoice) => (
          <li
            key={invoice.id}
            className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(invoice.id)}
                  onChange={() => toggleOne(invoice.id)}
                  className="mt-1 size-4 accent-brand-gold"
                  aria-label={`Select ${invoice.invoiceNumber ?? "invoice"}`}
                />
                <div>
                  <Link
                    href={`/tc/billing/${invoice.id}`}
                    className="font-sans font-semibold text-brand-navy underline-offset-4 hover:underline"
                  >
                    {invoice.invoiceNumber ?? "Draft invoice"} · {invoice.totalLabel}
                  </Link>
                  <p className="mt-1 font-sans text-sm text-neutral-600">
                    {invoice.brokerName ?? "Broker TBD"} · {invoice.statusLabel} · AR:{" "}
                    {invoice.receivableStatusLabel}
                  </p>
                  <p className="mt-1 font-sans text-xs text-neutral-600">
                    {invoice.sourceLabel} · Issue {invoice.issueDate}
                    {invoice.dueDate ? ` · Due ${invoice.dueDate}` : ""} · Tax {invoice.taxLabel} ·
                    Balance {invoice.balanceLabel}
                  </p>
                  <p className="mt-1 font-sans text-xs text-neutral-600">
                    {invoice.reminderLabel} · Email: {invoice.emailDeliveryStatus.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 font-sans text-xs font-semibold text-neutral-700">
                Sync: {invoice.accountingSyncStatus.replace(/_/g, " ")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
