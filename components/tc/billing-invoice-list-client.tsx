"use client";

import Link from "next/link";
import { Mail, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BillingInvoiceListItem } from "@/lib/queries/billing-dashboard";

export function BillingInvoiceListClient({ invoices }: { invoices: BillingInvoiceListItem[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("issue_desc");
  const visibleInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? invoices.filter((invoice) =>
          [
            invoice.invoiceNumber,
            invoice.brokerName,
            invoice.sourceLabel,
            invoice.statusLabel,
            invoice.receivableStatusLabel,
            invoice.issueDate,
            invoice.dueDate,
            invoice.paidAt,
            invoice.totalLabel,
            invoice.receivedLabel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : invoices;
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "issue_asc":
          return a.issueDate.localeCompare(b.issueDate);
        case "broker_asc":
          return (a.brokerName ?? "").localeCompare(b.brokerName ?? "");
        case "total_desc":
          return b.totalCents - a.totalCents;
        case "balance_desc":
          return b.balanceCents - a.balanceCents;
        case "received_desc":
          return b.receivedCents - a.receivedCents;
        case "issue_desc":
        default:
          return b.issueDate.localeCompare(a.issueDate);
      }
    });
  }, [invoices, query, sort]);
  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selectedIds.includes(invoice.id)),
    [invoices, selectedIds],
  );
  const visibleIds = visibleInvoices.map((invoice) => invoice.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleAll() {
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
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

      <div className="grid grid-cols-1 gap-3 rounded-brand-lg border border-neutral-300 bg-white p-3 shadow-brand-sm lg:grid-cols-[1fr_14rem]">
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Search invoices
          </span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Broker, invoice, status, source, amount"
              className="h-10 w-full rounded-brand-md border border-neutral-300 bg-white pl-9 pr-3 font-sans text-ui-body"
            />
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body"
          >
            <option value="issue_desc">Newest billed</option>
            <option value="issue_asc">Oldest billed</option>
            <option value="broker_asc">Broker A-Z</option>
            <option value="total_desc">Total billed</option>
            <option value="received_desc">Total received</option>
            <option value="balance_desc">Open balance</option>
          </select>
        </label>
      </div>

      <ul className="flex flex-col gap-3">
        {visibleInvoices.length === 0 ? (
          <li className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
            No invoices match your search.
          </li>
        ) : null}
        {visibleInvoices.map((invoice) => (
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
                    {invoice.dueDate ? ` · Due ${invoice.dueDate}` : ""}
                    {invoice.paidAt ? ` · Paid ${invoice.paidAt}` : ""} · Billed{" "}
                    {invoice.totalLabel} · Received {invoice.receivedLabel} · Tax received{" "}
                    {invoice.taxOnReceivedLabel} · Balance {invoice.balanceLabel}
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
