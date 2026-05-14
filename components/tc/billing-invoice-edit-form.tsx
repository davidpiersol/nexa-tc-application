"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateLineTotalCents,
  centsFromCurrencyInput,
  taxCentsFromRate,
} from "@/lib/billing/invoices";
import type { BillingInvoiceDetail } from "@/lib/queries/billing-invoice-detail";
import type { BillingContactOption, BillingServiceTypeOption } from "@/lib/queries/billing-dashboard";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Props = {
  invoice: BillingInvoiceDetail;
  serviceTypes: BillingServiceTypeOption[];
  contacts: BillingContactOption[];
};

async function getCsrfToken(): Promise<string | null> {
  const csrfRes = await fetch("/api/csrf", { credentials: "include" });
  const json = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function decimalQuantity(value: string): string {
  return value.endsWith(".00") ? value.slice(0, -3) : value;
}

export function BillingInvoiceEditForm({ invoice, serviceTypes, contacts }: Props) {
  const router = useRouter();
  const firstLine = invoice.lineItems[0];
  const [serviceCode, setServiceCode] = useState(serviceTypes[0]?.code ?? "custom");
  const [quantity, setQuantity] = useState(decimalQuantity(firstLine?.quantity ?? "1"));
  const [unitAmount, setUnitAmount] = useState(firstLine?.unitAmountLabel.replace(/[$,]/g, "") ?? "0.00");
  const [taxAmount, setTaxAmount] = useState(dollarsFromCents(invoice.taxCents));
  const [taxRatePercent, setTaxRatePercent] = useState(String(invoice.taxRatePercent));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const contactByLabel = useMemo(() => new Map(contacts.map((contact) => [contact.label, contact])), [contacts]);

  useEffect(() => {
    const lineTotalCents = calculateLineTotalCents(
      Number(quantity),
      centsFromCurrencyInput(unitAmount),
    );
    setTaxAmount(dollarsFromCents(taxCentsFromRate(lineTotalCents, Number(taxRatePercent))));
  }, [quantity, unitAmount, taxRatePercent]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const token = await getCsrfToken();
    if (!token) {
      setPending(false);
      setError("Security token missing. Refresh and try again.");
      return;
    }
    const read = (key: string) => String(formData.get(key) ?? "").trim();
    const brokerName = read("broker_name");
    const brokerContact = contactByLabel.get(brokerName) ?? contacts.find((contact) => contact.name === brokerName);
    const res = await fetch(`/api/billing/invoices/${invoice.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({
        broker_name: brokerContact?.name ?? brokerName,
        broker_contact_id: brokerContact?.id ?? invoice.brokerContactId,
        service_code: serviceCode,
        description: read("description"),
        quantity,
        unit_amount: unitAmount,
        tax_amount: taxAmount,
        tax_rate_percent: taxRatePercent,
        status: read("status"),
        receivable_status: read("receivable_status"),
        issue_date: read("issue_date"),
        due_date: read("due_date"),
        notes: read("notes"),
      }),
    });
    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not update invoice.");
      return;
    }

    router.push(`/tc/billing/${invoice.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-4 rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm lg:grid-cols-2"
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Service type
        </span>
        <select
          name="service_code"
          value={serviceCode}
          onChange={(event) => setServiceCode(event.target.value)}
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          {serviceTypes.map((service) => (
            <option key={service.id} value={service.code}>
              {service.name}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Broker / client to invoice"
        name="broker_name"
        list="billing-edit-contact-options"
        defaultValue={invoice.brokerName ?? ""}
        required
      />
      <datalist id="billing-edit-contact-options">
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.label}>
            {contact.name}
          </option>
        ))}
      </datalist>
      <Input label="Description" name="description" defaultValue={firstLine?.description ?? ""} required />
      <Input
        label="Quantity"
        name="quantity"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        inputMode="decimal"
        required
      />
      <Input
        label="Unit amount"
        name="unit_amount"
        value={unitAmount}
        onChange={(event) => setUnitAmount(event.target.value)}
        inputMode="decimal"
        required
      />
      <Input
        label="Tax rate (%)"
        name="tax_rate_percent"
        value={taxRatePercent}
        onChange={(event) => setTaxRatePercent(event.target.value)}
        inputMode="decimal"
        required
      />
      <Input
        label="Tax amount"
        name="tax_amount"
        value={taxAmount}
        onChange={(event) => setTaxAmount(event.target.value)}
        inputMode="decimal"
      />
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Invoice status
        </span>
        <select
          name="status"
          defaultValue={invoice.status}
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Receivable status
        </span>
        <select
          name="receivable_status"
          defaultValue={invoice.receivableStatus}
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="not_sent">Not sent</option>
          <option value="sent">Sent</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="void">Void</option>
        </select>
      </label>
      <Input label="Issue date" name="issue_date" type="date" defaultValue={invoice.issueDate} />
      <Input label="Due date" name="due_date" type="date" defaultValue={invoice.dueDate ?? invoice.issueDate} />
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Notes
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={invoice.notes ?? ""}
          className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-ui-body"
        />
      </label>
      {error ? (
        <p className="font-sans text-sm text-status-danger lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 lg:col-span-2">
        <Button type="button" variant="secondary" onClick={() => router.push(`/tc/billing/${invoice.id}`)}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Saving..." : "Save invoice"}
        </Button>
      </div>
    </form>
  );
}
