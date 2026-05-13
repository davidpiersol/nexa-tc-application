"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

async function getCsrfToken(): Promise<string | null> {
  const csrfRes = await fetch("/api/csrf", { credentials: "include" });
  const json = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

const PROPERTY_TYPE_OPTIONS = [
  "",
  "Residential",
  "Residential Income",
  "Vacant Land",
  "Farm/Ranch",
  "Commercial",
  "Manufactured Home",
  "Other",
] as const;

export function MlsEntryJobForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    const token = await getCsrfToken();
    if (!token) {
      setPending(false);
      setError("Security token missing. Refresh and try again.");
      return;
    }

    const read = (key: string) => String(formData.get(key) ?? "").trim();
    const payload = {
      requesting_broker_name: read("requesting_broker_name"),
      listing_broker_name: read("listing_broker_name"),
      listing_client_name: read("listing_client_name"),
      seller_names: read("seller_names"),
      property_address: read("property_address"),
      property_legal_description: read("property_legal_description"),
      property_type: read("property_type"),
      parcel_number: read("parcel_number"),
      acreage: read("acreage"),
      list_price: read("list_price"),
      mls_number: read("mls_number"),
      general_notes: read("general_notes"),
      status: read("status"),
      billing_status: read("billing_status"),
    };

    const res = await fetch("/api/mls-entry-jobs", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify(payload),
    });
    setPending(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not create MLS entry job.");
      return;
    }

    router.push("/tc/mls-entry");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-4 rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm lg:grid-cols-2"
    >
      <Input label="Requesting broker" name="requesting_broker_name" required />
      <Input label="Listing broker" name="listing_broker_name" />
      <Input label="Listing client" name="listing_client_name" />
      <Input label="Seller name(s)" name="seller_names" />
      <Input label="Property address" name="property_address" required />
      <Input label="Parcel / account number" name="parcel_number" />
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Legal description
        </span>
        <textarea
          name="property_legal_description"
          rows={3}
          className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Property type
        </span>
        <select
          name="property_type"
          defaultValue=""
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          {PROPERTY_TYPE_OPTIONS.map((value) => (
            <option key={value || "blank"} value={value}>
              {value || "Select property type"}
            </option>
          ))}
        </select>
      </label>
      <Input label="Acreage / lot size" name="acreage" />
      <Input label="List price" name="list_price" inputMode="decimal" />
      <Input label="MLS number" name="mls_number" />
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Job status
        </span>
        <select
          name="status"
          defaultValue="draft"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="draft">Draft</option>
          <option value="ready_for_entry">Ready for MLS entry</option>
          <option value="submitted">Submitted to MLS</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Billing status
        </span>
        <select
          name="billing_status"
          defaultValue="not_invoiced"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          <option value="not_invoiced">Not invoiced</option>
          <option value="ready_to_invoice">Ready to invoice</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          General notes
        </span>
        <textarea
          name="general_notes"
          rows={4}
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
          {pending ? "Creating…" : "Create MLS entry job"}
        </Button>
      </div>
    </form>
  );
}
