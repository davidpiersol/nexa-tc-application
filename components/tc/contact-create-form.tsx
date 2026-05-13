"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  contactCategoryLabel,
  CONTACT_CATEGORIES,
  sortedContactCategoriesForUi,
  type ContactCategory,
} from "@/lib/contacts/categories";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import {
  SIGNING_DELIVERY_MODE,
  SIGNING_PROVIDERS,
} from "@/lib/signing/signing-workflow";

const SALUTATION_OPTIONS = ["", "Mr.", "Mrs.", "Ms.", "Dr.", "Rev.", "Hon."] as const;
const SUFFIX_OPTIONS = ["", "Jr.", "Sr.", "II", "III", "IV", "Esq."] as const;
const BROKERAGE_OPTIONS = ["", "ReMax", "Coldwell Banker", "Keller Williams", "eXp Realty", "Other"] as const;

async function getCsrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return body.csrfToken ?? null;
}

export function ContactCreateForm({ brokerMode = false }: { brokerMode?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [showBrokerageOther, setShowBrokerageOther] = useState(false);

  const sortedCategories = useMemo(() => sortedContactCategoriesForUi(), []);

  return (
    <form
      className="grid grid-cols-1 gap-4 rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm lg:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setSaving(true);
        try {
          const form = new FormData(event.currentTarget);
          const token = await getCsrfToken();
          if (!token) {
            setError("Could not load CSRF token.");
            return;
          }

          const selectedCategories = sortedCategories.filter((category) =>
            form.getAll("categories").includes(category),
          ) as ContactCategory[];
          const categories = brokerMode
            ? Array.from(new Set([...selectedCategories, "broker" as ContactCategory]))
            : selectedCategories;

          const brokerage = String(form.get("brokerage") ?? "").trim();
          const brokerageOther = String(form.get("brokerageOther") ?? "").trim();
          const brokerageValue = brokerage === "Other" ? brokerageOther : brokerage;

          const res = await fetch("/api/contacts", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              [CSRF_HEADER_NAME]: token,
            },
            body: JSON.stringify({
              salutation: String(form.get("salutation") ?? "").trim(),
              firstName: String(form.get("firstName") ?? "").trim(),
              middleName: String(form.get("middleName") ?? "").trim(),
              lastName: String(form.get("lastName") ?? "").trim(),
              suffix: String(form.get("suffix") ?? "").trim(),
              email: String(form.get("email") ?? "").trim(),
              phone: String(form.get("phone") ?? "").trim(),
              company: String(form.get("company") ?? "").trim(),
              addressLine1: String(form.get("addressLine1") ?? "").trim(),
              addressLine2: String(form.get("addressLine2") ?? "").trim(),
              city: String(form.get("city") ?? "").trim(),
              state: String(form.get("state") ?? "").trim(),
              postalCode: String(form.get("postalCode") ?? "").trim(),
              country: String(form.get("country") ?? "").trim(),
              notes: String(form.get("notes") ?? "").trim(),
              categories,
              otherCategoryDescription: String(form.get("otherCategoryDescription") ?? "").trim(),
              brokerProfile: brokerMode
                ? {
                    brokerage: brokerageValue,
                    signingPlatform: String(form.get("signingPlatform") ?? "").trim(),
                    signingPreference: String(form.get("signingPreference") ?? "").trim(),
                  }
                : undefined,
            }),
          });
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
            contactId?: string;
          };
          if (!res.ok || !body.contactId) {
            setError(body.error ?? "Could not create record.");
            return;
          }
          router.push(brokerMode ? `/tc/brokers/${body.contactId}` : `/tc/contacts/${body.contactId}`);
          router.refresh();
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Salutation</span>
        <select
          name="salutation"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          {SALUTATION_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value || "None"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Suffix</span>
        <select
          name="suffix"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        >
          {SUFFIX_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value || "None"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          First name
        </span>
        <input
          required
          name="firstName"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Middle name
        </span>
        <input
          name="middleName"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Last name
        </span>
        <input
          required
          name="lastName"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Company</span>
        <input
          name="company"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Email</span>
        <input
          name="email"
          type="email"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Phone</span>
        <input
          name="phone"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>

      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Address line 1
        </span>
        <input
          name="addressLine1"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Address line 2
        </span>
        <input
          name="addressLine2"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">City</span>
        <input
          name="city"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">State</span>
        <input
          name="state"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">ZIP</span>
        <input
          name="postalCode"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Country</span>
        <input
          name="country"
          className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
        />
      </label>

      <fieldset className="rounded-brand-md border border-neutral-200 p-3 lg:col-span-2">
        <legend className="px-1 font-sans text-ui-label uppercase tracking-wide text-neutral-900">
          Categories
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sortedCategories.map((category) => (
            <label key={category} className="flex items-center gap-2 font-sans text-sm text-neutral-700">
              <input
                type="checkbox"
                name="categories"
                value={category}
                defaultChecked={brokerMode && category === "broker"}
                disabled={brokerMode && category === "broker"}
                onChange={(event) => {
                  if (category === "other") {
                    setShowOtherCategory(event.currentTarget.checked);
                  }
                }}
                className="size-4 accent-brand-gold"
              />
              <span>{contactCategoryLabel(category)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showOtherCategory ? (
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Other category description
          </span>
          <input
            name="otherCategoryDescription"
            className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
          />
        </label>
      ) : null}

      {brokerMode ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Brokerage
            </span>
            <select
              name="brokerage"
              onChange={(event) => setShowBrokerageOther(event.currentTarget.value === "Other")}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            >
              {BROKERAGE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value || "Select brokerage"}
                </option>
              ))}
            </select>
          </label>
          {showBrokerageOther ? (
            <label className="flex flex-col gap-1.5">
              <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                Brokerage (other)
              </span>
              <input
                name="brokerageOther"
                className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
              />
            </label>
          ) : (
            <div />
          )}
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              E-sign provider
            </span>
            <select
              name="signingPlatform"
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            >
              {SIGNING_PROVIDERS.map((provider) => (
                <option key={provider.slug} value={provider.slug}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Signing method
            </span>
            <select
              name="signingPreference"
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            >
              <option value={SIGNING_DELIVERY_MODE.emailLink}>Email signing link</option>
              <option value={SIGNING_DELIVERY_MODE.providerPortal}>Provider portal handoff</option>
              <option value={SIGNING_DELIVERY_MODE.manualExport}>Manual export packet</option>
            </select>
          </label>
        </>
      ) : null}

      <label className="flex flex-col gap-1.5 lg:col-span-2">
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-ui-body"
        />
      </label>

      {error ? <p className="lg:col-span-2 font-sans text-sm text-status-danger">{error}</p> : null}
      <div className="lg:col-span-2">
        <Button variant="gold" size="sm" type="submit" disabled={saving}>
          {saving ? "Saving…" : brokerMode ? "Create broker" : "Create contact"}
        </Button>
      </div>
    </form>
  );
}
