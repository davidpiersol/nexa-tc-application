"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BillingServiceTypeOption, BillingSourceOption } from "@/lib/queries/billing-dashboard";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Props = {
  serviceTypes: BillingServiceTypeOption[];
  transactions: BillingSourceOption[];
  mlsJobs: BillingSourceOption[];
};

async function getCsrfToken(): Promise<string | null> {
  const csrfRes = await fetch("/api/csrf", { credentials: "include" });
  const json = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

export function BillingInvoiceForm({ serviceTypes, transactions, mlsJobs }: Props) {
  const router = useRouter();
  const [serviceCode, setServiceCode] = useState(serviceTypes[0]?.code ?? "custom");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedService = useMemo(
    () => serviceTypes.find((service) => service.code === serviceCode),
    [serviceCode, serviceTypes],
  );
  const defaultAmount = ((selectedService?.defaultAmountCents ?? 0) / 100).toFixed(2);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setPending(true);
    const formData = new FormData(form);
    const token = await getCsrfToken();
    if (!token) {
      setPending(false);
      setError("Security token missing. Refresh and try again.");
      return;
    }
    const read = (key: string) => String(formData.get(key) ?? "").trim();
    const sourceTransactionId = read("source_transaction_id");
    const sourceMlsJobId = read("source_mls_entry_job_id");
    if (sourceTransactionId && sourceMlsJobId) {
      setPending(false);
      setError("Choose either a transaction source or an MLS-only source, not both.");
      return;
    }

    const res = await fetch("/api/billing/invoices", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({
        broker_name: read("broker_name"),
        service_code: serviceCode,
        description: read("description"),
        quantity: read("quantity"),
        unit_amount: read("unit_amount"),
        tax_amount: read("tax_amount"),
        status: read("status"),
        receivable_status: read("receivable_status"),
        issue_date: read("issue_date"),
        due_date: read("due_date"),
        source_transaction_id: sourceTransactionId || null,
        source_mls_entry_job_id: sourceMlsJobId || null,
        notes: read("notes"),
      }),
    });
    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not create invoice.");
      return;
    }

    form.reset();
    setServiceCode(serviceTypes[0]?.code ?? "custom");
    router.replace(`/tc/billing?created=${Date.now()}`);
  }

  return (
    <form
      id="new-invoice"
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
      <Input label="Broker / client to invoice" name="broker_name" required />
      <Input
        label="Description"
        name="description"
        defaultValue={selectedService?.name ?? "Choral Point service"}
        required
      />
      <Input label="Quantity" name="quantity" defaultValue="1" inputMode="decimal" required />
      <Input label="Unit amount" name="unit_amount" defaultValue={defaultAmount} inputMode="decimal" required />
      <Input label="Tax amount" name="tax_amount" defaultValue="0.00" inputMode="decimal" />
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Invoice status
        </span>
        <select
          name="status"
          defaultValue="draft"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Receivable status
        </span>
        <select
          name="receivable_status"
          defaultValue="not_sent"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="not_sent">Not sent</option>
          <option value="sent">Sent</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
        </select>
      </label>
      <Input label="Issue date" name="issue_date" type="date" />
      <Input label="Due date" name="due_date" type="date" />
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Transaction source
        </span>
        <select
          name="source_transaction_id"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="">None</option>
          {transactions.map((transaction) => (
            <option key={transaction.id} value={transaction.id}>
              {transaction.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          MLS-only source
        </span>
        <select
          name="source_mls_entry_job_id"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="">None</option>
          {mlsJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Notes
        </span>
        <textarea
          name="notes"
          rows={3}
          className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-ui-body"
        />
      </label>
      {error ? (
        <p className="font-sans text-sm text-status-danger lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end lg:col-span-2">
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Creating…" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
